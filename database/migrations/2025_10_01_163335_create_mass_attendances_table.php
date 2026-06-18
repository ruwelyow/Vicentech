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
        Schema::create('mass_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mass_schedule_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('email');
            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->integer('number_of_people')->default(1);
            $table->text('special_requests')->nullable();
            $table->boolean('is_confirmed')->default(false);
            $table->timestamp('attendance_date')->nullable();
            $table->timestamps();
            
            // Indexes for better performance
            $table->index(['mass_schedule_id', 'user_id']);
            $table->index('attendance_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mass_attendances');
    }
};