<?php

// app/Models/PrayerRequest.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrayerRequest extends Model
{
    protected $fillable = ['name', 'email', 'phone', 'request', 'status', 'is_read', 'title', 'rejection_reason'];
}
