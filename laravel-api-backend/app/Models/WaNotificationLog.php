<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaNotificationLog extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'wa_notification_logs';

    protected $fillable = [
        'id',
        'plate_number',
        'customer_name',
        'status',
        'response_payload',
    ];

    protected $casts = [
        'response_payload' => 'array',
    ];
}
