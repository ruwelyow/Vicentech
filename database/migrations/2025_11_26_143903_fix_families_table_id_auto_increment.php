<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Ensure the id column is AUTO_INCREMENT
        // This fixes the issue where the id field doesn't have a default value
        DB::statement('ALTER TABLE families MODIFY id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: We can't really reverse this without potentially breaking things
        // The id column should always be AUTO_INCREMENT
    }
};
