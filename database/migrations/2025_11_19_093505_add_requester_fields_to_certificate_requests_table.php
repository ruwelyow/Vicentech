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
        Schema::table('certificate_requests', function (Blueprint $table) {
            $table->unsignedBigInteger('requester_id')->nullable()->after('id');
            $table->unsignedBigInteger('recipient_user_id')->nullable()->after('requester_id');
            
            $table->foreign('requester_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('recipient_user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificate_requests', function (Blueprint $table) {
            $table->dropForeign(['requester_id']);
            $table->dropForeign(['recipient_user_id']);
            $table->dropColumn(['requester_id', 'recipient_user_id']);
        });
    }
};
