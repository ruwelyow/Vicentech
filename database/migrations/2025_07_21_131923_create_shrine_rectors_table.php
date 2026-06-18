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
        Schema::create('shrine_rectors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('years')->nullable();
            $table->string('ordination_date')->nullable();
            $table->text('description')->nullable();
            $table->enum('type', ['current', 'past'])->default('current');
            $table->string('image')->nullable(); // path or filename
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shrine_rectors');
    }
};
