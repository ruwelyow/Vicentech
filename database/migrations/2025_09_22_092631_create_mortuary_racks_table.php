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
        Schema::create('mortuary_racks', function (Blueprint $table) {
            $table->string('id')->primary(); // A1, A2, B1, B2, etc.
            $table->enum('status', ['available', 'occupied', 'reserved'])->default('available');
            $table->string('occupant')->nullable();
            $table->date('date_occupied')->nullable();
            $table->integer('position_row');
            $table->integer('position_col');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Add index for position queries
            $table->index(['position_row', 'position_col']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mortuary_racks');
    }
};
