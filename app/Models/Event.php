<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Event extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'date',
        'time',
        'location',
        'description',
        'image',
        'image_data',
        'image_mime',
    ];

    protected $casts = [
        'date' => 'date',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the registrations for this event.
     */
    public function registrations()
    {
        return $this->hasMany(EventRegistration::class);
    }

    /**
     * Get the approved registrations for this event.
     */
    public function approvedRegistrations()
    {
        return $this->hasMany(EventRegistration::class)->where('status', 'approved');
    }
}
