<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use DOMDocument;
use DOMXPath;

class QueueController extends Controller
{
    /**
     * GET /api/antrean
     * Nembak URL display Toyota, parsing HTML mentah tabel antrean menjadi array JSON bersih,
     * dan mengembalikan hasilnya langsung ke React.
     */
    public function index(): JsonResponse
    {
        $targetUrl = 'http://172.16.3.30/service/public/display/ruang-tunggu/ubta';
        $queueData = [];

        try {
            // 1. Fetch raw HTML from Toyota local display server
            $response = Http::timeout(5)->get($targetUrl);

            if ($response->successful()) {
                $html = $response->body();
                // 2. Extract table data from raw HTML
                $queueData = $this->parseToyotaHtmlTable($html);
            }
        } catch (\Exception $e) {
            // Fallback if target server is unreachable or timed out
        }

        // Return clean JSON array directly to React (empty array if no queue data)
        return response()->json($queueData);
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
        // Suppress warnings caused by HTML5 tags or legacy syntax
        @$dom->loadHTML($html);
        $xpath = new DOMXPath($dom);

        // ═══════════════════════════════════════════════════════════════
        // SECTION 1: Parse Main Table Rows (PROSES PERBAIKAN & TUNGGU CUCI)
        // ═══════════════════════════════════════════════════════════════
        $rows = $xpath->query('//table//tr');

        if ($rows && $rows->length > 0) {
            $idCounter = 1;
            foreach ($rows as $index => $row) {
                // Skip table header row
                if ($index === 0) {
                    continue;
                }

                $cells = $xpath->query('.//td', $row);
                if ($cells->length >= 6) {
                    $plateRaw = trim(preg_replace('/\s+/', ' ', $cells->item(0)->textContent));
                    $customer = trim(preg_replace('/\s+/', ' ', $cells->item(1)->textContent));
                    $startTime = trim(preg_replace('/\s+/', ' ', $cells->item(2)->textContent));
                    $estTime = trim(preg_replace('/\s+/', ' ', $cells->item(3)->textContent));
                    $status = trim(preg_replace('/\s+/', ' ', $cells->item(4)->textContent));
                    $advisor = trim(preg_replace('/\s+/', ' ', $cells->item(5)->textContent));

                    if (!empty($plateRaw) && strlen($plateRaw) >= 3 && !str_contains($plateRaw, 'Tidak ada kendaraan')) {
                        // Format plate number (convert "BM-1893-PX" to "BM 1893 PX")
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

        // ═══════════════════════════════════════════════════════════════
        // SECTION 2: Parse Bottom Card Sections (MENUNGGU, SELESAI, BESOK)
        // ═══════════════════════════════════════════════════════════════
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

    /**
     * Data mock cadangan untuk pengujian jika server Toyota tidak dapat dijangkau
     */
    private function getMockToyotaData(): array
    {
        return [
            [
                'id' => 1,
                'plate' => 'BM 1030 FX',
                'customer' => 'REPINTA NAIBAHO',
                'startTime' => '11:00',
                'estTime' => '14:00',
                'status' => 'PROSES PERBAIKAN',
                'advisor' => 'RDS'
            ],
            [
                'id' => 2,
                'plate' => 'BM 1778 UE',
                'customer' => 'AMAR',
                'startTime' => '11:15',
                'estTime' => '13:00',
                'status' => 'TUNGGU CUCI',
                'advisor' => 'RDS'
            ],
            [
                'id' => 3,
                'plate' => 'F 1848 FAL',
                'customer' => 'AKHIR ZUHRI SIREGAR',
                'startTime' => '11:30',
                'estTime' => '14:00',
                'status' => 'SELESAI DIKERJAKAN',
                'advisor' => 'DFM'
            ]
        ];
    }

    /**
     * Generate Audio TTS stream via Google Translate
     */
    public function generateTTS(\Illuminate\Http\Request $request)
    {
        $text = $request->query('text', 'Panggilan antrean');
        $cleanText = urlencode(strip_tags($text));
        
        // URL Google Translate TTS (Bahasa Indonesia)
        $url = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=id&q=" . $cleanText;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        // User agent wajib diisi agar tidak di-block oleh Google
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $audioContent = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$audioContent) {
            return response()->json(['error' => 'Gagal membuat audio TTS'], 500);
        }

        // Return binary audio file
        return response($audioContent, 200, [
            'Content-Type' => 'audio/mpeg',
            'Content-Disposition' => 'inline; filename="tts.mp3"',
            'Cache-Control' => 'no-cache, must-revalidate',
        ]);
    }
}
