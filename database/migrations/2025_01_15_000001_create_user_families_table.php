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
        Schema::create('user_families', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('family_id');
            $table->string('family_role')->nullable(); // head, spouse, child, etc.
            $table->string('relationship_to_head')->nullable();
            $table->boolean('is_family_head')->default(false);
            $table->boolean('is_primary')->default(false); // Primary family (original family_id)
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('family_id')->references('id')->on('families')->onDelete('cascade');
            
            // Prevent duplicate entries for same user and family
            $table->unique(['user_id', 'family_id']);
            
            // Index for faster queries
            $table->index(['user_id', 'is_primary']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_families');
    }
};

