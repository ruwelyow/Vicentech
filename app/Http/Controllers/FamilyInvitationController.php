<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\FamilyInvitation;
use App\Models\FamilyMember;
use App\Models\UserFamily;
use Illuminate\Http\Request;
use App\Models\Family;
use App\Notifications\FamilyInvitationNotification;

class FamilyInvitationController extends Controller
{
    // Search parishioners
    public function search(Request $request)
    {
        $search = $request->query('search');
        $currentUserId = auth()->id();
        
        $results = User::where(function($query) use ($search) {
            $query->where('name', 'like', "%$search%")
                  ->orWhere('email', 'like', "%$search%");
        })
        // Comment out these lines if you get an error, then add them back one by one
        ->where('is_admin', false)
        ->where('is_staff', false)
        ->where('is_priest', false)
        ->get(['id', 'name', 'email', 'gender', 'is_admin', 'is_staff', 'is_priest', 'family_id', 'is_family_head', 'relationship_to_head', 'membership_status']);
        
        // Add pending invitation status and membership information for each user
        $results->map(function($user) use ($currentUserId) {
            // Check if user is inactive
            $user->is_inactive = $user->membership_status === 'inactive';
            
            // Get the most recent valid invitation status
            $latestValidInvitation = FamilyInvitation::where('invitee_id', $user->id)
                ->where('inviter_id', $currentUserId)
                ->where('status', 'pending')
                ->where('created_at', '>', now()->subDays(30))
                ->orderBy('created_at', 'desc')
                ->first();
            
            // Set pending status only if there's a valid pending invitation
            $user->pending_invited_by_me = !is_null($latestValidInvitation);

            // Check previous family membership
            $user->was_family_member = FamilyMember::where(function($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('family_member_id', $user->id);
            })->exists();

            // Clean up stale invitations for users without family by marking them as rejected
            if (!$user->family_id) {
                FamilyInvitation::where('invitee_id', $user->id)
                    ->where('status', 'pending')
                    ->where('created_at', '<=', now()->subDays(30))
                    ->update(['status' => 'rejected']);
            }
            
            // Add membership status label
            $user->membership_status_label = $user->getMembershipStatusLabel();
            
            return $user;
        });
        
        return $results;
    }

