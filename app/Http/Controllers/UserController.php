<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function me(Request $request)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Update last login/online time when user accesses the system
        // Only update if it's been more than 5 minutes since last update to avoid too many DB writes
        if (!$user->last_login_at || now()->diffInMinutes($user->last_login_at) > 5) {
            $user->last_login_at = now();
            $user->save();
        }

        return response()->json($user);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $user->name = $request->input('name');
        $user->phone = $request->input('phone');
        $user->gender = $request->input('gender');
        $user->birthdate = $request->input('birthdate');
        $user->address = $request->input('address');

        // Handle profile image upload as base64
        if ($request->hasFile('profile_image')) {
            $file = $request->file('profile_image');
            $user->profile_image = base64_encode(file_get_contents($file->getRealPath()));
            $user->profile_image_mime = $file->getMimeType();
        }

        $user->save();

        return response()->json([
            'user' => $user,
            'message' => 'Profile updated successfully'
        ]);
    }

    public function show($id)
    {
        $user = \App\Models\User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        return response()->json($user);
    }

    public function update(Request $request, $id)
    {
        $user = \App\Models\User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        // Validate the request
        $request->validate([
            'name' => ['sometimes', 'string', 'max:255', 'regex:/^[\p{L}\s.]+$/u'],
            'email' => 'sometimes|email|max:255|unique:users,email,' . $id,
            'phone' => 'sometimes|string|max:20',
            'gender' => 'sometimes|string|in:male,female',
            'birthdate' => 'sometimes|date',
            'address' => ['sometimes', 'string', 'max:500', 'regex:/^[\p{L}0-9\s,.\-#\/()]+$/u'],
            'password' => 'sometimes|string|min:8|confirmed',
            'is_admin' => 'sometimes|boolean',
            'is_staff' => 'sometimes|boolean',
            'is_priest' => 'sometimes|boolean',
            'status' => 'sometimes|string|in:active,inactive',
            'membership_status' => 'sometimes|string|in:active,inactive,visitor,new_member,transferred_out,deceased,suspended',
            'membership_date' => 'sometimes|nullable|date',
            'last_attendance' => 'sometimes|nullable|date',
            'baptismal_parish' => 'sometimes|nullable|string|max:255',
            'confirmation_parish' => 'sometimes|nullable|string|max:255',
            'ministry_involvements' => 'sometimes|nullable|array',
            'membership_notes' => 'sometimes|nullable|string',
            'newsletter_subscribed' => 'sometimes|boolean',
            'volunteer_interest' => 'sometimes|boolean',
            'deactivate' => 'sometimes|boolean',
        ], [
            'name.regex' => 'Name may only contain letters, spaces, and periods (for middle initials and suffixes). Numbers and other special characters are not allowed.',
            'address.regex' => 'Address may only contain letters, numbers, spaces, and common address characters (comma, period, hyphen, hash, slash, parentheses).',
        ]);

        // Update user fields
        $user->name = $request->input('name', $user->name);
        $user->email = $request->input('email', $user->email);
        $user->phone = $request->input('phone', $user->phone);
        $user->gender = $request->input('gender', $user->gender);
        $user->birthdate = $request->input('birthdate', $user->birthdate);
        $user->address = $request->input('address', $user->address);

        // Handle role changes
        if ($request->has('is_admin')) {
            $user->is_admin = $request->input('is_admin');
        }
        if ($request->has('is_staff')) {
            $user->is_staff = $request->input('is_staff');
        }
        if ($request->has('is_priest')) {
            $user->is_priest = $request->input('is_priest');
        }

        // Handle password update
        if ($request->has('password') && $request->input('password')) {
            $user->password = bcrypt($request->input('password'));
        }

        // Handle membership_status update
        if ($request->has('membership_status')) {
            $user->membership_status = $request->input('membership_status');
        }

        // Handle membership details update
        if ($request->has('membership_date')) {
            $user->membership_date = $request->input('membership_date');
        }
        if ($request->has('last_attendance')) {
            $user->last_attendance = $request->input('last_attendance');
        }
        if ($request->has('baptismal_parish')) {
            $user->baptismal_parish = $request->input('baptismal_parish');
        }
        if ($request->has('confirmation_parish')) {
            $user->confirmation_parish = $request->input('confirmation_parish');
        }
        if ($request->has('ministry_involvements')) {
            $user->ministry_involvements = $request->input('ministry_involvements');
        }
        if ($request->has('membership_notes')) {
            $user->membership_notes = $request->input('membership_notes');
        }
        if ($request->has('newsletter_subscribed')) {
            $user->newsletter_subscribed = $request->input('newsletter_subscribed');
        }
        if ($request->has('volunteer_interest')) {
            $user->volunteer_interest = $request->input('volunteer_interest');
        }

        // Handle status update (for deactivation/activation)
        if ($request->has('status')) {
            $oldStatus = $user->status;
            $user->status = $request->input('status');
            
            // If user is being deactivated, invalidate all their sessions
            if ($oldStatus !== 'inactive' && $user->status === 'inactive') {
                // Delete all sessions for this user from the sessions table
                \DB::table('sessions')->where('user_id', $user->id)->delete();
                
                // Store deactivation timestamp for immediate logout detection
                $user->deactivated_at = now();
                
                // Log the deactivation for audit purposes
                \Log::info('User account deactivated', [
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'user_email' => $user->email,
                    'deactivated_by' => $request->user()->id ?? 'unknown',
                    'deactivated_at' => now()
                ]);
            } else if ($oldStatus === 'inactive' && $user->status === 'active') {
                // User is being reactivated, clear deactivation timestamp
                $user->deactivated_at = null;
                
                // Log the reactivation for audit purposes
                \Log::info('User account reactivated', [
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'user_email' => $user->email,
                    'reactivated_by' => $request->user()->id ?? 'unknown',
                    'reactivated_at' => now()
                ]);
            }
        }

        $user->save();

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    }

    public function destroy($id)
    {
        $user = \App\Models\User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }
        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }

    public function leave(Request $request)
    {
        $user = $request->user();
        $familyId = $request->input('family_id'); // Get which family to leave

        // Determine if leaving primary or secondary family
        $isPrimaryFamily = $familyId && $user->family_id == $familyId;
        $isSecondaryFamily = $familyId && $user->family_id != $familyId;

        if ($isPrimaryFamily) {
            // Leaving primary family - only members (not family heads) can leave
            if ($user->is_family_head) {
                return response()->json(['error' => 'Family heads cannot leave their primary family. If you need to leave, please transfer head status to another member first or contact support.'], 403);
            }

            if (!$user->family_id) {
                return response()->json(['error' => 'You are not part of any family group.'], 400);
            }

            // Remove user from primary family
            $user->update([
                'family_id' => null,
                'family_role' => null,
                'relationship_to_head' => null,
                'is_family_head' => false
            ]);

            // Remove from user_families table (primary family record)
            \Illuminate\Support\Facades\DB::table('user_families')
                ->where('user_id', $user->id)
                ->where('family_id', $familyId)
                ->where('is_primary', true)
                ->delete();
        } elseif ($isSecondaryFamily) {
            // Leaving secondary family - check if user is head of that secondary family
            $userFamily = \App\Models\UserFamily::where('user_id', $user->id)
                ->where('family_id', $familyId)
                ->where('is_family_head', true)
                ->first();
            
            if ($userFamily) {
                return response()->json(['error' => 'You cannot leave a family where you are the head. Please delete the family instead or transfer head status first.'], 403);
            }

            // Remove from user_families table (secondary family record)
            \Illuminate\Support\Facades\DB::table('user_families')
                ->where('user_id', $user->id)
                ->where('family_id', $familyId)
                ->where('is_primary', false)
                ->delete();
        } else {
            // No family_id provided or invalid - use old behavior (leave primary family)
            if ($user->is_family_head) {
                return response()->json(['error' => 'Family heads cannot leave their family. If you need to leave, please transfer head status to another member first or contact support.'], 403);
            }

            if (!$user->family_id) {
                return response()->json(['error' => 'You are not part of any family group.'], 400);
            }

            $user->update([
                'family_id' => null,
                'family_role' => null,
                'relationship_to_head' => null,
                'is_family_head' => false
            ]);

            // Remove from user_families table
            \Illuminate\Support\Facades\DB::table('user_families')
                ->where('user_id', $user->id)
                ->where('is_primary', true)
                ->delete();
        }

        // Remove any linked family relationships where user is involved with this family
        // Remove relationships where user is the inviter and the other person is in the target family
        // OR where user is the invitee and the inviter is in the target family
        if ($familyId) {
            $familyMemberIds = \App\Models\User::where('family_id', $familyId)->pluck('id')->toArray();
            
            if (!empty($familyMemberIds)) {
                // Remove relationships where user invited someone from this family
                \App\Models\FamilyMember::where('user_id', $user->id)
                    ->whereIn('family_member_id', $familyMemberIds)
                    ->delete();
                
                // Remove relationships where someone from this family invited the user
                \App\Models\FamilyMember::whereIn('user_id', $familyMemberIds)
                    ->where('family_member_id', $user->id)
                    ->delete();
            }
        } else {
            // Fallback: remove all family relationships if no family_id specified
            \App\Models\FamilyMember::where('user_id', $user->id)
                ->orWhere('family_member_id', $user->id)
                ->delete();
        }

        // Mark any pending invitations as 'cancelled' when leaving
        \App\Models\FamilyInvitation::where('invitee_id', $user->id)
            ->where('status', 'pending')
            ->update(['status' => 'cancelled']);

        return response()->json(['message' => 'You have left the family group.']);
    }

    public function removeFamilyMember($id, Request $request)
    {
        $head = $request->user();
        $member = \App\Models\User::find($id);
        
        // Get optional family_id from query parameter to specify which family to remove from
        $targetFamilyId = $request->query('family_id');

        if (!$member) {
            return response()->json(['error' => 'Member not found.'], 404);
        }

        // Check if member is in head's primary family
        $isInPrimaryFamily = $head->family_id && $member->family_id === $head->family_id;
        
        // Check if member is in a secondary family where head is the head
        $isInSecondaryFamily = false;
        $secondaryFamilyId = null;
        
        // Check user_families table for secondary families
        $headFamilyRecords = \Illuminate\Support\Facades\DB::table('user_families')
            ->where('user_id', $head->id)
            ->where('is_family_head', true)
            ->where('is_primary', false)
            ->get();
        
        foreach ($headFamilyRecords as $headFamilyRecord) {
            if ($targetFamilyId && $headFamilyRecord->family_id != $targetFamilyId) {
                continue; // Skip if target family ID doesn't match
            }
            
            // Check if member is in this secondary family
            $memberFamilyRecord = \Illuminate\Support\Facades\DB::table('user_families')
                ->where('user_id', $member->id)
                ->where('family_id', $headFamilyRecord->family_id)
                ->where('is_primary', false)
                ->first();
            
            if ($memberFamilyRecord) {
                $isInSecondaryFamily = true;
                $secondaryFamilyId = $headFamilyRecord->family_id;
                break;
            }
        }
        
        // Check if member is linked via family_members relationship (but only if not in primary or secondary)
        $isLinkedViaRelationship = false;
        if (!$isInPrimaryFamily && !$isInSecondaryFamily) {
            // Check if head invited this member (head is user_id, member is family_member_id)
            $familyMemberLink = \App\Models\FamilyMember::where('user_id', $head->id)
                ->where('family_member_id', $member->id)
                ->first();
            
            $isLinkedViaRelationship = !!$familyMemberLink;
        }

        // Member must be in one of these relationships
        if (!$isInPrimaryFamily && !$isInSecondaryFamily && !$isLinkedViaRelationship) {
            return response()->json(['error' => 'Member not found in your family group.'], 404);
        }

        // Check if head has permission (must be head of the family)
        $headIsAuthorized = false;
        if ($isInPrimaryFamily) {
            $headIsAuthorized = $head->is_family_head;
        } elseif ($isInSecondaryFamily) {
            $headIsAuthorized = true; // Already verified that head is head of secondary family
        } elseif ($isLinkedViaRelationship) {
            $headIsAuthorized = true; // Head can remove relationships they created
        }

        if (!$headIsAuthorized) {
            return response()->json(['error' => 'Only the family head can remove members.'], 403);
        }

        // Cannot remove the family head from primary family
        if ($isInPrimaryFamily && $member->is_family_head && $member->family_id === $head->family_id) {
            return response()->json(['error' => 'Cannot remove the family head. Please contact support if you need to transfer family head status.'], 403);
        }

        // Cannot remove themselves (head should use leave instead)
        if ($member->id === $head->id) {
            return response()->json(['error' => 'Head cannot remove themselves. Use leave instead.'], 403);
        }

        // Remove member based on relationship type
        if ($isInPrimaryFamily) {
            // Remove from primary family
            $member->update([
                'family_id' => null,
                'family_role' => null,
                'relationship_to_head' => null,
                'is_family_head' => false
            ]);
            
            // Also remove from user_families table (primary family record)
            \Illuminate\Support\Facades\DB::table('user_families')
                ->where('user_id', $member->id)
                ->where('family_id', $head->family_id)
                ->where('is_primary', true)
                ->delete();
                
        } elseif ($isInSecondaryFamily) {
            // Remove from secondary family (user_families table only)
            \Illuminate\Support\Facades\DB::table('user_families')
                ->where('user_id', $member->id)
                ->where('family_id', $secondaryFamilyId)
                ->where('is_primary', false)
                ->delete();
                
            // Also remove linked family relationship if exists
            \App\Models\FamilyMember::where(function($query) use ($head, $member) {
                $query->where('user_id', $head->id)
                      ->where('family_member_id', $member->id);
            })->orWhere(function($query) use ($head, $member) {
                $query->where('user_id', $member->id)
                      ->where('family_member_id', $head->id);
            })->delete();
                
        } elseif ($isLinkedViaRelationship) {
            // This case should be handled by removeRelationship endpoint, but handle it here too
            \App\Models\FamilyMember::where(function($query) use ($head, $member) {
                $query->where('user_id', $head->id)
                      ->where('family_member_id', $member->id);
            })->orWhere(function($query) use ($head, $member) {
                $query->where('user_id', $member->id)
                      ->where('family_member_id', $head->id);
            })->delete();
        }

        // Mark any pending invitations as 'cancelled' when removing member
        \App\Models\FamilyInvitation::where('invitee_id', $member->id)
            ->where('status', 'pending')
            ->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Member removed from family group.']);
    }

    public function removeRelationship(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'member_id' => 'required|exists:users,id'
        ]);

        $memberId = $request->member_id;

        // Find and delete the relationship records (bidirectional)
        $deleted = \App\Models\FamilyMember::where(function($query) use ($user, $memberId) {
            $query->where('user_id', $user->id)
                  ->where('family_member_id', $memberId);
        })->orWhere(function($query) use ($user, $memberId) {
            $query->where('user_id', $memberId)
                  ->where('family_member_id', $user->id);
        })->delete();

        if ($deleted > 0) {
            return response()->json(['message' => 'Linked family relationship removed successfully.']);
        }

        return response()->json(['error' => 'Relationship not found.'], 404);
    }

    public function viewFamilyMembers(Request $request)
    {
        $user = $request->user();

        if (!$user->family_id) {
            return response()->json(['error' => 'You are not part of any family group.'], 400);
        }

        $familyMembers = \App\Models\User::where('family_id', $user->family_id)->orderBy('id')->get();

        return response()->json($familyMembers);
    }

    /**
     * Get family head management dashboard data
     */
