<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::create('sacrament_time_slots', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('time');
            $table->enum('status', ['available', 'booked', 'disabled'])->default('available');
            $table->timestamps();
        });
    }
    public function down() {
        Schema::dropIfExists('sacrament_time_slots');
    }
}; 