<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventRegistration extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'age',
        'gender',
        'address',
        'emergency_contact_name',
        'emergency_contact_phone',
        'dietary_restrictions',
        'special_needs',
        'how_did_you_hear',
        'additional_notes',
        'status',
        'registered_at',
    ];

    protected $casts = [
        'registered_at' => 'datetime',
        'age' => 'integer',
    ];

    /**
     * Get the event that this registration belongs to.
     * Include archived events so analytics can still access event data.
     */
    public function event()
    {
        return $this->belongsTo(Event::class)->withTrashed();
    }

    /**
     * Get the full name of the registrant.
     */
    public function getFullNameAttribute()
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    /**
     * Scope for pending registrations.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for approved registrations.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope for rejected registrations.
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }
}