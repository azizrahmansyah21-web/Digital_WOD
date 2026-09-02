<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use DOMDocument;
use DOMXPath;

class TestAgungApiConnection extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:agung-api';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test API Agung Concern connection for both POST progress and POST decrypt endpoints using real data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $baseUrl = env('AGIS_BASE_URL');
        $bearerToken = env('AGIS_BEARER_TOKEN');
        $authKey = env('AGIS_AUTH_KEY');

        if (!$baseUrl || !$bearerToken || !$authKey) {
            $this->error('Error: AGIS credentials not fully set in .env');
            return 1;
        }

        $this->info("Starting API connection test...");
        $this->newLine();

        // 0. Fetch Real Plate from CRM HTML
        $this->info('--- TEST 0: FETCH REAL PLATE FROM LOCAL CRM HTML ---');
        
        $targetUrl = 'http://172.16.3.30/service/public/display/ruang-tunggu/ubta';
        $testPlates = [];

        try {
            $htmlResponse = Http::timeout(5)->get($targetUrl);
            
            if ($htmlResponse->successful()) {
                $html = $htmlResponse->body();
                $dom = new DOMDocument();
                @$dom->loadHTML($html);
                $xpath = new DOMXPath($dom);

                // Fetch plates from the main table
                $rows = $xpath->query('//table//tr');
                if ($rows && $rows->length > 0) {
                    foreach ($rows as $index => $row) {
                        if ($index === 0) continue; // skip header

                        $cells = $xpath->query('.//td', $row);
                        if ($cells->length >= 6) {
                            $plateRaw = trim(preg_replace('/\s+/', ' ', $cells->item(0)->textContent));
                            if (!empty($plateRaw) && strlen($plateRaw) >= 3 && !str_contains($plateRaw, 'Tidak ada kendaraan')) {
                                $testPlates[] = str_replace('-', ' ', $plateRaw);
                            }
                        }
                    }
                }
            } else {
                $this->error("Failed to fetch CRM HTML, status: " . $htmlResponse->status());
            }
        } catch (\Exception $e) {
            $this->error("Failed to reach Toyota CRM server: " . $e->getMessage());
        }

        if (empty($testPlates)) {
            $this->error("Could not extract any plate from CRM HTML. Aborting test.");
            return 1;
        }
        
        $this->info("Successfully extracted " . count($testPlates) . " plates from CRM.");
        $this->newLine();

        // 1. POST Progress Status by nomor_polisi
        $this->info("--- TEST 1: POST GET ENCRYPTED PHONE BY PLATE ---");
        
        $response = null;
        $exceptionMessage = null;
        $encryptedPhone = null;
        $testPlate = null;

        foreach ($testPlates as $originalPlate) {
            $plateFormats = [
                str_replace(' ', '-', $originalPlate) // With hyphens (e.g. BM-1316-MY)
            ];

            foreach ($plateFormats as $plate) {
                $this->line("Testing plate: {$plate} ...");
                try {
                    $response = Http::withToken($bearerToken)
                        ->withHeaders([
                            'auth_key' => $authKey,
                            'Accept' => 'application/json'
                        ])
                        ->withoutVerifying()
                        ->timeout(10)
                        ->post("{$baseUrl}/api/service/progress_status", [
                            'nomor_polisi' => $plate,
                            'auth_key' => $authKey
                        ]);
                        
                    if ($response->successful()) {
                        $data = $response->json('data') ?? $response->json();
                        if (!isset($data['status']) || $data['status'] !== 'error') {
                            $this->info("  [!] Found valid data for plate: {$plate}!");
                            $testPlate = $plate;
                            $encryptedPhone = $data[0]['handphone'] ?? $data['handphone'] ?? null;
                            break 2; // Break both loops
                        } else {
                            $this->line("  [-] Data tidak ditemukan untuk plat ini.");
                        }
                    } elseif ($response->status() === 404) {
                        $this->line("  [-] 404: " . $response->body());
                    } else {
                        $this->warn("  [-] Request failed with status: " . $response->status() . " Body: " . $response->body());
                    }
                } catch (\Exception $e) {
                    $this->error("  [x] Exception: " . $e->getMessage());
                    continue;
                }
            }
        }

        if ($exceptionMessage) {
            $this->error("POST request encountered an exception: " . $exceptionMessage);
        } elseif (!$response || $response->failed()) {
            $this->error("POST request failed: " . ($response ? $response->body() : 'Unknown error'));
        } else {
            $this->info("HTTP Status Code: " . $response->status());
            
            $data = $response->json('data') ?? $response->json();
            $this->line("Raw Response: " . substr(json_encode($data), 0, 300) . "...");
            
            $sampleRow = is_array($data) && isset($data[0]) ? $data[0] : $data;
            
            if (empty($sampleRow)) {
                $this->warn("No records found in API Agung for plate: {$testPlate}");
            } else {
                $this->line("Sample Data Retrieved:");
                
                $platNo = $sampleRow['plat_no'] ?? $sampleRow['plate'] ?? $sampleRow['nomor_polisi'] ?? $testPlate;
                $status = $sampleRow['status'] ?? 'N/A';
                $encryptedPhone = is_array($sampleRow['handphone'] ?? null) 
                    ? json_encode($sampleRow['handphone']) 
                    : ($sampleRow['handphone'] ?? $sampleRow['no_hp'] ?? $sampleRow['phone'] ?? null);
                
                $this->table(
                    ['Field', 'Value'],
                    [
                        ['plat_no', (string) $platNo],
                        ['status', (string) $status],
                        ['no_hp (encrypted)', (string) $encryptedPhone],
                    ]
                );
                $this->newLine();
            }
        }

        // 2. POST Decrypt
        if (!$encryptedPhone) {
            $this->warn("No encrypted phone retrieved from Test 1. Using a dummy encrypted string to test server decryption security response...");
            $encryptedPhone = "dummy_encrypted_string_untuk_testing_security";
        }

        $this->info('--- TEST 2: POST DECRYPT PHONE ---');
        
        try {
            $decryptResponse = Http::withToken($bearerToken)
                ->withHeaders([
                    'auth_key' => $authKey,
                    'Accept' => 'application/json'
                ])
                ->withoutVerifying()
                ->timeout(10)
                ->post("{$baseUrl}/api/decrypt", [
                    'encrypted_value' => $encryptedPhone
                ]);
                
            $this->info("HTTP Status Code: " . $decryptResponse->status());

            if ($decryptResponse->failed()) {
                $this->error("POST decrypt failed: " . $decryptResponse->body());
            } else {
                $decryptedBody = $decryptResponse->json();
                
                $decryptedPhone = is_array($decryptedBody) 
                    ? ($decryptedBody['decrypted_value'] ?? $decryptedBody['result'] ?? json_encode($decryptedBody)) 
                    : $decryptResponse->body();
                    
                $this->info("Decryption Result:");
                $this->line("<fg=green>Original (Encrypted):</> " . $encryptedPhone);
                $this->line("<fg=cyan>Decrypted (Plaintext):</> " . $decryptedPhone);
            }
        } catch (\Exception $e) {
            $this->error("POST decrypt encountered an exception: " . $e->getMessage());
        }
        
        $this->newLine();
        $this->info("Phase 0 Test Execution Finished. \u{2705}");
        return 0;
    }
}
