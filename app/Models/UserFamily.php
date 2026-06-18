<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserFamily extends Model
{
    protected $table = 'user_families';

    public $incrementing = true;
    
    protected $keyType = 'int';

    protected $fillable = [
        'user_id',
        'family_id',
        'family_role',
        'relationship_to_head',
        'is_family_head',
        'is_primary',
    ];

    protected function casts(): array
    {
        return [
            'is_family_head' => 'boolean',
            'is_primary' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(Family::class);
    }
}

