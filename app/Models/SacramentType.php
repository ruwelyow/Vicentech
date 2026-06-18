<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SacramentType extends Model
{
    use HasFactory;
    protected $fillable = ['name', 'description', 'requirements'];

    public function appointments() { return $this->hasMany(SacramentAppointment::class); }
} 