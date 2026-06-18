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
        Schema::create('parish_records', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['baptism', 'confirmation', 'marriage', 'funeral', 'mass']);
            $table->string('name');
            $table->date('date');
            $table->string('priest');
            $table->enum('status', ['completed', 'pending', 'cancelled'])->default('completed');
            $table->json('details')->nullable(); // Store type-specific details as JSON
            $table->text('notes')->nullable();
            $table->string('certificate_number')->nullable();
            $table->timestamps();
            
            // Indexes for better performance
            $table->index(['type', 'date']);
            $table->index(['name']);
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parish_records');
    }
};