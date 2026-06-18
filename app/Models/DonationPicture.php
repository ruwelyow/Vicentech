<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DonationPicture extends Model
{
    protected $fillable = [
        'image_path',
        'original_name',
        'enabled'
    ];

    protected $casts = [
        'enabled' => 'boolean'
    ];
}
