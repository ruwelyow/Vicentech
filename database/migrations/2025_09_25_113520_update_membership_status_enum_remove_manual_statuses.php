<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, update any users with manual statuses to 'inactive'
        DB::statement("UPDATE users SET membership_status = 'inactive' WHERE membership_status IN ('deceased', 'suspended', 'transferred_out')");
        
        // Then modify the enum to remove the manual statuses
        DB::statement("ALTER TABLE users MODIFY COLUMN membership_status ENUM('active', 'inactive', 'visitor', 'new_member') DEFAULT 'new_member'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore the original enum with all statuses
        DB::statement("ALTER TABLE users MODIFY COLUMN membership_status ENUM('active', 'inactive', 'visitor', 'new_member', 'transferred_out', 'deceased', 'suspended') DEFAULT 'new_member'");
    }
};
