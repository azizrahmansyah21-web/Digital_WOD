<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\QueueController;
use App\Http\Controllers\API\DisplayController;
use App\Http\Controllers\API\AdminSettingsController;

/*
|--------------------------------------------------------------------------
| API Routes for Digital Signage System
|--------------------------------------------------------------------------
*/

// Legacy Display Endpoints
Route::get('/antrean', [QueueController::class, 'index']);
Route::get('/tts', [QueueController::class, 'generateTTS']);

// API v1 Public Display Endpoints (Proxy-Cache Layer)
Route::prefix('v1/display')->group(function () {
    Route::get('/queues', [DisplayController::class, 'queues']);
    Route::get('/settings', [DisplayController::class, 'settings']);
});

// API v1 Admin CMS Endpoints
Route::prefix('v1/admin')->group(function () {
    Route::get('/settings', [AdminSettingsController::class, 'getSettings']);
    Route::put('/settings', [AdminSettingsController::class, 'updateSettings']);
    Route::post('/upload-media', [AdminSettingsController::class, 'uploadMedia']);
    Route::get('/wa-logs', [AdminSettingsController::class, 'getWaLogs']);
});
