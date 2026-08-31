<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SignageSetting;

class SignageSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $defaultRunningText = implode(' • ', [
            'Selamat datang di Bengkel Resmi Agung Toyota. Mengutamakan Keselamatan, Kualitas, dan Kepuasan Pelanggan.',
            'Gunakan Fasilitas Express Maintenance untuk Servis Cepat Bergaransi hanya 60 Menit.',
            'Harap perhatikan nomor antrean dan status pengerjaan kendaraan Anda pada monitor WOD.',
            'Dapatkan diskon paket perawatan berkala dan voucher spare part asli Toyota selama bulan ini.',
        ]);

        $defaultPlaylist = [
            [
                'id' => 'promo-1',
                'type' => 'youtube',
                'url' => 'bzQFeVWCC9Y',
                'title' => 'Video Promo Toyota Service',
                'duration_sec' => 60,
            ],
        ];

        $defaultSettings = [
            [
                'key' => 'promo_video_type',
                'value' => 'youtube',
                'type' => 'string',
            ],
            [
                'key' => 'promo_video_url',
                'value' => 'bzQFeVWCC9Y',
                'type' => 'string',
            ],
            [
                'key' => 'promo_playlist',
                'value' => json_encode($defaultPlaylist),
                'type' => 'json',
            ],
            [
                'key' => 'running_text_ticker',
                'value' => $defaultRunningText,
                'type' => 'string',
            ],
            [
                'key' => 'duration_media_sec',
                'value' => '60',
                'type' => 'integer',
            ],
            [
                'key' => 'duration_table_sec',
                'value' => '30',
                'type' => 'integer',
            ],
            [
                'key' => 'enable_tts',
                'value' => '1',
                'type' => 'boolean',
            ],
            [
                'key' => 'duration_popup_sec',
                'value' => '20',
                'type' => 'integer',
            ],
            [
                'key' => 'tts_speech_rate',
                'value' => '0.9',
                'type' => 'string',
            ],
            [
                'key' => 'tts_template',
                'value' => 'Panggilan untuk pelanggan Toyota, Bapak atau Ibu {customer}, dengan nomor kendaraan {plate}, servis kendaraan Anda telah selesai dikerjakan. Terima kasih.',
                'type' => 'string',
            ],
            [
                'key' => 'show_debug_toolbar',
                'value' => '0',
                'type' => 'boolean',
            ],
        ];

        foreach ($defaultSettings as $setting) {
            SignageSetting::updateOrCreate(
                ['key' => $setting['key']],
                [
                    'value' => $setting['value'],
                    'type' => $setting['type'],
                ]
            );
        }
    }
}
