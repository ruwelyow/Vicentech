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
        Schema::create('event_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->onDelete('cascade');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email');
            $table->string('phone');
            $table->integer('age')->nullable();
            $table->enum('gender', ['male', 'female', 'prefer_not_to_say'])->nullable();
            $table->text('address')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->text('dietary_restrictions')->nullable();
            $table->text('special_needs')->nullable();
            $table->enum('how_did_you_hear', [
                'parish_website',
                'parish_bulletin', 
                'social_media',
                'friend_family',
                'parish_announcement',
                'email_newsletter',
                'other'
            ])->nullable();
            $table->text('additional_notes')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamp('registered_at');
            $table->timestamps();

            // Add index for faster queries
            $table->index(['event_id', 'email']);
            $table->index(['event_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_registrations');
    }
};