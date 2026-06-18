<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('parish_records')) {
            // Fix the id column to be AUTO_INCREMENT
            DB::statement('ALTER TABLE parish_records MODIFY id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT');
        }
        
        if (Schema::hasTable('sacrament_histories')) {
            // Also fix sacrament_histories table
            DB::statement('ALTER TABLE sacrament_histories MODIFY id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse this
    }
};

