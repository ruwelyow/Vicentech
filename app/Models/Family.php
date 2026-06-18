<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Family extends Model
{
    protected $fillable = [
        'family_name',
        'family_code',
        'address',
        'phone',
        'email',
        'family_ministries',
        'newsletter_subscribed',
        'volunteer_family',
        'family_status',
        'parent_family_id',
        'head_user_id'
    ];

    protected function casts(): array
    {
        return [
            'family_ministries' => 'array',
            'newsletter_subscribed' => 'boolean',
            'volunteer_family' => 'boolean',
        ];
    }

    public function members(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get all users in this family (many-to-many relationship).
     */
    public function users()
    {
        return $this->belongsToMany(\App\Models\User::class, 'user_families')
                    ->withPivot('family_role', 'relationship_to_head', 'is_family_head', 'is_primary')
                    ->withTimestamps();
    }

    /**
     * Get the parent family (if this is a sub-family).
     */
    public function parentFamily()
    {
        return $this->belongsTo(\App\Models\Family::class, 'parent_family_id');
    }

    /**
     * Get sub-families (families that have this family as parent).
     */
    public function subFamilies()
    {
        return $this->hasMany(\App\Models\Family::class, 'parent_family_id');
    }

    public function head(): HasMany
    {
        return $this->hasMany(User::class)->where('is_family_head', true);
    }

    public function children(): HasMany
    {
        return $this->hasMany(User::class)->where('family_role', 'child');
    }

    public function spouses(): HasMany
    {
        return $this->hasMany(User::class)->where('family_role', 'spouse');
    }

    public function getFamilySizeAttribute(): int
    {
        return $this->members()->count();
    }

    public function getActiveMembersCountAttribute(): int
    {
        return $this->members()->where('membership_status', 'active')->count();
    }

    public function getFamilyStatusColorAttribute(): string
    {
        return match($this->family_status) {
            'active' => 'green',
            'inactive' => 'yellow',
            'transferred' => 'blue',
            default => 'gray'
        };
    }

    public function getFamilyStatusLabelAttribute(): string
    {
        return match($this->family_status) {
            'active' => 'Active Family',
            'inactive' => 'Inactive Family',
            'transferred' => 'Transferred Family',
            default => 'Unknown'
        };
    }
} 