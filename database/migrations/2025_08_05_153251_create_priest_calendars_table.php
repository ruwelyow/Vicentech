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
        Schema::create('priest_calendars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('priest_id')->constrained('users')->onDelete('cascade');
            $table->string('duty');
            $table->date('date');
            $table->time('time');
            $table->text('notes')->nullable();
            $table->enum('status', ['scheduled', 'completed', 'cancelled'])->default('scheduled');
            $table->timestamps();
            
            // Index for better query performance
            $table->index(['priest_id', 'date']);
            $table->index(['date', 'time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('priest_calendars');
    }
};
