<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use App\Models\WaNotificationLog;
use DOMDocument;
use DOMXPath;
use Carbon\Carbon;

class SyncCrmData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sync:crm-data';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync live queue data from Toyota CRM server into cache and create WA notification logs for finished services';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $targetUrl = 'http://172.16.3.30/service/public/display/ruang-tunggu/ubta';
        $parsedList = [];

        try {
            $response = Http::timeout(5)->get($targetUrl);

            if ($response->successful()) {
                $html = $response->body();
                $parsedList = $this->parseToyotaHtmlTable($html);
            }
        } catch (\Exception $e) {
            $this->warn('Failed to reach Toyota CRM server: ' . $e->getMessage());
        }

        if (!empty($parsedList)) {
            // Save to Cache for instant retrieval by frontend
            Cache::put('wod_live_queues', $parsedList, now()->addMinutes(10));
            Cache::put('wod_last_synced', Carbon::now()->toIso8601String());

            // Process finished services for WA notifications (Idempotent per plate per day)
            $today = Carbon::today();
            foreach ($parsedList as $vehicle) {
                if (isset($vehicle['status']) && str_contains(strtoupper($vehicle['status']), 'SELESAI')) {
                    $plate = $vehicle['plate'];
                    $customer = $vehicle['customer'];

                    $alreadyLogged = WaNotificationLog::where('plate_number', $plate)
                        ->whereDate('created_at', $today)
                        ->exists();

                    if (!$alreadyLogged) {
                        WaNotificationLog::create([
                            'plate_number' => $plate,
                            'customer_name' => $customer,
                            'status' => 'PENDING',
                            'response_payload' => [
                                'message' => "Panggilan kepada Yth. {$customer}, kendaraan dengan nopol {$plate} telah selesai dikerjakan.",
                                'source' => 'SyncCrmData Command',
                            ]
                        ]);
                        $this->info("Logged pending WA notification for: {$plate} - {$customer}");
                    }
                }
            }

            $this->info('Successfully synced ' . count($parsedList) . ' vehicles to cache.');
        } else {
            $this->info('No vehicle data parsed or CRM unreachable.');
        }

        return Command::SUCCESS;
    }

    /**
     * Parsing tabel HTML dari server Toyota menjadi JSON array
     */
    private function parseToyotaHtmlTable(string $html): array
    {
        $parsed = [];

        if (empty(trim($html))) {
            return $parsed;
        }

        $dom = new DOMDocument();
        @$dom->loadHTML($html);
        $xpath = new DOMXPath($dom);

        // SECTION 1: Parse Main Table Rows
        $rows = $xpath->query('//table//tr');
        if ($rows && $rows->length > 0) {
            $idCounter = 1;
            foreach ($rows as $index => $row) {
                if ($index === 0) continue;

                $cells = $xpath->query('.//td', $row);
                if ($cells->length >= 6) {
                    $plateRaw = trim(preg_replace('/\s+/', ' ', $cells->item(0)->textContent));
                    $customer = trim(preg_replace('/\s+/', ' ', $cells->item(1)->textContent));
                    $startTime = trim(preg_replace('/\s+/', ' ', $cells->item(2)->textContent));
                    $estTime = trim(preg_replace('/\s+/', ' ', $cells->item(3)->textContent));
                    $status = trim(preg_replace('/\s+/', ' ', $cells->item(4)->textContent));
                    $advisor = trim(preg_replace('/\s+/', ' ', $cells->item(5)->textContent));

                    if (!empty($plateRaw) && strlen($plateRaw) >= 3 && !str_contains($plateRaw, 'Tidak ada kendaraan')) {
                        $formattedPlate = str_replace('-', ' ', $plateRaw);
                        $parsed[] = [
                            'id' => 'tbl-' . ($idCounter++),
                            'plate' => $formattedPlate,
                            'customer' => $customer,
                            'startTime' => $startTime,
                            'estTime' => $estTime,
                            'status' => strtoupper($status),
                            'advisor' => $advisor
                        ];
                    }
                }
            }
        }

        // SECTION 2: Parse Bottom Card Sections
        $h3s = $xpath->query('//h3');
        if ($h3s && $h3s->length > 0) {
            foreach ($h3s as $h3) {
                $title = strtoupper(trim($h3->textContent));

                $statusName = '';
                $statusKey = '';
                $estTimeVal = '-';

                if (str_contains($title, 'SELESAI DIKERJAKAN')) {
                    $statusName = 'SELESAI DIKERJAKAN';
                    $statusKey = 'c';
                    $estTimeVal = 'SELESAI';
                } elseif (str_contains($title, 'MENUNGGU DIKERJAKAN')) {
                    $statusName = 'MENUNGGU DIKERJAKAN';
                    $statusKey = 'w';
                } elseif (str_contains($title, 'PERBAIKAN DILANJUT BESOK')) {
                    $statusName = 'PERBAIKAN DILANJUT BESOK';
                    $statusKey = 'b';
                } else {
                    continue;
                }

                $panelNode = $xpath->query('./ancestor::div[contains(@class, "rounded-2xl")]', $h3);
                if ($panelNode->length === 0) continue;

                $itemsContainer = $xpath->query('.//div[contains(@class, "space-y-2")]', $panelNode->item(0));
                if ($itemsContainer->length === 0) continue;

                $items = $xpath->query('./div', $itemsContainer->item(0));
                foreach ($items as $idx => $item) {
                    $spans = $xpath->query('.//span', $item);
                    if ($spans->length >= 2) {
                        $plateRaw = trim($spans->item(0)->textContent);
                        $customer = trim($spans->item(1)->textContent);

                        if (
                            !empty($plateRaw) &&
                            !empty($customer) &&
                            $plateRaw !== 'Kosong' &&
                            !str_contains($plateRaw, 'Vehicle') &&
                            !str_contains($plateRaw, 'DIKERJAKAN') &&
                            !str_contains($plateRaw, 'BESOK') &&
                            strlen($plateRaw) >= 3 &&
                            strlen($plateRaw) <= 20
                        ) {
                            $formattedPlate = str_replace('-', ' ', $plateRaw);

                            $exists = false;
                            foreach ($parsed as $v) {
                                if ($v['plate'] === $formattedPlate) {
                                    $exists = true;
                                    break;
                                }
                            }

                            if (!$exists) {
                                $parsed[] = [
                                    'id' => $statusKey . '-' . $idx,
                                    'plate' => $formattedPlate,
                                    'customer' => $customer,
                                    'startTime' => '-',
                                    'estTime' => $estTimeVal,
                                    'status' => $statusName,
                                    'advisor' => '-'
                                ];
                            }
                        }
                    }
                }
            }
        }

        return $parsed;
    }
}
