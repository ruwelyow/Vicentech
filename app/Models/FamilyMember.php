<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FamilyMember extends Model
{
    protected $fillable = [
        'user_id',
        'family_member_id',
        'relationship',
    ];

    public function familyMember()
    {
        return $this->belongsTo(User::class, 'family_member_id');
    }
}
