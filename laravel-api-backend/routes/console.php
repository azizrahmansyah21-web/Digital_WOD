<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

Schedule::command('sync:crm-data')
    ->everyMinute()
    ->withoutOverlapping(5)
    ->runInBackground();

Schedule::command('wa:process-automation')
    ->everyMinute()
    ->withoutOverlapping(5)
    ->runInBackground();
