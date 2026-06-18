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
        Schema::create('certificate_releases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('certificate_request_id')->constrained()->onDelete('cascade');
            $table->foreignId('certificate_template_id')->constrained()->onDelete('cascade');
            $table->string('unique_reference')->unique(); // Auto-generated unique reference
            $table->string('certificate_type');
            $table->string('recipient_name');
            $table->string('recipient_email');
            $table->date('certificate_date');
            $table->string('priest_name');
            $table->string('priest_signature_path')->nullable(); // Path to priest's e-signature
            $table->json('certificate_data'); // Final certificate data with all fields
            $table->string('pdf_path')->nullable(); // Path to generated PDF
            $table->enum('status', ['draft', 'generated', 'printed', 'emailed', 'completed'])->default('draft');
            $table->timestamp('printed_at')->nullable();
            $table->timestamp('emailed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index(['certificate_request_id']);
            $table->index(['unique_reference']);
            $table->index(['status']);
            $table->index(['certificate_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certificate_releases');
    }
};
