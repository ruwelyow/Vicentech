<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SacramentAppointment extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id', 'sacrament_type_id', 'date', 'time_slot_id', 'status', 'notes', 'rejection_reason'
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function sacramentType() { return $this->belongsTo(SacramentType::class); }
    public function timeSlot() { return $this->belongsTo(SacramentTimeSlot::class); }
} 