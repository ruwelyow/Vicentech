<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ministry extends Model
{
    protected $fillable = [
        'name',
        'description',
        'image',
        'image_data',
        'image_mime',
        'order',
    ];
}
