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
        Schema::table('families', function (Blueprint $table) {
            // Add all the missing family fields
            $table->string('family_name')->nullable()->after('id');
            $table->string('family_code')->unique()->nullable()->after('family_name');
            $table->text('address')->nullable()->after('family_code');
            $table->string('phone')->nullable()->after('address');
            $table->string('email')->nullable()->after('phone');
            $table->text('family_notes')->nullable()->after('email');
            $table->json('family_ministries')->nullable()->after('family_notes');
            $table->date('family_anniversary')->nullable()->after('family_ministries');
            $table->boolean('newsletter_subscribed')->default(true)->after('family_anniversary');
            $table->boolean('volunteer_family')->default(false)->after('newsletter_subscribed');
            $table->enum('family_status', ['active', 'inactive', 'transferred'])->default('active')->after('volunteer_family');
            
            // Make head_user_id nullable since it's not always required
            $table->unsignedBigInteger('head_user_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('families', function (Blueprint $table) {
            // Remove the added fields
            $table->dropColumn([
                'family_name',
                'family_code', 
                'address',
                'phone',
                'email',
                'family_notes',
                'family_ministries',
                'family_anniversary',
                'newsletter_subscribed',
                'volunteer_family',
                'family_status'
            ]);
            
            // Revert head_user_id to not nullable
            $table->unsignedBigInteger('head_user_id')->nullable(false)->change();
        });
    }
};
