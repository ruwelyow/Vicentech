<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CertificateRequest extends Model
{
    protected $fillable = [
        'first_name', 'last_name', 'birthdate', 'email', 'phone', 'address',
        'certificate_type', 'purpose', 'date_needed', 'additional_info', 'status', 'rejection_reason',
        'requester_id', 'recipient_user_id'
    ];

    /**
     * Get the user who made the request
     */
    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    /**
     * Get the user the certificate is for
     */
    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_user_id');
    }
} 