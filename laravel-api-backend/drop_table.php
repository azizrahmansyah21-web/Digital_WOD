<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

Illuminate\Support\Facades\Schema::dropIfExists('wa_notification_logs');
Illuminate\Support\Facades\DB::table('migrations')->where('migration', 'like', '%wa_notification_logs%')->delete();
echo "Table and migration dropped.\n";
