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
        Schema::table('images', function (Blueprint $table) {
            if (!Schema::hasColumn('images', 'image_data')) {
                $table->longText('image_data')->nullable()->after('path');
            }
            if (!Schema::hasColumn('images', 'image_mime')) {
                $table->string('image_mime')->nullable()->after('image_data');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('images', function (Blueprint $table) {
            if (Schema::hasColumn('images', 'image_data')) {
                $table->dropColumn('image_data');
            }
            if (Schema::hasColumn('images', 'image_mime')) {
                $table->dropColumn('image_mime');
            }
        });
    }
};
