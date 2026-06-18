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
        Schema::table('events', function (Blueprint $table) {
            if (!Schema::hasColumn('events', 'image_data')) {
                $table->longText('image_data')->nullable()->after('image');
            }
            if (!Schema::hasColumn('events', 'image_mime')) {
                $table->string('image_mime')->nullable()->after('image_data');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (Schema::hasColumn('events', 'image_data')) {
                $table->dropColumn('image_data');
            }
            if (Schema::hasColumn('events', 'image_mime')) {
                $table->dropColumn('image_mime');
            }
        });
    }
};
