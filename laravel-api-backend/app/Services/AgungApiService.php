<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AgungApiService
{
    protected $baseUrl;
    protected $bearerToken;
    protected $authKey;

    public function __construct()
    {
        $this->baseUrl = env('AGIS_BASE_URL');
        $this->bearerToken = env('AGIS_BEARER_TOKEN');
        $this->authKey = env('AGIS_AUTH_KEY');
    }

    /**
     * Mengambil nomor HP (dalam bentuk terenkripsi) berdasarkan plat nomor.
     * Menggunakan format tanda hubung (-) sesuai standar Agung HO.
     *
     * @param string $nomorPolisi
     * @return string|null
     */
    public function getEncryptedPhoneByPlate(string $nomorPolisi): ?string
    {
        // Standarisasi plat nomor: ganti spasi dengan tanda hubung
        // Contoh: "BM 8618 ML" menjadi "BM-8618-ML"
        $formattedPlate = str_replace(' ', '-', trim($nomorPolisi));

        try {
            $response = Http::withToken($this->bearerToken)
                ->withHeaders([
                    'auth_key' => $this->authKey,
                    'Accept'   => 'application/json'
                ])
                ->withoutVerifying()
                ->timeout(10)
                ->retry(2, 100)
                ->post("{$this->baseUrl}/api/service/progress_status", [
                    'nomor_polisi' => $formattedPlate,
                    'auth_key'     => $this->authKey
                ]);

            if ($response->successful()) {
                $data = $response->json('data') ?? $response->json();
                
                // Jika data yang dikembalikan berupa array (seperti yang kita temukan di Phase 0)
                if (is_array($data) && count($data) > 0) {
                    $firstRow = $data[0] ?? $data;
                    
                    // Ambil string enkripsi dari key 'handphone'
                    $encryptedPhone = $firstRow['handphone'] ?? $firstRow['no_hp'] ?? $firstRow['phone'] ?? null;
                    
                    if (is_array($encryptedPhone)) {
                        return json_encode($encryptedPhone);
                    }
                    
                    return $encryptedPhone;
                }
            } elseif ($response->status() !== 404) {
                Log::warning("Agung API getEncryptedPhoneByPlate failed for plate {$formattedPlate}", [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
            }
        } catch (\Exception $e) {
            Log::error("Agung API Exception in getEncryptedPhoneByPlate: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Mendekripsi string rahasia (enkripsi) menjadi nomor HP murni.
     *
     * @param string|null $encryptedValue
     * @return string|null
     */
    public function decryptPhoneNumber(?string $encryptedValue): ?string
    {
        if (empty($encryptedValue)) {
            return null;
        }

        try {
            $response = Http::withToken($this->bearerToken)
                ->withHeaders([
                    'auth_key' => $this->authKey,
                    'Accept'   => 'application/json'
                ])
                ->withoutVerifying()
                ->timeout(10)
                ->retry(2, 100)
                ->post("{$this->baseUrl}/api/decrypt", [
                    'encrypted_value' => $encryptedValue
                ]);

            if ($response->successful()) {
                $decryptedValue = $response->json('decrypted_value') ?? $response->json('result') ?? null;
                return $decryptedValue;
            } else {
                Log::warning("Agung API decryptPhoneNumber failed", [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
            }
        } catch (\Exception $e) {
            Log::error("Agung API Exception in decryptPhoneNumber: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Helper Method: Mengambil plat nomor, dan LANGSUNG mengembalikan nomor HP murni.
     * Menggabungkan proses Fetch & Decrypt secara internal.
     *
     * @param string $nomorPolisi
     * @return string|null
     */
    public function getDecryptedPhoneByPlate(string $nomorPolisi): ?string
    {
        // 1. Ambil versi terenkripsi
        $encryptedPhone = $this->getEncryptedPhoneByPlate($nomorPolisi);
        
        if (!$encryptedPhone) {
            return null; // Gagal di tahap pencarian data
        }
        
        // 2. Langsung dekripsi dan kembalikan hasilnya
        return $this->decryptPhoneNumber($encryptedPhone);
    }
}
