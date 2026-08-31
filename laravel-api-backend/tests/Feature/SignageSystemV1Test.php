<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;
use App\Models\SignageSetting;
use App\Models\WaNotificationLog;

class SignageSystemV1Test extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed default signage settings
        $this->seed(\Database\Seeders\SignageSettingSeeder::class);
    }

    public function testPublicQueuesApiReturnsCachedData()
    {
        Cache::put('wod_live_queues', [
            [
                'id' => 'tbl-1',
                'plate' => 'BM 1234 TOYOTA',
                'customer' => 'BAPAK AHMAD',
                'status' => 'SELESAI DIKERJAKAN',
                'startTime' => '08:00',
                'estTime' => '09:00',
                'advisor' => 'RUDI',
            ]
        ]);

        $response = $this->getJson('/api/v1/display/queues');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ])
            ->assertJsonFragment(['plate' => 'BM 1234 TOYOTA']);
    }

    public function testPublicSettingsApiReturnsSettingsWithEtagHeader()
    {
        $response = $this->getJson('/api/v1/display/settings');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ])
            ->assertHeader('ETag');
    }

    public function testAdminCanRetrieveCmsSettings()
    {
        $response = $this->getJson('/api/v1/admin/settings');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ])
            ->assertJsonStructure([
                'data' => [
                    'running_text_ticker',
                    'duration_media_sec',
                    'duration_table_sec',
                    'promo_playlist',
                    'enable_tts',
                    'duration_popup_sec',
                    'show_debug_toolbar',
                ]
            ]);
    }

    public function testAdminCanUpdateSettingsAndInvalidateCache()
    {
        $payload = [
            'running_text_ticker' => 'Pengumuman Baru WOD Server v1.1',
            'duration_media_sec' => '45',
            'enable_tts' => '1',
            'duration_popup_sec' => '15',
            'show_debug_toolbar' => '1',
        ];

        $response = $this->putJson('/api/v1/admin/settings', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Pengaturan CMS berhasil diperbarui.'
            ]);

        $this->assertDatabaseHas('signage_settings', [
            'key' => 'running_text_ticker',
            'value' => 'Pengumuman Baru WOD Server v1.1',
        ]);

        $this->assertDatabaseHas('signage_settings', [
            'key' => 'show_debug_toolbar',
            'value' => '1',
        ]);
    }

    public function testDisplaySettingsApiReflectsUpdatedDebugToolbarState()
    {
        // First retrieve default settings (should be '0')
        $resDefault = $this->getJson('/api/v1/display/settings');
        $resDefault->assertStatus(200)
            ->assertJsonPath('data.show_debug_toolbar', '0');

        // Update setting to '1' (Active)
        $this->putJson('/api/v1/admin/settings', [
            'show_debug_toolbar' => '1'
        ])->assertStatus(200);

        // Verify public display settings return '1'
        $resUpdated = $this->getJson('/api/v1/display/settings');
        $resUpdated->assertStatus(200)
            ->assertJsonPath('data.show_debug_toolbar', '1');
    }

    public function testAdminCanUploadPromoMedia()
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('promo_banner.jpg');

        $response = $this->postJson('/api/v1/admin/upload-media', [
            'file' => $file,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'type' => 'image',
            ]);

        Storage::disk('public')->assertExists('media/' . $file->hashName());
    }

    public function testUploadMediaFailsWhenFileMissingOrInvalid()
    {
        // Test missing file
        $response = $this->postJson('/api/v1/admin/upload-media', []);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);

        // Test invalid file type (e.g. .pdf or .exe)
        $invalidFile = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');
        $resInvalid = $this->postJson('/api/v1/admin/upload-media', [
            'file' => $invalidFile
        ]);
        $resInvalid->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function testAdminCanRetrieveWaNotificationLogs()
    {
        WaNotificationLog::create([
            'plate_number' => 'BM 8888 TOYOTA',
            'customer_name' => 'PELANGGAN TEST',
            'status' => 'PENDING',
            'response_payload' => ['message' => 'Notification queued']
        ]);

        $response = $this->getJson('/api/v1/admin/wa-logs');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ])
            ->assertJsonFragment(['plate_number' => 'BM 8888 TOYOTA']);
    }
}
