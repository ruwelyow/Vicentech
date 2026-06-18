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
            $table->string('family_role')->nullable()->after('family_id');
            $table->string('relationship_to_head')->nullable()->after('family_role');
            $table->boolean('is_family_head')->default(false)->after('relationship_to_head');
            $table->string('emergency_contact_name')->nullable()->after('is_family_head');
            $table->string('emergency_contact_phone')->nullable()->after('emergency_contact_name');
            $table->string('emergency_contact_relationship')->nullable()->after('emergency_contact_phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'family_role',
                'relationship_to_head',
                'is_family_head',
                'emergency_contact_name',
                'emergency_contact_phone',
                'emergency_contact_relationship'
            ]);
        });
    }
};
