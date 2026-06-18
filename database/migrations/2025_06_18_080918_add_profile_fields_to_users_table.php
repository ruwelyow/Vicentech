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
            $table->string('phone')->nullable()->after('email');
            $table->enum('gender', ['male', 'female'])->nullable()->after('phone');
            $table->date('birthdate')->nullable()->after('gender');
            $table->text('address')->nullable()->after('birthdate');
            $table->integer('age')->nullable()->after('address');
            // $table->string('profile_image')->nullable()->after('age');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // $table->dropColumn(['phone', 'gender', 'birthdate', 'address', 'age', 'profile_image']);
            $table->dropColumn(['phone', 'gender', 'birthdate', 'address', 'age']);
        });
    }
};
