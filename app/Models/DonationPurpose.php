<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DonationPurpose extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'enabled', 'goal_amount'];

    protected $casts = [
        'enabled' => 'boolean',
        'goal_amount' => 'decimal:2',
    ];
}