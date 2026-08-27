<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use App\Models\SignageSetting;

class DisplayController extends Controller
{
    /**
     * GET /api/v1/display/queues
     * Return live cached queue data for React WOD TV displays (< 5ms response time)
     */
    public function queues(): JsonResponse
    {
        $queues = Cache::get('wod_live_queues');

        // Fallback: If cache is empty, attempt on-demand command execution or return empty array
        if ($queues === null) {
            \Illuminate\Support\Facades\Artisan::call('sync:crm-data');
            $queues = Cache::get('wod_live_queues', []);
        }

        $lastSynced = Cache::get('wod_last_synced', null);

        return response()->json([
            'status' => 'success',
            'last_synced' => $lastSynced,
            'data' => $queues
        ]);
    }

    /**
     * GET /api/v1/display/settings
     * Return cached display settings for React WOD TV displays with zero DB overhead
     */
    public function settings(): JsonResponse
    {
        $settings = Cache::remember('signage_settings_cached', 3600, function () {
            return SignageSetting::all()->pluck('value', 'key')->toArray();
        });

        $etag = md5(json_encode($settings));

        return response()->json([
            'status' => 'success',
            'data' => $settings
        ])
        ->setEtag($etag)
        ->setPublic()
        ->setMaxAge(3);
    }
}
