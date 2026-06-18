<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Notifications\ResetPasswordNotification;
use App\Models\PasswordHistory;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'gender',
        'birthdate',
        'address',
        'age',
        'profile_image',
        'is_admin',
        'is_staff',
        'is_priest',
        'status',
        'deactivated_at',
        'esignature_path',
        'esignature_data',
        'otp',
        'otp_expires_at',
        // Membership Status Fields
        'membership_status',
        'membership_date',
        'last_attendance',
        'last_login_at',
        'baptismal_parish',
        'confirmation_parish',
        'ministry_involvements',
        'sacraments_received',
        'membership_notes',
        'newsletter_subscribed',
        'volunteer_interest',
        // Family Fields
        'family_id',
        'family_role',
        'relationship_to_head',
        'is_family_head',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'deactivated_at' => 'datetime',
            'password' => 'hashed',
            'membership_date' => 'date',
            'last_attendance' => 'date',
            'last_login_at' => 'datetime',
            'ministry_involvements' => 'array',
            'sacraments_received' => 'array',
            'newsletter_subscribed' => 'boolean',
            'volunteer_interest' => 'boolean',
        ];
    }

    public function sendPasswordResetNotification($token)
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    /**
     * Get the password history for this user.
     */
    public function passwordHistory()
    {
        return $this->hasMany(\App\Models\PasswordHistory::class);
    }

    /**
     * Check if a password has been used before by this user.
     */
    public function hasUsedPassword($password)
    {
        return PasswordHistory::hasUsedPassword($this->id, $password);
    }

    /**
     * Get the priest calendar entries for this user.
     */
    public function priestCalendars()
    {
        return $this->hasMany(\App\Models\PriestCalendar::class, 'priest_id');
    }

    /**
     * Check if the user is a priest.
     */
    public function isPriest()
    {
        return $this->is_priest == 1 || $this->is_priest === true || $this->is_priest === "1";
    }

    /**
     * Check if the user is an active parishioner.
     */
    public function isActiveParishioner()
    {
        return $this->membership_status === 'active';
    }

    /**
     * Check if the user is a new member.
     */
    public function isNewMember()
    {
        return $this->membership_status === 'new_member';
    }

    /**
     * Get membership status badge color.
     */
    public function getMembershipStatusColor()
    {
        return match($this->membership_status) {
            'active' => 'green',
            'inactive' => 'yellow',
            'visitor' => 'blue',
            'new_member' => 'purple',
            default => 'gray'
        };
    }

    /**
     * Get membership status label.
     */
    public function getMembershipStatusLabel()
    {
        return match($this->membership_status) {
            'active' => 'Active Member',
            'inactive' => 'Inactive Member',
            'visitor' => 'Visitor',
            'new_member' => 'New Member',
            default => 'Unknown'
        };
    }

    /**
     * Scope for active parishioners.
     */
    public function scopeActiveParishioners($query)
    {
        return $query->where('membership_status', 'active');
    }

    /**
     * Scope for new members.
     */
    public function scopeNewMembers($query)
    {
        return $query->where('membership_status', 'new_member');
    }

    /**
     * Scope for visitors.
     */
    public function scopeVisitors($query)
    {
        return $query->where('membership_status', 'visitor');
    }

    /**
     * Get the donations for this user.
     */
    public function donations()
    {
        return $this->hasMany(\App\Models\Donation::class, 'email', 'email');
    }

    /**
     * Get the event registrations for this user.
     */
    public function eventRegistrations()
    {
        return $this->hasMany(\App\Models\EventRegistration::class, 'email', 'email');
    }

    /**
     * Get the prayer requests for this user.
     */
    public function prayerRequests()
    {
        return $this->hasMany(\App\Models\PrayerRequest::class, 'email', 'email');
    }

    /**
     * Get the mass attendances for this user.
     */
    public function massAttendances()
    {
        return $this->hasMany(\App\Models\MassAttendance::class);
    }

    /**
     * Get the latest mass attendance for this user.
     */
    public function latestMassAttendance()
    {
        return $this->hasOne(\App\Models\MassAttendance::class)
            ->where('is_confirmed', true)
            ->orderBy('attendance_date', 'desc')
            ->orderBy('created_at', 'desc');
    }

    /**
     * Get the family this user belongs to (primary family via family_id).
     */
    public function family()
    {
        return $this->belongsTo(\App\Models\Family::class);
    }

    /**
     * Get all families this user belongs to (many-to-many relationship).
     */
    public function families()
    {
        return $this->belongsToMany(\App\Models\Family::class, 'user_families')
                    ->withPivot('family_role', 'relationship_to_head', 'is_family_head', 'is_primary')
                    ->withTimestamps();
    }

    /**
     * Get the primary family (where is_primary = true).
     */
    public function primaryFamily()
    {
        return $this->belongsToMany(\App\Models\Family::class, 'user_families')
                    ->wherePivot('is_primary', true)
                    ->withPivot('family_role', 'relationship_to_head', 'is_family_head', 'is_primary')
                    ->withTimestamps();
    }

    /**
     * Get secondary families (where is_primary = false).
     */
    public function secondaryFamilies()
    {
        return $this->belongsToMany(\App\Models\Family::class, 'user_families')
                    ->wherePivot('is_primary', false)
                    ->withPivot('family_role', 'relationship_to_head', 'is_family_head', 'is_primary')
                    ->withTimestamps();
    }

    /**
     * Get family members (other users in the same family).
     */
    public function familyMembers()
    {
        return $this->hasMany(\App\Models\User::class, 'family_id', 'family_id')
                    ->where('id', '!=', $this->id);
    }

    /**
     * Check if user is a family head.
     */
    public function isFamilyHead(): bool
    {
        return $this->is_family_head;
    }

    /**
     * Get family role label.
     */
    public function getFamilyRoleLabel(): string
    {
        return match($this->family_role) {
            'head' => 'Family Head',
            'spouse' => 'Spouse',
            'child' => 'Child',
            'parent' => 'Parent',
            'sibling' => 'Sibling',
            'other' => 'Other',
            default => 'Unknown'
        };
    }

    /**
     * Get family role color.
     */
    public function getFamilyRoleColor(): string
    {
        return match($this->family_role) {
            'head' => 'purple',
            'spouse' => 'blue',
            'child' => 'green',
            'parent' => 'orange',
            'sibling' => 'teal',
            'other' => 'gray',
            default => 'gray'
        };
    }

    /**
     * Get the family relationship for this user from family_members table
     */
    public function familyRelationship()
    {
        return $this->hasOne(\App\Models\FamilyMember::class, 'user_id');
    }

    /**
     * Get the family relationship as member from family_members table
     */
    public function familyMemberRelationship()
    {
        return $this->hasOne(\App\Models\FamilyMember::class, 'family_member_id');
    }

    /**
     * Get the actual family relationship from invitation system
     */
    public function getActualFamilyRelationship(): ?string
    {
        // First check if user has family_role (admin assigned)
        if ($this->family_role) {
            return $this->family_role;
        }

        // Then check family_members table for invitation-based relationships
        $relationship = $this->familyRelationship;
        if ($relationship) {
            return $relationship->relationship;
        }

        $memberRelationship = $this->familyMemberRelationship;
        if ($memberRelationship) {
            return $memberRelationship->relationship;
        }

        return null;
    }

    /**
     * Get the actual family relationship label from invitation system
     */
    public function getActualFamilyRelationshipLabel(): string
    {
        $relationship = $this->getActualFamilyRelationship();
        
        if (!$relationship) {
            return 'Unassigned';
        }

        // Map invitation relationship terms to display labels
        return match($relationship) {
            'Father' => 'Father',
            'Mother' => 'Mother',
            'Sibling' => 'Sibling',
            'Spouse' => 'Spouse',
            'Child' => 'Child',
            // Admin assigned roles
            'head' => 'Family Head',
            'spouse' => 'Spouse',
            'child' => 'Child',
            'parent' => 'Parent',
            'sibling' => 'Sibling',
            'other' => 'Other',
            default => $relationship
        };
    }

    /**
     * Get the actual family relationship color from invitation system
     */
    public function getActualFamilyRelationshipColor(): string
    {
        $relationship = $this->getActualFamilyRelationship();
        
        if (!$relationship) {
            return 'gray';
        }

        // Map invitation relationship terms to colors
        return match($relationship) {
            'Father' => 'purple',
            'Mother' => 'pink',
            'Sibling' => 'teal',
            'Spouse' => 'blue',
            'Child' => 'green',
            // Admin assigned roles
            'head' => 'purple',
            'spouse' => 'blue',
            'child' => 'green',
            'parent' => 'orange',
            'sibling' => 'teal',
            'other' => 'gray',
            default => 'gray'
        };
    }
}
