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
        Schema::table('certificate_releases', function (Blueprint $table) {
            // Drop the foreign key constraint first
            $table->dropForeign(['certificate_request_id']);
            
            // Make certificate_request_id nullable
            $table->unsignedBigInteger('certificate_request_id')->nullable()->change();
            
            // Re-add the foreign key constraint with nullable support
            $table->foreign('certificate_request_id')
                  ->references('id')
                  ->on('certificate_requests')
                  ->onDelete('cascade');
            
            // Make recipient_email nullable
            $table->string('recipient_email')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificate_releases', function (Blueprint $table) {
            // Drop the foreign key constraint
            $table->dropForeign(['certificate_request_id']);
            
            // Make certificate_request_id not nullable
            $table->unsignedBigInteger('certificate_request_id')->nullable(false)->change();
            
            // Re-add the foreign key constraint
            $table->foreign('certificate_request_id')
                  ->references('id')
                  ->on('certificate_requests')
                  ->onDelete('cascade');
            
            // Make recipient_email not nullable
            $table->string('recipient_email')->nullable(false)->change();
        });
    }
};
