<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('wa_notification_logs', function (Blueprint $table) {
            $table->id();
            $table->string('plat_no')->index();
            $table->string('customer_name')->nullable();
            $table->string('decrypted_phone')->nullable();
            $table->enum('status', ['SENT', 'FAILED', 'DECRYPT_FAILED'])->default('SENT');
            $table->text('error_details')->nullable();
            $table->date('notified_date')->index();
            $table->timestamps();
            
            // Constraint Indeks Unik (Anti-Spam Idempotency)
            $table->unique(['plat_no', 'notified_date'], 'unique_daily_plate_notification');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wa_notification_logs');
    }
};
