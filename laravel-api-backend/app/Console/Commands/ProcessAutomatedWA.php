<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\WaNotificationLog;
use App\Services\AgungApiService;

class ProcessAutomatedWA extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'wa:process-automation';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process finished queues, decrypt phone numbers, and send WA via Gateway';

    /**
     * Execute the console command.
     */
    public function handle(AgungApiService $apiService)
    {
        $this->info("Starting Automated WA Processor...");
        
        // 1. Ambil Tanggal Hari Ini
        $today = Carbon::today()->toDateString();
        
        // 2. Fetch Data CRM Lokal dari Cache
        $parsedList = Cache::get('wod_live_queues', []);
        
        if (empty($parsedList)) {
            $this->info("No data in cache 'wod_live_queues'. Exiting.");
            return Command::SUCCESS;
        }

        // URL Gateway Node.js (Phase 4) - default 127.0.0.1:3000
        $waGatewayUrl = env('WA_GATEWAY_URL', 'http://127.0.0.1:3000/send-message');

        $processedCount = 0;

        foreach ($parsedList as $vehicle) {
            // 3. Filter Selesai
            if (isset($vehicle['status']) && str_contains(strtoupper($vehicle['status']), 'SELESAI')) {
                // Plat nomor di CRM biasanya ada spasinya, kita butuh format dashe (BM-1234-AB)
                // AgungApiService -> getDecryptedPhoneByPlate sudah menghandle konversi spasi ke hyphen
                $rawPlate = trim($vehicle['plate'] ?? '');
                $customerName = trim($vehicle['customer'] ?? 'Pelanggan');

                if (empty($rawPlate)) continue;

                // 4. Looping & Idempotency Check (Anti-Spam)
                $alreadyLogged = WaNotificationLog::where('plat_no', $rawPlate)
                    ->where('notified_date', $today)
                    ->exists();

                if ($alreadyLogged) {
                    // Sudah dikirim hari ini, lewati
                    continue;
                }

                $this->info("Found new finished vehicle: {$rawPlate}. Processing...");

                // 5. Fetch & Decrypt Nomor HP
                $realPhone = $apiService->getDecryptedPhoneByPlate($rawPlate);

                if (!$realPhone) {
                    $this->warn("Failed to decrypt phone for {$rawPlate}. Logging error.");
                    WaNotificationLog::create([
                        'plat_no'         => $rawPlate,
                        'customer_name'   => $customerName,
                        'decrypted_phone' => null,
                        'status'          => 'DECRYPT_FAILED',
                        'error_details'   => 'Data tidak ditemukan di server pusat atau dekripsi gagal.',
                        'notified_date'   => $today,
                    ]);
                    continue;
                }
                
                // ==========================================
                // 🔒 SAFETY SWITCH (TEST MODE)
                // ==========================================
                $isTestMode = env('WA_TEST_MODE', false);
                $testPhone  = env('WA_TEST_PHONE', '');
                
                if ($isTestMode && !empty($testPhone)) {
                    $this->warn("\n[⚠️ SAFETY SWITCH AKTIF] Pesan untuk {$customerName} ({$rawPlate}) dialihkan dari {$realPhone} ke nomor Tester: {$testPhone}!");
                    $realPhone = $testPhone;
                }
                // ==========================================

                $this->info("Successfully decrypted phone for {$rawPlate}: {$realPhone}. Sending WA...");

                // 6. Compose & Dispatch WhatsApp
                $message = "Halo Bapak/Ibu *{$customerName}*,\n\nKendaraan Anda dengan nomor polisi *{$rawPlate}* telah selesai dikerjakan dan siap untuk diambil.\n\nTerima kasih telah mempercayakan perawatan kendaraan Anda kepada *Agung Toyota*.";

                try {
                    $response = Http::timeout(5)->post($waGatewayUrl, [
                        'number'  => $realPhone,
                        'message' => $message,
                    ]);

                    // 7. Audit Logging
                    if ($response->successful()) {
                        WaNotificationLog::create([
                            'plat_no'         => $rawPlate,
                            'customer_name'   => $customerName,
                            'decrypted_phone' => $realPhone,
                            'status'          => 'SENT',
                            'error_details'   => null,
                            'notified_date'   => $today,
                        ]);
                        $this->info("WA Sent successfully for {$rawPlate}");
                        $processedCount++;
                    } else {
                        WaNotificationLog::create([
                            'plat_no'         => $rawPlate,
                            'customer_name'   => $customerName,
                            'decrypted_phone' => $realPhone,
                            'status'          => 'FAILED',
                            'error_details'   => 'Gateway Error: ' . $response->status() . ' - ' . $response->body(),
                            'notified_date'   => $today,
                        ]);
                        $this->error("Gateway error for {$rawPlate}: " . $response->status());
                    }

                } catch (\Exception $e) {
                    WaNotificationLog::create([
                        'plat_no'         => $rawPlate,
                        'customer_name'   => $customerName,
                        'decrypted_phone' => $realPhone,
                        'status'          => 'FAILED',
                        'error_details'   => 'Gateway Unreachable: ' . $e->getMessage(),
                        'notified_date'   => $today,
                    ]);
                    $this->error("Gateway unreachable for {$rawPlate}: " . $e->getMessage());
                }
            }
        }

        $this->info("Automated WA Processor finished. Processed {$processedCount} new vehicles.");
        return Command::SUCCESS;
    }
}
