<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Donation extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'email', 'amount', 'reference', 'category', 'purpose_name', 'receipt_path', 'verified', 'rejection_reason', 'is_physical'
    ];
}
