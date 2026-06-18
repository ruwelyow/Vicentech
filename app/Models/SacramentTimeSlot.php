<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SacramentTimeSlot extends Model
{
    use HasFactory;
    protected $fillable = [
        'date', 'time', 'status', 'sacrament_type_id' // status: available, booked, disabled
    ];

    public function appointments() { 
        return $this->hasMany(SacramentAppointment::class, 'time_slot_id'); 
    }
    
    public function sacramentType() { 
        return $this->belongsTo(SacramentType::class, 'sacrament_type_id'); 
    }
} 