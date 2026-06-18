<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GuestVisit extends Model
{
    use HasFactory;

    protected $fillable = [
        'cookie_id',
        'ip_address',
        'user_agent',
        'referer',
        'url_path',
        'accepted',
        'accepted_at',
        'visit_start',
        'visit_end',
        'pages_viewed',
        'session_duration',
    ];

    protected $casts = [
        'pages_viewed' => 'array',
        'accepted_at' => 'datetime',
        'visit_start' => 'datetime',
        'visit_end' => 'datetime',
    ];
}


