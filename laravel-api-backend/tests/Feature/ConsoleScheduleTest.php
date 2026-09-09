<?php

namespace Tests\Feature;

use Illuminate\Console\Scheduling\Schedule;
use Tests\TestCase;

class ConsoleScheduleTest extends TestCase
{
    /**
     * Test that CRM data sync and WA process are scheduled properly.
     */
    public function test_crm_sync_and_wa_process_are_scheduled()
    {
        // Panggil console routes agar schedule terdaftar
        require base_path('routes/console.php');

        /** @var Schedule $schedule */
        $schedule = $this->app->make(Schedule::class);
        $events = collect($schedule->events());

        // Verifikasi bahwa perintah sync:crm-data terdaftar berjalan setiap menit
        $this->assertTrue(
            $events->contains(function ($event) {
                return str_contains($event->command, 'sync:crm-data') && $event->expression === '* * * * *';
            }),
            'Perintah sync:crm-data tidak dijadwalkan setiap menit.'
        );

        // Verifikasi bahwa perintah wa:process-automation terdaftar berjalan setiap menit
        $this->assertTrue(
            $events->contains(function ($event) {
                return str_contains($event->command, 'wa:process-automation') && $event->expression === '* * * * *';
            }),
            'Perintah wa:process-automation tidak dijadwalkan setiap menit.'
        );
    }
}
