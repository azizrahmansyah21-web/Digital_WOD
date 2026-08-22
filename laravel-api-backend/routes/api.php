<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\QueueController;

/*
|--------------------------------------------------------------------------
| API Routes for Digital Signage System
|--------------------------------------------------------------------------
*/

Route::get('/antrean', [QueueController::class, 'index']);
Route::get('/tts', [QueueController::class, 'generateTTS']);
