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

        // Fallback to mock data if empty (e.g. when testing offline)
        if (empty($queueData)) {
            $queueData = $this->getMockToyotaData();
        }

        // 3. Return clean JSON array directly to React
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

        // Find table rows
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

                    if (!empty($plateRaw)) {
                        // Format plate number (convert "BM-1893-PX" to "BM 1893 PX")
                        $formattedPlate = str_replace('-', ' ', $plateRaw);

                        $parsed[] = [
                            'id' => $idCounter++,
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
