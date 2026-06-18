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
        // Modify the enum to include 'cancelled' status
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE family_invitations MODIFY COLUMN status ENUM('pending', 'accepted', 'rejected', 'cancelled') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original enum values
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE family_invitations MODIFY COLUMN status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending'");
    }
};
