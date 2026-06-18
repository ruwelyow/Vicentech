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
        Schema::table('guest_visits', function (Blueprint $table) {
            $table->timestamp('visit_start')->nullable()->after('accepted_at');
            $table->timestamp('visit_end')->nullable()->after('visit_start');
            $table->json('pages_viewed')->nullable()->after('visit_end');
            $table->integer('session_duration')->nullable()->after('pages_viewed'); // in seconds
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guest_visits', function (Blueprint $table) {
            $table->dropColumn(['visit_start', 'visit_end', 'pages_viewed', 'session_duration']);
        });
    }
};