public function getFamilyHeadDashboard(Request $request)
    {
        $user = $request->user();
        $familyId = $request->query('family_id'); // Optional: specify which family to manage

        // Determine target family
        $targetFamilyId = $familyId ?? $user->family_id;
        
        // Check if user is head of the target family
        $isHeadOfTargetFamily = false;
        if ($targetFamilyId === $user->family_id) {
            // Primary family - check is_family_head
            $isHeadOfTargetFamily = $user->is_family_head;
        } else {
            // Secondary family - check user_families table
            $userFamily = \App\Models\UserFamily::where('user_id', $user->id)
                ->where('family_id', $targetFamilyId)
                ->where('is_family_head', true)
                ->first();
            $isHeadOfTargetFamily = !!$userFamily;
        }

        if (!$targetFamilyId || !$isHeadOfTargetFamily) {
            return response()->json(['error' => 'Only family heads can access this dashboard.'], 403);
        }

        // Get family members
        $family = \App\Models\Family::find($targetFamilyId);
        if (!$family) {
            return response()->json(['error' => 'Family not found.'], 404);
        }

        // Get members based on family type
        if ($targetFamilyId === $user->family_id) {
            // Primary family - get from users table
            $familyMembers = \App\Models\User::where('family_id', $targetFamilyId)
                ->orderBy('is_family_head', 'desc')
                ->orderBy('name')
                ->get();
        } else {
            // Secondary family - get from user_families relationship
            $familyMembers = $family->users()
                ->orderBy('is_family_head', 'desc')
                ->orderBy('name')
                ->get()
                ->map(function($member) {
                    $pivot = $member->pivot;
                    return (object)[
                        'id' => $member->id,
                        'name' => $member->name,
                        'email' => $member->email,
                        'phone' => $member->phone,
                        'gender' => $member->gender,
                        'birthdate' => $member->birthdate,
                        'address' => $member->address,
                        'profile_image' => $member->profile_image,
                        'family_role' => $pivot->family_role ?? null,
                        'relationship_to_head' => $pivot->relationship_to_head ?? null,
                        'is_family_head' => $pivot->is_family_head ?? false,
                    ];
                });
        }

        return response()->json([
            'family' => $family,
            'members' => $familyMembers,
            'total_members' => $familyMembers->count(),
            'is_family_head' => true
        ]);
    }

    /**
     * Update family member profile (family head only)
     */
    public function updateFamilyMemberProfile(Request $request, $memberId)
    {
        $head = $request->user();
        $member = \App\Models\User::find($memberId);

        // Verify family head and member relationship
        if (!$head->is_family_head || !$member || $member->family_id !== $head->family_id) {
            return response()->json(['error' => 'Unauthorized to update this member.'], 403);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'gender' => 'sometimes|string|in:male,female,other',
            'birthdate' => 'sometimes|date',
            'address' => 'sometimes|string|max:500',
            'family_role' => 'sometimes|string|in:head,spouse,child,parent,sibling,other',
            'relationship_to_head' => 'sometimes|string|max:100'
        ]);

        // Prevent updating admin/staff/priest accounts
        if ($member->is_admin || $member->is_staff || $member->is_priest) {
            return response()->json(['error' => 'Cannot update admin, staff, or priest accounts.'], 403);
        }

        $member->update($request->only([
            'name', 'phone', 'gender', 'birthdate', 'address', 
            'family_role', 'relationship_to_head'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Family member profile updated successfully.',
            'member' => $member->fresh()
        ]);
    }

    /**
     * Update family information (family head only)
     */
    public function updateFamilyInfo(Request $request)
    {
        $head = $request->user();

        if (!$head->is_family_head || !$head->family_id) {
            return response()->json(['error' => 'Only family heads can update family information.'], 403);
        }

        $request->validate([
            'family_name' => 'sometimes|string|max:255',
            'address' => 'sometimes|string|max:500',
            'phone' => 'sometimes|string|max:20',
            'email' => 'sometimes|email|max:255'
        ]);

        $family = \App\Models\Family::find($head->family_id);
        $family->update($request->only([
            'family_name', 'address', 'phone', 'email'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Family information updated successfully.',
            'family' => $family->fresh()
        ]);
    }

    /**
     * Transfer family head status to another member
     */
    public function transferFamilyHead(Request $request, $newHeadId)
    {
        $currentHead = $request->user();
        $newHead = \App\Models\User::find($newHeadId);

        // Verify current head and new head relationship
        if (!$currentHead->is_family_head || !$newHead || $newHead->family_id !== $currentHead->family_id) {
            return response()->json(['error' => 'Unauthorized to transfer head status.'], 403);
        }

        // Prevent transferring to admin/staff/priest accounts
        if ($newHead->is_admin || $newHead->is_staff || $newHead->is_priest) {
            return response()->json(['error' => 'Cannot transfer head status to admin, staff, or priest accounts.'], 403);
        }

        // Transfer head status
        $currentHead->update(['is_family_head' => false, 'family_role' => 'former_head']);
        $newHead->update(['is_family_head' => true, 'family_role' => 'head']);

        return response()->json([
            'success' => true,
            'message' => 'Family head status transferred successfully.',
            'new_head' => $newHead->fresh(),
            'former_head' => $currentHead->fresh()
        ]);
    }
} 