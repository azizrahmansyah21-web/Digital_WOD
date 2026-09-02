<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaNotificationLog extends Model
{
    use HasFactory;

    protected $table = 'wa_notification_logs';

    protected $fillable = [
        'plat_no',
        'customer_name',
        'decrypted_phone',
        'status',
        'error_details',
        'notified_date',
    ];
}