    // Send invitation
    public function send(Request $request)
    {
        $request->validate([
            'invitee_id' => 'required|exists:users,id',
            'relationship' => 'required|string',
            'family_id' => 'nullable|exists:families,id' // Optional: specify which family to invite to
        ]);
        $inviter = auth()->user();
        $invitee = User::findOrFail($request->invitee_id);

        // Determine which family to use
        $targetFamilyId = $request->family_id ?? $inviter->family_id;
        
        // Check if inviter is a family head of the target family
        $isHeadOfTargetFamily = false;
        if ($targetFamilyId === $inviter->family_id) {
            // Primary family - check is_family_head
            $isHeadOfTargetFamily = $inviter->is_family_head;
        } else {
            // Secondary family - check user_families table
            $userFamily = UserFamily::where('user_id', $inviter->id)
                ->where('family_id', $targetFamilyId)
                ->where('is_family_head', true)
                ->first();
            $isHeadOfTargetFamily = !!$userFamily;
        }

        if (!$isHeadOfTargetFamily) {
            return response()->json([
                'success' => false,
                'message' => 'Only the family head can invite new members to the family.'
            ], 403);
        }

        // Family logic - user should already have a family
        if (!$targetFamilyId) {
            return response()->json([
                'success' => false,
                'message' => 'You must create a family first before inviting members. Please go to your profile and create a family.'
            ], 422);
        }
        
        $family = Family::find($targetFamilyId);
        if (!$family) {
            return response()->json([
                'success' => false,
                'message' => 'Family not found. Please create a family first.'
            ], 404);
        }

        // For secondary families, we need to handle invitations differently
        // Check if this is a secondary family invitation
        $isSecondaryFamily = $targetFamilyId !== $inviter->family_id;
        
        // If inviting to a secondary family, prevent inviting members from the original family
        if ($isSecondaryFamily && $inviter->family_id) {
            // Check if invitee is from the inviter's original family
            if ($invitee->family_id === $inviter->family_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot invite members from your original family to your own family group. They are already part of your original family.'
                ], 422);
            }
        }
        
        // Check if invitee is already part of a family
        // Allow inviting family heads - they can be in their own family AND be linked to parent's family
        if ($invitee->family_id && !$invitee->is_family_head && !$isSecondaryFamily) {
            return response()->json([
                'success' => false,
                'message' => 'This person is already part of a family and cannot be invited to another family.'
            ], 422);
        }
        
        // If invitee is a family head, allow the invitation but note they'll keep their primary family
        if ($invitee->family_id && $invitee->is_family_head) {
            // Check if they're already linked to this family via FamilyMember relationship
            $existingRelationship = FamilyMember::where(function($query) use ($inviter, $invitee) {
                $query->where('user_id', $inviter->id)
                      ->where('family_member_id', $invitee->id);
            })->orWhere(function($query) use ($inviter, $invitee) {
                $query->where('user_id', $invitee->id)
                      ->where('family_member_id', $inviter->id);
            })->first();
            
            if ($existingRelationship) {
                return response()->json([
                    'success' => false,
                    'message' => 'This person is already linked to your family.'
                ], 422);
            }
        }

        // Check if invitee is admin/staff/priest
        if ($invitee->is_admin || $invitee->is_staff || $invitee->is_priest) {
            return response()->json([
                'success' => false,
                'message' => 'Admin, staff, and priest accounts cannot be invited to families.'
            ], 422);
        }
        
        // Validate gender-appropriate relationships
        $requestedRelationship = $request->relationship;
        if ($invitee->gender) {
            $gender = strtolower($invitee->gender);
            
            // Male cannot be Wife, Daughter, or Mother
            if (($gender === 'male' || $gender === 'm') && in_array($requestedRelationship, ['Wife', 'Daughter', 'Mother'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'This person is male and cannot be invited as ' . $requestedRelationship . '.'
                ], 422);
            }
            
            // Female cannot be Husband, Son, or Father
            if (($gender === 'female' || $gender === 'f') && in_array($requestedRelationship, ['Husband', 'Son', 'Father'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'This person is female and cannot be invited as ' . $requestedRelationship . '.'
                ], 422);
            }
        }
        
        // Validate that if invitee is already a Father/Mother in their own family,
        // they cannot be invited as Father/Mother to another family
        if ($invitee->family_id && $invitee->is_family_head && $invitee->relationship_to_head) {
            $inviteeCurrentRole = $invitee->relationship_to_head;
            
            // If invitee is already a Father, they cannot be invited as Father
            if ($inviteeCurrentRole === 'Father' && $requestedRelationship === 'Father') {
                return response()->json([
                    'success' => false,
                    'message' => 'This person is already a Father in their own family. They can only be invited as Son, Daughter, or Sibling.'
                ], 422);
            }
            
            // If invitee is already a Mother, they cannot be invited as Mother
            if ($inviteeCurrentRole === 'Mother' && $requestedRelationship === 'Mother') {
                return response()->json([
                    'success' => false,
                    'message' => 'This person is already a Mother in their own family. They can only be invited as Son, Daughter, or Sibling.'
                ], 422);
            }
            
            // If invitee is already a Father, they cannot be invited as Husband (same role)
            if ($inviteeCurrentRole === 'Father' && $requestedRelationship === 'Husband') {
                return response()->json([
                    'success' => false,
                    'message' => 'This person is already a Father in their own family. They can only be invited as Son, Daughter, or Sibling.'
                ], 422);
            }
            
            // If invitee is already a Mother, they cannot be invited as Wife (same role)
            if ($inviteeCurrentRole === 'Mother' && $requestedRelationship === 'Wife') {
                return response()->json([
                    'success' => false,
                    'message' => 'This person is already a Mother in their own family. They can only be invited as Son, Daughter, or Sibling.'
                ], 422);
            }
        }
        
        // Validate that Mother and Father can only be one each in a family
        // But siblings, sons, and daughters can be multiple
        $requestedRelationship = $request->relationship;
        $uniqueRelationships = ['Mother', 'Father', 'Husband', 'Wife']; // These should be unique
        
        if (in_array($requestedRelationship, $uniqueRelationships)) {
            // Determine if this is a primary or secondary family
            $isSecondaryFamily = $targetFamilyId !== $inviter->family_id;
            
            if ($isSecondaryFamily) {
                // For secondary/extended families, ONLY check user_families table for THIS specific family
                // Do NOT check FamilyMember relationships as they can span multiple families
                $existingSecondaryMember = \Illuminate\Support\Facades\DB::table('user_families')
                    ->where('family_id', $targetFamilyId)
                    ->where('relationship_to_head', $requestedRelationship)
                    ->where('user_id', '!=', $inviter->id) // Don't count the inviter themselves
                    ->first();
                
                if ($existingSecondaryMember) {
                    return response()->json([
                        'success' => false,
                        'message' => "This family already has a {$requestedRelationship}. Only one {$requestedRelationship} is allowed per family."
                    ], 422);
                }
            } else {
                // For primary families, ONLY check users table (same family_id) for THIS specific family
                // Do NOT check FamilyMember relationships as they can span multiple families
                $existingPrimaryMember = User::where('family_id', $targetFamilyId)
                    ->where('relationship_to_head', $requestedRelationship)
                    ->where('id', '!=', $inviter->id) // Don't count the inviter themselves
                    ->first();
                
                if ($existingPrimaryMember) {
                    return response()->json([
                        'success' => false,
                        'message' => "This family already has a {$requestedRelationship}. Only one {$requestedRelationship} is allowed per family."
                    ], 422);
                }
            }
        }
        
        // Do NOT assign invitee to family here. Only do it when they accept.
        // Use direct DB insert to avoid id field issues, then load the model
        $invitationId = \Illuminate\Support\Facades\DB::table('family_invitations')->insertGetId([
            'inviter_id' => $inviter->id,
            'invitee_id' => $invitee->id,
            'family_id' => $targetFamilyId, // Store which family the invitation is for
            'relationship' => $request->relationship,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Load the invitation model instance
        $invitation = FamilyInvitation::find($invitationId);
        
        // Send notification to invitee
        $invitee->notify(new FamilyInvitationNotification($inviter, $request->relationship, $invitation));
        return response()->json($invitation, 201);
    }

    // Get invitations for the authenticated user
    public function index()
    {
        $userId = auth()->id();
        $invitations = FamilyInvitation::where('inviter_id', $userId)
            ->orWhere('invitee_id', $userId)
            ->get();
        // Attach inviter_name to each invitation
        $invitations->transform(function ($invite) {
            $inviter = User::find($invite->inviter_id);
            $invite->inviter_name = $inviter ? $inviter->name : $invite->inviter_id;
            return $invite;
        });
        return $invitations;
    }

    // Accept or reject invitation
    public function respond(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:accepted,rejected']);
        $invitation = FamilyInvitation::findOrFail($id);
        if ($invitation->invitee_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        // Check if invitation has already been responded to
        if ($invitation->status !== 'pending') {
            return response()->json([
                'error' => 'This invitation has already been ' . $invitation->status
            ], 400);
        }
        
        $invitation->status = $request->status;
        $invitation->save();
        if ($request->status === 'accepted') {
            $inviter = User::find($invitation->inviter_id);
            $invitee = User::find($invitation->invitee_id);
            
            // Check if inviter and invitee exist
            if (!$inviter) {
                return response()->json(['error' => 'Inviter not found'], 400);
            }
            
            if (!$invitee) {
                return response()->json(['error' => 'Invitee not found'], 400);
            }
            
            // Get target family - use stored family_id from invitation, or fallback to inviter's primary family
            $targetFamilyId = $invitation->family_id ?? $inviter->family_id;
            
            // Ensure inviter has a family
            if (!$targetFamilyId) {
                return response()->json(['error' => 'Inviter does not have a family'], 400);
            }
            
            // Verify that the target family exists
            $targetFamily = Family::find($targetFamilyId);
            if (!$targetFamily) {
                return response()->json(['error' => 'Target family not found'], 400);
            }
            
            // Validate that Mother and Father can only be one each in a family
            // But siblings, sons, and daughters can be multiple
            $requestedRelationship = $invitation->relationship;
            $uniqueRelationships = ['Mother', 'Father', 'Husband', 'Wife']; // These should be unique
            
            if (in_array($requestedRelationship, $uniqueRelationships)) {
                // Check primary family members (same family_id)
                $existingPrimaryMember = User::where('family_id', $targetFamilyId)
                    ->where('relationship_to_head', $requestedRelationship)
                    ->where('id', '!=', $inviter->id) // Don't count the inviter themselves
                    ->where('id', '!=', $invitee->id) // Don't count the invitee themselves
                    ->first();
                
                if ($existingPrimaryMember) {
                    $invitation->status = 'rejected';
                    $invitation->save();
                    return response()->json([
                        'error' => "This family already has a {$requestedRelationship}. Only one {$requestedRelationship} is allowed per family."
                    ], 422);
                }
                
                // Check linked family members (via FamilyMember relationships)
                // Check both directions: where family members are user_id and where they are family_member_id
                $familyMemberIds = User::where('family_id', $targetFamilyId)->pluck('id')->toArray();
                if (!empty($familyMemberIds)) {
                    $existingLinkedMember = FamilyMember::where(function($query) use ($familyMemberIds, $requestedRelationship, $invitee) {
                        $query->whereIn('user_id', $familyMemberIds)
                              ->where('relationship', $requestedRelationship)
                              ->where('family_member_id', '!=', $invitee->id); // Don't count the invitee themselves
                    })->orWhere(function($query) use ($familyMemberIds, $requestedRelationship, $invitee) {
                        $query->whereIn('family_member_id', $familyMemberIds)
                              ->where('relationship', $requestedRelationship)
                              ->where('user_id', '!=', $invitee->id); // Don't count the invitee themselves
                    })->first();
                    
                    if ($existingLinkedMember) {
                        $invitation->status = 'rejected';
                        $invitation->save();
                        return response()->json([
                            'error' => "This family already has a {$requestedRelationship}. Only one {$requestedRelationship} is allowed per family."
                        ], 422);
                    }
                }
            }
            
            // If invitee is a family head, they keep their primary family but get linked via relationship
            // Add them to user_families as a secondary family so they can see both families
            if ($invitee->is_family_head && $invitee->family_id) {
                // Don't change their family_id - they keep their primary family
                // Add them to user_families table as a secondary family member
                $existingRecord = \Illuminate\Support\Facades\DB::table('user_families')
                    ->where('user_id', $invitee->id)
                    ->where('family_id', $targetFamilyId)
                    ->first();
                
                if (!$existingRecord) {
                    \Illuminate\Support\Facades\DB::table('user_families')->insert([
                        'user_id' => $invitee->id,
                        'family_id' => $targetFamilyId,
                        'family_role' => 'member', // They're a member in the invited family, not head
                        'is_family_head' => false,
                        'is_primary' => false, // This is a secondary family for them
                        'relationship_to_head' => $invitation->relationship,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    // Update existing record
                    \Illuminate\Support\Facades\DB::table('user_families')
                        ->where('user_id', $invitee->id)
                        ->where('family_id', $targetFamilyId)
                        ->update([
                            'family_role' => 'member',
                            'is_family_head' => false,
                            'is_primary' => false,
                            'relationship_to_head' => $invitation->relationship,
                            'updated_at' => now(),
                        ]);
                }
            } else if ($invitee->family_id && $invitee->family_id !== $targetFamilyId) {
                // Regular member who already has a different family - cannot accept
                return response()->json(['error' => 'You are already part of another family'], 400);
            } else {
                // Regular member without a family - add them to the target family
                // Check if this is a secondary family (use the family we already found)
                $isSecondaryFamily = $targetFamily && $targetFamily->parent_family_id !== null;
                
                if ($isSecondaryFamily) {
                    // Add to user_families table for secondary family
                    // Check if record already exists to avoid duplicate
                    $existingRecord = \Illuminate\Support\Facades\DB::table('user_families')
                        ->where('user_id', $invitee->id)
                        ->where('family_id', $targetFamilyId)
                        ->first();
                    
                    if (!$existingRecord) {
                        \Illuminate\Support\Facades\DB::table('user_families')->insert([
                            'user_id' => $invitee->id,
                            'family_id' => $targetFamilyId,
                            'family_role' => 'member',
                            'is_family_head' => false,
                            'is_primary' => false,
                            'relationship_to_head' => $invitation->relationship,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        // Update existing record
                        \Illuminate\Support\Facades\DB::table('user_families')
                            ->where('user_id', $invitee->id)
                            ->where('family_id', $targetFamilyId)
                            ->update([
                                'family_role' => 'member',
                                'is_family_head' => false,
                                'is_primary' => false,
                                'relationship_to_head' => $invitation->relationship,
                                'updated_at' => now(),
                            ]);
                    }
                } else {
                    // Primary family - update user's family_id
                    $invitee->update([
                        'family_id' => $targetFamilyId,
                        'family_role' => 'member', // Set as regular member, not head
                        'relationship_to_head' => $invitation->relationship,
                        'is_family_head' => false // Ensure they are not a family head
                    ]);
                    
                    // Also add to user_families table as primary
                    // Check if record already exists to avoid duplicate
                    $existingRecord = \Illuminate\Support\Facades\DB::table('user_families')
                        ->where('user_id', $invitee->id)
                        ->where('family_id', $targetFamilyId)
                        ->first();
                    
                    if (!$existingRecord) {
                        \Illuminate\Support\Facades\DB::table('user_families')->insert([
                            'user_id' => $invitee->id,
                            'family_id' => $targetFamilyId,
                            'family_role' => 'member',
                            'is_family_head' => false,
                            'is_primary' => true,
                            'relationship_to_head' => $invitation->relationship,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        // Update existing record
                        \Illuminate\Support\Facades\DB::table('user_families')
                            ->where('user_id', $invitee->id)
                            ->where('family_id', $targetFamilyId)
                            ->update([
                                'family_role' => 'member',
                                'is_family_head' => false,
                                'is_primary' => true,
                                'relationship_to_head' => $invitation->relationship,
                                'updated_at' => now(),
                            ]);
                    }
                }
            }
            
            // Create family member relationship (only one direction - from inviter to invitee)
            // This ensures that only the inviting family sees the invited member
            // The invited family does NOT see the inviter in their member list
            // Check if relationship already exists to avoid duplicates
            $existingFamilyMember = \Illuminate\Support\Facades\DB::table('family_members')
                ->where('user_id', $invitation->inviter_id)
                ->where('family_member_id', $invitation->invitee_id)
                ->first();
            
            if (!$existingFamilyMember) {
                // Use direct DB insert to avoid id field issues
                \Illuminate\Support\Facades\DB::table('family_members')->insert([
                    'user_id' => $invitation->inviter_id,
                    'family_member_id' => $invitation->invitee_id,
                    'relationship' => $invitation->relationship,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                // Update existing relationship
                \Illuminate\Support\Facades\DB::table('family_members')
                    ->where('user_id', $invitation->inviter_id)
                    ->where('family_member_id', $invitation->invitee_id)
                    ->update([
                        'relationship' => $invitation->relationship,
                        'updated_at' => now(),
                    ]);
            }
            
            // Send notifications
            // Notification::create(['user_id' => $inviter->id, 'message' => $invitee->name.' has joined your family group.']);
            // Notification::create(['user_id' => $invitee->id, 'message' => 'You have joined a family group.']);
        }
        return response()->json($invitation);
    }

    // Get accepted family members
    public function familyMembers()
    {
        $user = auth()->user();
        $members = collect();
        
        // Get members from primary family (same family_id)
        // Include current user in the list when they have family_id (for certificate requests)
        if ($user->family_id) {
            $primaryFamilyMembers = User::where('family_id', $user->family_id)
                ->select('id', 'name', 'email', 'profile_image', 'family_id', 'is_family_head', 'family_role', 'relationship_to_head', 'birthdate', 'address')
                ->get();
            $members = $members->merge($primaryFamilyMembers);
            
            // Get IDs of primary family members to exclude them from user_families query
            $primaryMemberIds = $primaryFamilyMembers->pluck('id')->toArray();
            
            // Also get members from user_families table (invited family heads, etc.)
            // This ensures invited family heads appear in the family member list for all members
            $userFamiliesMembers = \Illuminate\Support\Facades\DB::table('user_families')
                ->join('users', 'user_families.user_id', '=', 'users.id')
                ->where('user_families.family_id', $user->family_id)
                ->where('users.is_admin', 0)
                ->where('users.is_staff', 0)
                ->where('users.is_priest', 0)
                ->whereNotIn('users.id', $primaryMemberIds) // Exclude primary family members to avoid duplicates
                ->select(
                    'users.id',
                    'users.name',
                    'users.email',
                    'users.profile_image',
                    'users.family_id',
                    'users.birthdate',
                    'users.address',
                    'user_families.family_role',
                    'user_families.relationship_to_head',
                    'user_families.is_family_head'
                )
                ->get()
                ->map(function($member) {
                    return (object) [
                        'id' => $member->id,
                        'name' => $member->name,
                        'email' => $member->email,
                        'profile_image' => $member->profile_image,
                        'family_id' => $member->family_id,
                        'is_family_head' => (bool) $member->is_family_head, // Use is_family_head from user_families (should be false for invited family heads)
                        'family_role' => $member->family_role, // Use family_role from user_families (should be 'member' for invited family heads)
                        'relationship_to_head' => $member->relationship_to_head,
                        'birthdate' => $member->birthdate,
                        'address' => $member->address,
                    ];
                });
            
            // Merge user_families members, avoiding duplicates
            $existingIds = $members->pluck('id')->toArray();
            $newUserFamiliesMembers = $userFamiliesMembers->reject(function($member) use ($existingIds) {
                return in_array($member->id, $existingIds);
            });
            $members = $members->merge($newUserFamiliesMembers);
        }
        
        // Get members linked via FamilyMember relationships
        // Only show linked members where the current user's family INVITED them (user_id is in current user's family)
        // Do NOT show linked members where the current user's family WAS INVITED (family_member_id is in current user's family)
        // This ensures that if Family 1 head invites Family 2 head, Family 2 head appears in Family 1's list
        // but Family 2 head does NOT see Family 1 head in their own family list
        if ($user->family_id) {
            // Get all user IDs in the current user's family
            $familyMemberIds = User::where('family_id', $user->family_id)->pluck('id')->toArray();
            
            if (!empty($familyMemberIds)) {
                // Only get FamilyMember records where user_id is in the current user's family
                // This means the current user's family INVITED the linked member
                $linkedMembers = FamilyMember::whereIn('user_id', $familyMemberIds)
                    ->whereNotIn('family_member_id', $familyMemberIds) // Exclude same family members
                    ->get();
                
                $linkedUserIds = $linkedMembers->pluck('family_member_id')->unique()->toArray();
                
                if (!empty($linkedUserIds)) {
                    $linkedUsers = User::whereIn('id', $linkedUserIds)
                        ->select('id', 'name', 'email', 'profile_image', 'family_id', 'is_family_head', 'family_role', 'relationship_to_head', 'birthdate', 'address')
                        ->get();
                    
                    // Add relationship info to linked users
                    $linkedUsers = $linkedUsers->map(function($linkedUser) use ($linkedMembers) {
                        $relationship = $linkedMembers->first(function($link) use ($linkedUser) {
                            return $link->family_member_id === $linkedUser->id;
                        });
                        $linkedUser->relationship = $relationship ? $relationship->relationship : null;
                        $linkedUser->is_linked_via_relationship = true; // Flag to indicate this is a relationship link, not same family_id
                        return $linkedUser;
                    });
                    
                    // Merge linked users, avoiding duplicates
                    $existingIds = $members->pluck('id')->toArray();
                    $newLinkedUsers = $linkedUsers->reject(function($linkedUser) use ($existingIds) {
                        return in_array($linkedUser->id, $existingIds);
                    });
                    $members = $members->merge($newLinkedUsers);
                }
            }
        }
        
        return response()->json($members->values());
    }
}
