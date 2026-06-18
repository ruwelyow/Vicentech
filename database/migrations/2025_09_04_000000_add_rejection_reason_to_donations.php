<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('donations', function (Blueprint $table) {
            if (!Schema::hasColumn('donations', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('receipt_path');
            }
        });
    }

    public function down()
    {
        Schema::table('donations', function (Blueprint $table) {
            if (Schema::hasColumn('donations', 'rejection_reason')) {
                $table->dropColumn('rejection_reason');
            }
        });
    }
};
