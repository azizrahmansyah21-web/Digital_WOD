<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use App\Models\SignageSetting;
use App\Models\WaNotificationLog;

class AdminSettingsController extends Controller
{
    /**
     * GET /api/v1/admin/settings
     * Fetch settings list for Admin CMS
     */
    public function getSettings(): JsonResponse
    {
        $settings = SignageSetting::all();
        $formatted = [];

        foreach ($settings as $setting) {
            $formatted[$setting->key] = [
                'value' => $setting->value,
                'type' => $setting->type,
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => $formatted
        ]);
    }

    /**
     * PUT /api/v1/admin/settings
     * Batch update signage settings & invalidate cache
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $payload = $request->all();

        foreach ($payload as $key => $value) {
            SignageSetting::updateOrCreate(
                ['key' => $key],
                ['value' => is_array($value) ? json_encode($value) : $value]
            );
        }

        // Invalidate settings cache so TV displays update immediately
        Cache::forget('signage_settings_cached');

        return response()->json([
            'status' => 'success',
            'message' => 'Pengaturan CMS berhasil diperbarui.'
        ]);
    }

    /**
     * POST /api/v1/admin/upload-media
     * Upload promo media files (mp4, jpg, png, webp)
     */
    public function uploadMedia(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:mp4,webm,ogg,jpg,jpeg,png,webp,gif|max:102400',
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());

            // Determine type based on extension
            $type = in_array($extension, ['jpg', 'jpeg', 'png', 'webp', 'gif']) ? 'image' : 'mp4';

            $path = $file->store('media', 'public');
            $publicUrl = asset('storage/' . $path);

            return response()->json([
                'status' => 'success',
                'message' => 'Media berhasil diunggah.',
                'url' => $publicUrl,
                'path' => '/storage/' . $path,
                'type' => $type
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'File media tidak ditemukan.'
        ], 400);
    }

    /**
     * GET /api/v1/admin/wa-logs
     * Fetch WhatsApp notification logs for Admin CMS
     */
    public function getWaLogs(): JsonResponse
    {
        $logs = WaNotificationLog::orderBy('created_at', 'desc')->take(100)->get();

        return response()->json([
            'status' => 'success',
            'data' => $logs
        ]);
    }
}
