<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$baseUrl = env('AGIS_BASE_URL');
$bearerToken = env('AGIS_BEARER_TOKEN');
$authKey = env('AGIS_AUTH_KEY');

$plate = "BM 1316 MY"; // From CRM
$formats = [
    $plate, // BM 1316 MY
    str_replace(' ', '', $plate), // BM1316MY
    str_replace(' ', '-', $plate), // BM-1316-MY
    preg_replace('/[^0-9]/', '', $plate), // 1316
    "BM1316", // No suffix
    "1316MY" // No prefix
];

foreach ($formats as $f) {
    echo "Testing format: $f\n";
    $resp = Illuminate\Support\Facades\Http::withToken($bearerToken)
        ->withHeaders([
            'auth_key' => $authKey,
            'Accept' => 'application/json'
        ])
        ->withoutVerifying()
        ->timeout(10)
        ->post("{$baseUrl}/api/service/progress_status", [
            'nomor_polisi' => $f,
            'auth_key' => $authKey
        ]);
        
    echo "Result: " . $resp->status() . " " . $resp->body() . "\n\n";
}

// Test asForm() just in case
echo "Testing asForm() for BM 1316 MY\n";
$respForm = Illuminate\Support\Facades\Http::withToken($bearerToken)
    ->withHeaders([
        'auth_key' => $authKey,
        'Accept' => 'application/json'
    ])
    ->withoutVerifying()
    ->timeout(10)
    ->asForm()
    ->post("{$baseUrl}/api/service/progress_status", [
        'nomor_polisi' => $plate,
        'auth_key' => $authKey
    ]);
echo "Result: " . $respForm->status() . " " . $respForm->body() . "\n\n";

