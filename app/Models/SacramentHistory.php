<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SacramentHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'date',
        'parish',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    /**
     * Get the user that owns the sacrament history record
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
