<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendWhatsappNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected array $vehicle;

    /**
     * Create a new job instance.
     */
    public function __construct(array $vehicle)
    {
        $this->vehicle = $vehicle;
    }

    /**
     * Execute the job to send WA message via Fonnte/Wablas gateway.
     */
    public function handle(): void
    {
        $phone = $this->vehicle['phone'] ?? null;
        $customer = $this->vehicle['customer'] ?? 'Pelanggan Toyota';
        $plate = $this->vehicle['plate'] ?? '-';

        if (!$phone) return;

        $message = "Halo Yth. Bpk/Ibu {$customer},\n\nKendaraan Anda dengan Nomor Polisi *{$plate}* telah SELESAI DIKERJAKAN di Bengkel Resmi Toyota. Silakan mengambil kendaraan Anda di area penyerahan.\n\nTerima kasih atas kepercayaan Anda pada layanan Toyota!";

        try {
            // Example WhatsApp Gateway API Integration (Fonnte)
            $response = Http::withHeaders([
                'Authorization' => env('FONNTE_TOKEN', 'MOCK_TOKEN'),
            ])->post('https://api.fonnte.com/send', [
                'target' => $phone,
                'message' => $message,
            ]);

            Log::info("WA notification sent for plate {$plate}: " . $response->body());
        } catch (\Exception $e) {
            Log::error("Failed to send WA notification for plate {$plate}: " . $e->getMessage());
        }
    }
}
