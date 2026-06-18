<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShrineRector extends Model
{
    protected $fillable = [
        'name',
        'years',
        'ordination_date',
        'description',
        'type',
        'image',
    ];
}
