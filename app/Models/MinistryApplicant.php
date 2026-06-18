<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MinistryApplicant extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'birthdate',
        'gender',
        'email',
        'phone',
        'address',
        'server_type',
        'motivation',
        'commitment',
        'status',
        'is_read',
        'rejection_reason',
    ];
}
