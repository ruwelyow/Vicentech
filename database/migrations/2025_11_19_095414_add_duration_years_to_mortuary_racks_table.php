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
        Schema::table('mortuary_racks', function (Blueprint $table) {
            $table->integer('duration_years')->default(5)->after('date_occupied');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mortuary_racks', function (Blueprint $table) {
            $table->dropColumn('duration_years');
        });
    }
};
