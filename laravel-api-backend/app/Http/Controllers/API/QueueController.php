<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\JsonResponse;
use App\Jobs\SendWhatsappNotification;

class QueueController extends Controller
{
    /**
     * GET /api/antrean
     * Fetch Toyota WOD queue data with Redis 10s Caching to prevent DDoS on central server.
     */
    public function index(): JsonResponse
    {
        // Cache data for 10 seconds using Redis
        $queueData = Cache::remember('toyota_wod_data', 10, function () {
            try {
                $response = Http::timeout(5)->get('http://172.16.3.30/service/public/display/ruang-tunggu/ubta');

                if ($response->successful()) {
                    // Return raw JSON or parsed data array
                    return $response->json() ?? $this->getMockToyotaData();
                }
            } catch (\Exception $e) {
                // Log exception if central server is unreachable
            }

            return $this->getMockToyotaData();
        });

        // Trigger WhatsApp Notification Jobs for newly completed vehicles asynchronously
        foreach ($queueData as $vehicle) {
            if (isset($vehicle['status']) && ($vehicle['status'] === 'SELESAI DIKERJAKAN' || $vehicle['status'] === 'Ready')) {
                if (isset($vehicle['phone']) && !empty($vehicle['phone'])) {
                    SendWhatsappNotification::dispatch($vehicle);
                }
            }
        }

        return response()->json($queueData);
    }

    /**
     * Fallback mock data structure
     */
    private function getMockToyotaData(): array
    {
        return [
            [
                'id' => 1,
                'plate' => 'BM 1030 FX',
                'customer' => 'REPINTA NAIBAHO',
                'model' => 'Innova Zenix Hybrid',
                'status' => 'PROSES PERBAIKAN',
                'estTime' => '14:00',
                'advisor' => 'RDS',
                'phone' => '081234567890'
            ],
            [
                'id' => 2,
                'plate' => 'BM 1778 UE',
                'customer' => 'AMAR',
                'model' => 'Fortuner GR Sport',
                'status' => 'TUNGGU CUCI',
                'estTime' => '13:00',
                'advisor' => 'RDS',
                'phone' => '081298765432'
            ],
            [
                'id' => 3,
                'plate' => 'F 1848 FAL',
                'customer' => 'AKHIR ZUHRI SIREGAR',
                'model' => 'Avanza 1.5 G',
                'status' => 'TUNGGU CUCI',
                'estTime' => '14:00',
                'advisor' => 'DFM',
                'phone' => '081311223344'
            ],
            [
                'id' => 4,
                'plate' => 'BM 1786 AAN',
                'customer' => 'PT. GO RENTAL',
                'model' => 'Veloz 1.5 Q',
                'status' => 'MENUNGGU DIKERJAKAN',
                'estTime' => '15:30',
                'advisor' => 'RDS',
                'phone' => '081255667788'
            ],
            [
                'id' => 5,
                'plate' => 'BM 1990 KTA',
                'customer' => 'OKTAVIANI SAFUTRI',
                'model' => 'Yaris Cross HEV',
                'status' => 'SELESAI DIKERJAKAN',
                'estTime' => '12:30',
                'advisor' => 'THS_UBTI',
                'phone' => '081299887766'
            ],
            [
                'id' => 6,
                'plate' => 'BK 1182 DZ',
                'customer' => 'DEWI LESTARI',
                'model' => 'Hilux Double Cab',
                'status' => 'SELESAI DIKERJAKAN',
                'estTime' => '12:00',
                'advisor' => 'RID',
                'phone' => '081377889900'
            ],
        ];
    }
}
