<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Family;
use App\Models\User;
use App\Models\UserFamily;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class FamilyController extends Controller
{
    /**
     * Get all families with their members.
     */
    public function index(): JsonResponse
    {
        try {
            $families = Family::with(['members' => function($query) {
                $query->where('is_admin', 0)
                      ->where('is_staff', 0)
                      ->where('is_priest', 0)
                      ->orderBy('is_family_head', 'desc')
                      ->orderBy('name');
            }])->orderByRaw('COALESCE(family_name, family_code, id)')->get();

            // Transform the data to include member details
            $familiesWithMembers = $families->map(function($family) {
                return [
                    'id' => $family->id,
                    'family_name' => $family->family_name,
                    'family_code' => $family->family_code,
                    'address' => $family->address,
                    'phone' => $family->phone,
                    'email' => $family->email,
                    'family_ministries' => $family->family_ministries,
                    'newsletter_subscribed' => $family->newsletter_subscribed,
                    'volunteer_family' => $family->volunteer_family,
                    'family_status' => $family->family_status,
                    'created_at' => $family->created_at,
                    'updated_at' => $family->updated_at,
                    'members' => $family->members->map(function($member) {
                        return [
                            'id' => $member->id,
                            'name' => $member->name,
                            'email' => $member->email,
                            'family_role' => $member->family_role,
                            'relationship_to_head' => $member->relationship_to_head,
                            'is_family_head' => $member->is_family_head,
                            'membership_status' => $member->membership_status,
                            'last_attendance' => $member->last_attendance,
                        ];
                    })
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $familiesWithMembers
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch families',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new family.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            
            // If admin/staff/priest is creating family, email is required to find the family head
            // If regular user is creating, they become the family head themselves
            $isAdmin = $user->is_admin || $user->is_staff || $user->is_priest;
            
            // Get selected role (default to 'head' if not provided)
            $selectedRole = $request->family_role ?? 'head';
            
            // When creating a family, the creator must be the head (required for family management)
            // However, we save their selected role for reference
            $isHead = true; // Always true for family creator
            
            if ($isAdmin) {
                // For admin/staff/priest: email is required to find the family head user
                $request->validate([
                    'family_name' => 'required|string|max:255',
                    'address' => 'nullable|string|max:500',
                    'phone' => 'nullable|string|max:20',
                    'email' => 'required|email|max:255',
                    'newsletter_subscribed' => 'boolean',
                    'volunteer_family' => 'boolean',
                ]);
                
                // Find the user by email to be the family head
                $headUser = User::where('email', $request->email)->first();
                
                if (!$headUser) {
                    return response()->json([
                        'success' => false,
                        'message' => 'User with email ' . $request->email . ' not found. Please ensure the user exists before creating the family.'
                    ], 404);
                }
                
                // Check if the head user is already part of a family
                if ($headUser->family_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'User with email ' . $request->email . ' is already part of a family. They must leave their current family first.'
                    ], 422);
                }
                
                // For admin-created families, default role to 'head'
                $selectedRole = 'head';
            } else {
                // Check if user wants to create a secondary family (for children)
                // Handle both boolean and string values (from JSON)
                $isSecondaryFamilyInput = $request->input('is_secondary_family', false);
                $isSecondaryFamily = filter_var($isSecondaryFamilyInput, FILTER_VALIDATE_BOOLEAN);
                
                if ($isSecondaryFamily) {
                    // Allow children (both sons and daughters) to create their own family group
                    // Check if user is a child in ANY family (primary or secondary/extended)
                    // Check both family_role and relationship_to_head (case-insensitive, with flexible matching)
                    
                    // User must be part of at least one family (primary or secondary)
                    $hasAnyFamily = $user->family_id || DB::table('user_families')
                        ->where('user_id', $user->id)
                        ->exists();
                    
                    if (!$hasAnyFamily) {
                        return response()->json([
                            'success' => false,
                            'message' => 'You must be part of a family first before creating your own family group.'
                        ], 422);
                    }
                    
                    // If user is already a family head, they can't create another family as a child
                    if ($user->is_family_head) {
                        return response()->json([
                            'success' => false,
                            'message' => 'You are already a family head. Family heads cannot create secondary family groups.'
                        ], 422);
                    }
                    
                    // Check if user is a child in their PRIMARY family
                    $primaryRelationshipLower = strtolower(trim($user->relationship_to_head ?? ''));
                    $primaryFamilyRoleLower = strtolower(trim($user->family_role ?? ''));
                    $isChildInPrimary = ($primaryFamilyRoleLower === 'child') || 
                                       ($primaryRelationshipLower === 'son') || 
                                       ($primaryRelationshipLower === 'daughter');
                    
                    // Also check if user is a child in ANY secondary/extended family
                    $isChildInSecondary = false;
                    $secondaryFamilyRecords = DB::table('user_families')
                        ->where('user_id', $user->id)
                        ->where('is_primary', false)
                        ->get();
                    
                    foreach ($secondaryFamilyRecords as $record) {
                        $relationship = strtolower(trim($record->relationship_to_head ?? ''));
                        $familyRole = strtolower(trim($record->family_role ?? ''));
                        
                        if ($familyRole === 'child' || $relationship === 'son' || $relationship === 'daughter') {
                            $isChildInSecondary = true;
                            break;
                        }
                    }
                    
                    // User is a child if they are a child in primary OR secondary family
                    $isChild = $isChildInPrimary || $isChildInSecondary;
                    
                    if (!$isChild) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Only children (sons or daughters) can create their own family group. Your current role: "' . ($user->family_role ?? 'None') . '", Relationship: "' . ($user->relationship_to_head ?? 'None') . '". Please ensure your family role is set to "child" or your relationship is set to "Son" or "Daughter" in any family you belong to.'
                        ], 422);
                    }
                    
                    // Check if user already has a secondary family (can only be head of one family)
                    // Use left join to catch orphaned records (where family was deleted)
                    $existingSecondaryFamilyRecords = DB::table('user_families')
                        ->leftJoin('families', 'user_families.family_id', '=', 'families.id')
                        ->where('user_families.user_id', $user->id)
                        ->where('user_families.is_family_head', true)
                        ->where('user_families.is_primary', false)
                        ->select('user_families.*', 'families.family_name', 'families.id as family_exists')
                        ->get();
                    
                    // Clean up any orphaned records (where family was deleted)
                    foreach ($existingSecondaryFamilyRecords as $record) {
                        if (!$record->family_exists) {
                            // Family was deleted but record remains - clean it up
                            DB::table('user_families')
                                ->where('id', $record->id)
                                ->delete();
                        }
                    }
                    
                    // Check again for valid secondary families
                    $validSecondaryFamily = DB::table('user_families')
                        ->join('families', 'user_families.family_id', '=', 'families.id')
                        ->where('user_families.user_id', $user->id)
                        ->where('user_families.is_family_head', true)
                        ->where('user_families.is_primary', false)
                        ->select('user_families.*', 'families.family_name', 'families.id as family_id')
                        ->first();
                    
                    if ($validSecondaryFamily) {
                        return response()->json([
                            'success' => false,
                            'message' => 'You already have a family group: "' . ($validSecondaryFamily->family_name ?? 'Family #' . $validSecondaryFamily->family_id) . '". You can only be the head of one family at a time.'
                        ], 422);
                    }
                    
                    $request->validate([
                        'family_name' => 'required|string|max:255',
                        'address' => 'nullable|string|max:500',
                        'phone' => 'nullable|string|max:20',
                        'email' => 'nullable|email|max:255',
                        'newsletter_subscribed' => 'nullable|boolean',
                        'volunteer_family' => 'nullable|boolean',
                        'relationship_to_head' => 'nullable|string|max:255',
                    ]);
                    
                    $headUser = $user;
                    $selectedRole = 'head'; // Always head for their own family
                } else {
                    // For regular users: check if they are already part of a family
                    if ($user->family_id) {
                        return response()->json([
                            'success' => false,
                            'message' => 'You are already part of a family. Only family heads can create new families or you must leave your current family first.'
                        ], 422);
                    }
                    
                    $request->validate([
                        'family_name' => 'required|string|max:255',
                        'address' => 'nullable|string|max:500',
                        'phone' => 'nullable|string|max:20',
                        'email' => 'nullable|email|max:255',
                        'family_role' => 'nullable|string|in:head,spouse,child,parent,sibling,other',
                        'relationship_to_head' => 'nullable|string|max:255',
                        'newsletter_subscribed' => 'boolean',
                        'volunteer_family' => 'boolean',
                    ]);
                    
                    // Regular user becomes the head
                    $headUser = $user;
                    // Use their selected role (already set above)
                }
            }

            // Generate unique family code
            $familyCode = 'FAM-' . strtoupper(Str::random(6));
            while (Family::where('family_code', $familyCode)->exists()) {
                $familyCode = 'FAM-' . strtoupper(Str::random(6));
            }

            // Check if this is a secondary family (sub-family)
            // Use the same variable we set earlier
            $parentFamilyId = null;
            
            if ($isSecondaryFamily && $headUser->family_id) {
                $parentFamilyId = $headUser->family_id;
            }

            // Use direct DB insert to avoid id field issues, then load the model
            $familyId = DB::table('families')->insertGetId([
                'family_name' => $request->family_name,
                'family_code' => $familyCode,
                'address' => $request->address,
                'phone' => $request->phone,
                'email' => $request->email ?? $headUser->email,
                'family_ministries' => json_encode($request->family_ministries ?? []),
                'newsletter_subscribed' => $request->newsletter_subscribed ?? true,
                'volunteer_family' => $request->volunteer_family ?? false,
                'family_status' => 'active',
                'head_user_id' => $headUser->id, // Set the head user (not admin) as family head
                'parent_family_id' => $parentFamilyId, // Link to parent family if it's a sub-family
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            // Load the family model instance
            $family = Family::find($familyId);

            if ($isSecondaryFamily) {
                // For secondary families, use many-to-many relationship
                // First, ensure the primary family relationship is preserved in user_families table
                if ($headUser->family_id) {
                    $primaryFamilyRecord = DB::table('user_families')
                        ->where('user_id', $headUser->id)
                        ->where('family_id', $headUser->family_id)
                        ->first();
                    
                    if (!$primaryFamilyRecord) {
                        // Create record for primary family to preserve relationship (Son/Daughter)
                        DB::table('user_families')->insert([
                            'user_id' => $headUser->id,
                            'family_id' => $headUser->family_id,
                            'family_role' => $headUser->family_role ?? 'child',
                            'is_family_head' => $headUser->is_family_head ?? false,
                            'is_primary' => true,
                            'relationship_to_head' => $headUser->relationship_to_head ?? null, // Preserve original relationship (Son/Daughter)
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
                
                // Add to user_families table as secondary family (is_primary = false)
                // Check if record already exists to avoid duplicates
                $existingRecord = DB::table('user_families')
                    ->where('user_id', $headUser->id)
                    ->where('family_id', $family->id)
                    ->first();
                
                if (!$existingRecord) {
                    // Use direct DB insert to avoid id field issues
                    // Set relationship_to_head to 'Father' for sons, 'Mother' for daughters in their new family
                    DB::table('user_families')->insert([
                        'user_id' => $headUser->id,
                        'family_id' => $family->id,
                        'family_role' => 'head',
                        'is_family_head' => true,
                        'is_primary' => false,
                        'relationship_to_head' => $request->relationship_to_head ?? 'Father', // Father in new family
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    // Update existing record
                    DB::table('user_families')
                        ->where('user_id', $headUser->id)
                        ->where('family_id', $family->id)
                        ->update([
                            'family_role' => 'head',
                            'is_family_head' => true,
                            'is_primary' => false,
                            'relationship_to_head' => $request->relationship_to_head ?? 'Father', // Father in new family
                            'updated_at' => now(),
                        ]);
                }
                
                // Don't update the primary family_id - keep it as is (user remains Son in original family)
            } else {
                // For primary families, update the user's record
                $headUser->update([
                    'family_id' => $family->id,
                    'is_family_head' => $isHead,
                    'family_role' => $selectedRole,
                    'relationship_to_head' => $request->relationship_to_head ?? null
                ]);
                
                // Also add to user_families table as primary family
                // Use direct DB insert to avoid id field issues
                $existingRecord = DB::table('user_families')
                    ->where('user_id', $headUser->id)
                    ->where('family_id', $family->id)
                    ->first();
                
                if (!$existingRecord) {
                    DB::table('user_families')->insert([
                        'user_id' => $headUser->id,
                        'family_id' => $family->id,
                        'family_role' => $selectedRole,
                        'is_family_head' => $isHead,
                        'is_primary' => true,
                        'relationship_to_head' => $request->relationship_to_head ?? null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    // Update existing record
                    DB::table('user_families')
                        ->where('user_id', $headUser->id)
                        ->where('family_id', $family->id)
                        ->update([
                            'family_role' => $selectedRole,
                            'is_family_head' => $isHead,
                            'is_primary' => true,
                            'relationship_to_head' => $request->relationship_to_head ?? null,
                            'updated_at' => now(),
                        ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Family created successfully',
                'data' => $family
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create family',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a family.
     */
    public function update(Request $request, Family $family): JsonResponse
    {
        try {
            $request->validate([
                'family_name' => 'required|string|max:255',
                'address' => 'nullable|string|max:500',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'newsletter_subscribed' => 'boolean',
                'volunteer_family' => 'boolean',
                'family_status' => 'in:active,inactive,transferred'
            ]);

            $family->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Family updated successfully',
                'data' => $family->fresh()
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update family',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a family.
     */
    public function destroy(Family $family): JsonResponse
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.'
                ], 401);
            }
            
            // Admins and staff can delete any family
            // Family heads can only delete their own family
            if ($user->is_admin || $user->is_staff || $user->is_priest) {
                // Admin/staff/priest can delete any family - no additional checks needed
            } else {
                // Regular users must be the family head of the specific family being deleted
                $familyId = (int) $family->id;
                
                // Check if user is head of the target family
                $isHeadOfTargetFamily = false;
                if ($familyId === (int) $user->family_id) {
                    // Primary family - check is_family_head
                    $isHeadOfTargetFamily = $user->is_family_head;
                } else {
                    // Secondary family - check user_families table
                    $userFamily = UserFamily::where('user_id', $user->id)
                        ->where('family_id', $familyId)
                        ->where('is_family_head', true)
                        ->first();
                    $isHeadOfTargetFamily = !!$userFamily;
                }
                
                if (!$isHeadOfTargetFamily) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Only the family head can delete the family.'
                    ], 403);
                }
            }

            // Get all member IDs before removing family association
            $memberIds = $family->members()->pluck('id')->toArray();

            // Delete all linked family relationships (FamilyMember records) FIRST
            // This removes all relationships where either user_id or family_member_id belongs to any member of this family
            // This ensures linked members are completely removed from the family view
            if (!empty($memberIds)) {
                // Delete relationships where deleted family members are the user_id
                $deletedLinks1 = \App\Models\FamilyMember::whereIn('user_id', $memberIds)->delete();
                
                // Delete relationships where deleted family members are the family_member_id
                $deletedLinks2 = \App\Models\FamilyMember::whereIn('family_member_id', $memberIds)->delete();
                
                $totalDeleted = $deletedLinks1 + $deletedLinks2;
                \Log::info("Deleted {$totalDeleted} linked family relationships for family {$family->id} (user_id: {$deletedLinks1}, family_member_id: {$deletedLinks2})");
            }

            // Remove family association from all primary members
            $family->members()->update([
                'family_id' => null,
                'family_role' => null,
                'relationship_to_head' => null,
                'is_family_head' => false
            ]);

            // Cancel/delete all pending family invitations related to this family's members
            if (!empty($memberIds)) {
                $cancelledInvites = \App\Models\FamilyInvitation::where(function($query) use ($memberIds) {
                    $query->whereIn('inviter_id', $memberIds)
                          ->orWhereIn('invitee_id', $memberIds);
                })->where('status', 'pending')
                  ->update(['status' => 'cancelled']);
                  
                \Log::info("Cancelled pending invitations for family {$family->id}");
            }
            
            // Also cancel/delete all accepted invitations to ensure complete cleanup
            if (!empty($memberIds)) {
                \App\Models\FamilyInvitation::where(function($query) use ($memberIds) {
                    $query->whereIn('inviter_id', $memberIds)
                          ->orWhereIn('invitee_id', $memberIds);
                })->where('status', 'accepted')
                  ->update(['status' => 'cancelled']);
            }

            $family->delete();

            return response()->json([
                'success' => true,
                'message' => 'Family deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete family',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add member to family.
     */
    public function addMember(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'family_id' => 'required|exists:families,id',
                'user_id' => 'required|exists:users,id',
                'family_role' => 'required|in:head,spouse,child,parent,sibling,other',
                'relationship_to_head' => 'nullable|string|max:100',
                'is_family_head' => 'boolean'
            ]);

            $user = User::find($request->user_id);
            
            // Only allow parishioners to be added to families
            if ($user->is_admin || $user->is_staff || $user->is_priest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin, staff, and priest accounts cannot be added to families'
                ], 422);
            }

            // If setting as family head, remove head status from other members
            if ($request->is_family_head) {
                User::where('family_id', $request->family_id)
                    ->update(['is_family_head' => false]);
            }

            $user->update([
                'family_id' => $request->family_id,
                'family_role' => $request->family_role,
                'relationship_to_head' => $request->relationship_to_head,
                'is_family_head' => $request->is_family_head ?? false
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Member added to family successfully',
                'data' => $user->fresh()
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add member to family',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove member from family.
     */
    public function removeMember(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'user_id' => 'required|exists:users,id'
            ]);

            $user = User::find($request->user_id);
            
            // Remove member from family and reset all family-related fields
            $user->update([
                'family_id' => null,
                'family_role' => null,
                'relationship_to_head' => null,
                'is_family_head' => false
            ]);
            
            // Clear any family relationship records (from invitation system)
            \App\Models\FamilyInvitation::where('invitee_id', $user->id)
                ->where('status', 'pending')
                ->update(['status' => 'cancelled']);

            return response()->json([
                'success' => true,
                'message' => 'Member removed from family successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove member from family',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all families for the authenticated user.
     */
    public function getUserFamilies(): JsonResponse
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.'
                ], 401);
            }
            
            // Get primary family (via family_id)
            $primaryFamily = null;
            if ($user->family_id) {
                $primaryFamily = Family::with(['members' => function($query) {
                    $query->where('is_admin', 0)
                          ->where('is_staff', 0)
                          ->where('is_priest', 0)
                          ->orderBy('is_family_head', 'desc')
                          ->orderBy('name');
                }])->find($user->family_id);
            }
            
            // Get secondary families (via user_families where is_primary = false)
            $secondaryFamilies = $user->secondaryFamilies()->with(['users' => function($query) {
                $query->where('is_admin', 0)
                      ->where('is_staff', 0)
                      ->where('is_priest', 0)
                      ->orderBy('is_family_head', 'desc')
                      ->orderBy('name');
            }])->get();
            
            $families = [];
            
            // Add primary family
            if ($primaryFamily) {
                // Get members from users table (where family_id matches) - these are primary family members
                $primaryMembers = $primaryFamily->members->map(function($member) {
                    return [
                        'id' => $member->id,
                        'name' => $member->name,
                        'email' => $member->email,
                        'family_role' => $member->family_role,
                        'relationship_to_head' => $member->relationship_to_head,
                        'is_family_head' => (bool) $member->is_family_head, // Cast to boolean
                        'profile_image' => $member->profile_image,
                    ];
                })->keyBy('id');
                
                // Get IDs of primary family members to exclude them from user_families query
                $primaryMemberIds = $primaryMembers->keys()->toArray();
                
                // Also get members from user_families table (invited family heads, etc.)
                // Exclude primary family members to avoid duplicates
                // This ensures invited family heads appear in the primary family's member list
                $userFamiliesMembers = DB::table('user_families')
                    ->join('users', 'user_families.user_id', '=', 'users.id')
                    ->where('user_families.family_id', $primaryFamily->id)
                    ->where('users.is_admin', 0)
                    ->where('users.is_staff', 0)
                    ->where('users.is_priest', 0)
                    ->whereNotIn('users.id', $primaryMemberIds) // Exclude primary family members to avoid duplicates
                    ->select(
                        'users.id',
                        'users.name',
                        'users.email',
                        'users.profile_image',
                        'user_families.family_role',
                        'user_families.relationship_to_head',
                        'user_families.is_family_head',
                        'user_families.is_primary'
                    )
                    ->get()
                    ->map(function($member) {
                        return [
                            'id' => $member->id,
                            'name' => $member->name,
                            'email' => $member->email,
                            'family_role' => $member->family_role,
                            'relationship_to_head' => $member->relationship_to_head,
                            'is_family_head' => (bool) $member->is_family_head, // Cast to boolean
                            'profile_image' => $member->profile_image,
                        ];
                    })->keyBy('id');
                
                // Merge both - primary members first (they have correct is_family_head from users table)
                // Then add invited members from user_families
                $allMembers = $primaryMembers->merge($userFamiliesMembers)->values();
                
                // Sort: family heads first, then by name
                $allMembers = $allMembers->sortBy(function($member) {
                    return ($member['is_family_head'] ? 0 : 1) . $member['name'];
                })->values();
                
                $families[] = [
                    'id' => $primaryFamily->id,
                    'family_name' => $primaryFamily->family_name,
                    'family_code' => $primaryFamily->family_code,
                    'address' => $primaryFamily->address,
                    'phone' => $primaryFamily->phone,
                    'email' => $primaryFamily->email,
                    'is_primary' => true,
                    'is_head' => $user->is_family_head && $user->family_id === $primaryFamily->id,
                    'parent_family_id' => $primaryFamily->parent_family_id,
                    'members' => $allMembers->toArray()
                ];
            }
            
            // Add secondary families
            foreach ($secondaryFamilies as $secondaryFamily) {
                $pivot = $secondaryFamily->pivot;
                $members = $secondaryFamily->users->map(function($member) use ($secondaryFamily) {
                    $memberPivot = $member->pivot;
                    return [
                        'id' => $member->id,
                        'name' => $member->name,
                        'email' => $member->email,
                        'family_role' => $memberPivot->family_role ?? null,
                        'relationship_to_head' => $memberPivot->relationship_to_head ?? null,
                        'is_family_head' => (bool) ($memberPivot->is_family_head ?? false), // Cast to boolean
                        'profile_image' => $member->profile_image,
                    ];
                })->toArray();
                
                // If user is head of this secondary family but not in members list, add them
                if (($pivot->is_family_head ?? false) && !collect($members)->contains('id', $user->id)) {
                    array_unshift($members, [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'family_role' => 'head',
                        'relationship_to_head' => $pivot->relationship_to_head ?? 'Father', // Use pivot relationship (Father/Mother in new family)
                        'is_family_head' => true,
                        'profile_image' => $user->profile_image,
                    ]);
                }
                
                $families[] = [
                    'id' => $secondaryFamily->id,
                    'family_name' => $secondaryFamily->family_name,
                    'family_code' => $secondaryFamily->family_code,
                    'address' => $secondaryFamily->address,
                    'phone' => $secondaryFamily->phone,
                    'email' => $secondaryFamily->email,
                    'is_primary' => false,
                    'is_head' => $pivot->is_family_head ?? false,
                    'parent_family_id' => $secondaryFamily->parent_family_id,
                    'members' => $members
                ];
            }
            
            return response()->json([
                'success' => true,
                'data' => $families
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user families',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get family statistics.
     */
    public function statistics(): JsonResponse
    {
        try {
            $totalFamilies = Family::count();
            $activeFamilies = Family::where('family_status', 'active')->count();
            $inactiveFamilies = Family::where('family_status', 'inactive')->count();
            $transferredFamilies = Family::where('family_status', 'transferred')->count();
            
            $totalMembers = User::whereNotNull('family_id')
                ->where('is_admin', 0)
                ->where('is_staff', 0)
                ->where('is_priest', 0)
                ->count();
            
            $unassignedMembers = User::whereNull('family_id')
                ->where('is_admin', 0)
                ->where('is_staff', 0)
                ->where('is_priest', 0)
                ->count();

            $averageFamilySize = $totalFamilies > 0 ? round($totalMembers / $totalFamilies, 1) : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'total_families' => $totalFamilies,
                    'active_families' => $activeFamilies,
                    'inactive_families' => $inactiveFamilies,
                    'transferred_families' => $transferredFamilies,
                    'total_members' => $totalMembers,
                    'unassigned_members' => $unassignedMembers,
                    'average_family_size' => $averageFamilySize
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch family statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}