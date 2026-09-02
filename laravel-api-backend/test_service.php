<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$svc = app(\App\Services\AgungApiService::class);

$plate = "BM 1845 UB";
echo "Testing Plate: $plate\n";
echo "Memanggil: getDecryptedPhoneByPlate()\n";
echo str_repeat("-", 40) . "\n";

$result = $svc->getDecryptedPhoneByPlate($plate);

if ($result) {
    echo "BERHASIL! Hasil akhirnya adalah: " . $result . "\n";
    echo "Apakah ini string mentah (terdekripsi)? " . (is_numeric($result) ? "YA, ini murni angka nomor HP." : "TIDAK, masih berbentuk teks aneh.") . "\n";
} else {
    echo "GAGAL: Tidak dapat menemukan data atau dekripsi gagal.\n";
}
