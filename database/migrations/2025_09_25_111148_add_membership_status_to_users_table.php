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
        Schema::table('users', function (Blueprint $table) {
            // Membership Status Fields
            $table->enum('membership_status', ['active', 'inactive', 'visitor', 'new_member', 'transferred_out', 'deceased', 'suspended'])->default('new_member')->after('is_priest');
            $table->date('membership_date')->nullable()->after('membership_status');
            $table->date('last_attendance')->nullable()->after('membership_date');
            $table->string('baptismal_parish')->nullable()->after('last_attendance');
            $table->string('confirmation_parish')->nullable()->after('baptismal_parish');
            $table->json('ministry_involvements')->nullable()->after('confirmation_parish');
            $table->json('sacraments_received')->nullable()->after('ministry_involvements');
            $table->text('membership_notes')->nullable()->after('sacraments_received');
            $table->boolean('newsletter_subscribed')->default(true)->after('membership_notes');
            $table->boolean('volunteer_interest')->default(false)->after('newsletter_subscribed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'membership_status',
                'membership_date',
                'last_attendance',
                'baptismal_parish',
                'confirmation_parish',
                'ministry_involvements',
                'sacraments_received',
                'membership_notes',
                'newsletter_subscribed',
                'volunteer_interest'
            ]);
        });
    }
};
