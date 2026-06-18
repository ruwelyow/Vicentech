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
        Schema::table('sacrament_time_slots', function (Blueprint $table) {
            $table->foreignId('sacrament_type_id')->nullable()->constrained('sacrament_types')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sacrament_time_slots', function (Blueprint $table) {
            $table->dropForeign(['sacrament_type_id']);
            $table->dropColumn('sacrament_type_id');
        });
    }
};