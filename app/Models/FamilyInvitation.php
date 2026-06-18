<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FamilyInvitation extends Model
{
    protected $fillable = [
        'inviter_id',
        'invitee_id',
        'family_id',
        'relationship',
        'status',
    ];
}
