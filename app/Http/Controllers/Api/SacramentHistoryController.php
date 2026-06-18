<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SacramentHistory;
use App\Models\UserFamily;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SacramentHistoryController extends Controller
{
    /**
     * Get user's sacrament history
     */
    public function index()
    {
        try {
            $user = Auth::user();
            $history = SacramentHistory::where('user_id', $user->id)
                ->orderBy('date', 'desc')
                ->get()
                ->map(function ($record) {
                    return [
                        'id' => $record->id,
                        'type' => $record->type,
                        'date' => $record->date->format('Y-m-d'), // Format as YYYY-MM-DD
                        'parish' => $record->parish,
                        'created_at' => $record->created_at,
                        'updated_at' => $record->updated_at,
                    ];
                });
            
            return response()->json($history);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch sacrament history',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a new sacrament record
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'type' => 'required|string|max:255',
                'date' => 'required|date',
                'parish' => 'required|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'messages' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            $sacrament = SacramentHistory::create([
                'user_id' => $user->id,
                'type' => $request->type,
                'date' => $request->date,
                'parish' => $request->parish,
            ]);

            // Format the response
            $formattedSacrament = [
                'id' => $sacrament->id,
                'type' => $sacrament->type,
                'date' => $sacrament->date->format('Y-m-d'),
                'parish' => $sacrament->parish,
                'created_at' => $sacrament->created_at,
                'updated_at' => $sacrament->updated_at,
            ];

            return response()->json($formattedSacrament, 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to create sacrament record',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a sacrament record
     */
    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'type' => 'required|string|max:255',
                'date' => 'required|date',
                'parish' => 'required|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'messages' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            $sacrament = SacramentHistory::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$sacrament) {
                return response()->json([
                    'error' => 'Sacrament record not found'
                ], 404);
            }

            $sacrament->update([
                'type' => $request->type,
                'date' => $request->date,
                'parish' => $request->parish,
            ]);

            // Format the response
            $formattedSacrament = [
                'id' => $sacrament->id,
                'type' => $sacrament->type,
                'date' => $sacrament->date->format('Y-m-d'),
                'parish' => $sacrament->parish,
                'created_at' => $sacrament->created_at,
                'updated_at' => $sacrament->updated_at,
            ];

            return response()->json($formattedSacrament);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update sacrament record',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a sacrament record
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            $sacrament = SacramentHistory::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$sacrament) {
                return response()->json([
                    'error' => 'Sacrament record not found'
                ], 404);
            }

            $sacrament->delete();

            return response()->json([
                'message' => 'Sacrament record deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to delete sacrament record',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get sacrament history for family members (Family Head only)
     */
    public function getFamilySacramentHistory(Request $request)
    {
        try {
            $user = Auth::user();
            $familyId = $request->query('family_id'); // Optional: specify which family
            
            // Determine target family
            $targetFamilyId = $familyId ?? $user->family_id;
            
            // Check if user is head of the target family
            $isHeadOfTargetFamily = false;
            if ($targetFamilyId === $user->family_id) {
                // Primary family - check is_family_head
                $isHeadOfTargetFamily = $user->is_family_head;
            } else {
                // Secondary family - check user_families table
                $userFamily = UserFamily::where('user_id', $user->id)
                    ->where('family_id', $targetFamilyId)
                    ->where('is_family_head', true)
                    ->first();
                $isHeadOfTargetFamily = !!$userFamily;
            }
            
            if (!$isHeadOfTargetFamily) {
                return response()->json([
                    'error' => 'Only family heads can access family sacrament history'
                ], 403);
            }

            // Get all family members based on family type
            if ($targetFamilyId === $user->family_id) {
                // Primary family - get from users table
                $familyMembers = \App\Models\User::where('family_id', $targetFamilyId)->get();
                $familyMemberIds = $familyMembers->pluck('id');
            } else {
                // Secondary family - get from user_families relationship
                $family = \App\Models\Family::find($targetFamilyId);
                if (!$family) {
                    return response()->json([
                        'error' => 'Family not found'
                    ], 404);
                }
                $familyMembers = $family->users()->get();
                $familyMemberIds = $familyMembers->pluck('id');
            }

            // Check if filtering by specific user_id
            $query = SacramentHistory::whereIn('user_id', $familyMemberIds);
            
            if ($request->has('user_id') && $request->user_id) {
                $requestedUserId = $request->user_id;
                // Verify the requested user is in the same family
                if ($familyMemberIds->contains($requestedUserId)) {
                    $query->where('user_id', $requestedUserId);
                } else {
                    return response()->json([
                        'error' => 'User not found in your family'
                    ], 404);
                }
            }

            // Get sacrament history for family members
            $sacramentHistory = $query
                ->with('user:id,name,email')
                ->orderBy('date', 'desc')
                ->get()
                ->map(function ($record) {
                    return [
                        'id' => $record->id,
                        'user_id' => $record->user_id,
                        'user_name' => $record->user->name,
                        'user_email' => $record->user->email,
                        'type' => $record->type,
                        'date' => $record->date->format('Y-m-d'),
                        'parish' => $record->parish,
                        'created_at' => $record->created_at,
                        'updated_at' => $record->updated_at,
                    ];
                });

            return response()->json($sacramentHistory);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch family sacrament history',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add sacrament record for family member (Family Head only)
     */
    public function addFamilyMemberSacrament(Request $request)
    {
        try {
            $user = Auth::user();
            $familyId = $request->input('family_id'); // Optional: specify which family
            
            // Determine target family
            $targetFamilyId = $familyId ?? $user->family_id;
            
            // Check if user is head of the target family
            $isHeadOfTargetFamily = false;
            if ($targetFamilyId === $user->family_id) {
                // Primary family - check is_family_head
                $isHeadOfTargetFamily = $user->is_family_head;
            } else {
                // Secondary family - check user_families table
                $userFamily = UserFamily::where('user_id', $user->id)
                    ->where('family_id', $targetFamilyId)
                    ->where('is_family_head', true)
                    ->first();
                $isHeadOfTargetFamily = !!$userFamily;
            }
            
            if (!$isHeadOfTargetFamily) {
                return response()->json([
                    'error' => 'Only family heads can add sacrament records for family members'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id',
                'type' => 'required|string|max:255',
                'date' => 'required|date',
                'parish' => 'required|string|max:255',
                'family_id' => 'nullable|exists:families,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'messages' => $validator->errors()
                ], 422);
            }

            // Verify the target user is in the target family
            $targetUser = null;
            if ($targetFamilyId === $user->family_id) {
                // Primary family - check users table
                $targetUser = \App\Models\User::where('id', $request->user_id)
                    ->where('family_id', $targetFamilyId)
                    ->first();
            } else {
                // Secondary family - check user_families relationship
                $family = \App\Models\Family::find($targetFamilyId);
                if ($family) {
                    $targetUser = $family->users()->where('users.id', $request->user_id)->first();
                }
            }

            if (!$targetUser) {
                return response()->json([
                    'error' => 'User not found in your family'
                ], 404);
            }

            $sacrament = SacramentHistory::create([
                'user_id' => $request->user_id,
                'type' => $request->type,
                'date' => $request->date,
                'parish' => $request->parish,
            ]);

            // Format the response
            $formattedSacrament = [
                'id' => $sacrament->id,
                'user_id' => $sacrament->user_id,
                'user_name' => $targetUser->name,
                'user_email' => $targetUser->email,
                'type' => $sacrament->type,
                'date' => $sacrament->date->format('Y-m-d'),
                'parish' => $sacrament->parish,
                'created_at' => $sacrament->created_at,
                'updated_at' => $sacrament->updated_at,
            ];

            return response()->json($formattedSacrament, 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to create sacrament record',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update sacrament record for family member (Family Head only)
     */
    public function updateFamilyMemberSacrament(Request $request, $id)
    {
        try {
            $user = Auth::user();
            $familyId = $request->input('family_id'); // Optional: specify which family
            
            // Determine target family - try to get from sacrament owner's family
            $sacrament = SacramentHistory::findOrFail($id);
            $sacramentOwner = \App\Models\User::find($sacrament->user_id);
            
            // Check if user is head of the sacrament owner's family
            $isHeadOfTargetFamily = false;
            $targetFamilyId = null;
            
            if ($sacramentOwner) {
                // Check primary family
                if ($sacramentOwner->family_id === $user->family_id && $user->is_family_head) {
                    $isHeadOfTargetFamily = true;
                    $targetFamilyId = $user->family_id;
                } else {
                    // Check secondary families
                    $userFamily = UserFamily::where('user_id', $user->id)
                        ->where('family_id', $sacramentOwner->family_id)
                        ->where('is_family_head', true)
                        ->first();
                    if ($userFamily) {
                        $isHeadOfTargetFamily = true;
                        $targetFamilyId = $sacramentOwner->family_id;
                    }
                }
            }
            
            if (!$isHeadOfTargetFamily) {
                return response()->json([
                    'error' => 'Only family heads can update sacrament records for family members'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'type' => 'required|string|max:255',
                'date' => 'required|date',
                'parish' => 'required|string|max:255',
                'family_id' => 'nullable|exists:families,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'messages' => $validator->errors()
                ], 422);
            }

            // Verify the sacrament belongs to a family member
            if (!$sacramentOwner) {
                return response()->json([
                    'error' => 'Sacrament record not found in your family'
                ], 404);
            }

            $sacrament->update([
                'type' => $request->type,
                'date' => $request->date,
                'parish' => $request->parish,
            ]);

            // Format the response
            $formattedSacrament = [
                'id' => $sacrament->id,
                'user_id' => $sacrament->user_id,
                'user_name' => $sacramentOwner->name,
                'user_email' => $sacramentOwner->email,
                'type' => $sacrament->type,
                'date' => $sacrament->date->format('Y-m-d'),
                'parish' => $sacrament->parish,
                'created_at' => $sacrament->created_at,
                'updated_at' => $sacrament->updated_at,
            ];

            return response()->json($formattedSacrament);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update sacrament record',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete sacrament record for family member (Family Head only)
     */
    public function deleteFamilyMemberSacrament($id)
    {
        try {
            $user = Auth::user();

            // Find the sacrament record
            $sacrament = SacramentHistory::findOrFail($id);
            $sacramentOwner = \App\Models\User::find($sacrament->user_id);
            
            // Check if user is head of the sacrament owner's family
            $isHeadOfTargetFamily = false;
            
            if ($sacramentOwner) {
                // Check primary family
                if ($sacramentOwner->family_id === $user->family_id && $user->is_family_head) {
                    $isHeadOfTargetFamily = true;
                } else {
                    // Check secondary families
                    $userFamily = UserFamily::where('user_id', $user->id)
                        ->where('family_id', $sacramentOwner->family_id)
                        ->where('is_family_head', true)
                        ->first();
                    if ($userFamily) {
                        $isHeadOfTargetFamily = true;
                    }
                }
            }
            
            if (!$isHeadOfTargetFamily) {
                return response()->json([
                    'error' => 'Only family heads can delete sacrament records for family members'
                ], 403);
            }

            // Verify the sacrament belongs to a family member
            if (!$sacramentOwner) {
                return response()->json([
                    'error' => 'Sacrament record not found in your family'
                ], 404);
            }

            $sacrament->delete();

            return response()->json([
                'message' => 'Sacrament record deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to delete sacrament record',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get sacrament history for a specific user (Admin only)
     */
    public function getUserSacramentHistory($userId)
    {
        try {
            $user = Auth::user();
            
            // Check if user is admin
            if (!$user->is_admin) {
                return response()->json([
                    'error' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            $targetUser = \App\Models\User::findOrFail($userId);
            
            $history = SacramentHistory::where('user_id', $userId)
                ->with('user:id,name,email')
                ->orderBy('date', 'desc')
                ->get()
                ->map(function ($record) {
                    return [
                        'id' => $record->id,
                        'user_id' => $record->user_id,
                        'user_name' => $record->user->name,
                        'type' => $record->type,
                        'date' => $record->date->format('Y-m-d'),
                        'parish' => $record->parish,
                        'created_at' => $record->created_at,
                        'updated_at' => $record->updated_at,
                    ];
                });
            
            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $targetUser->id,
                    'name' => $targetUser->name,
                    'email' => $targetUser->email,
                ],
                'history' => $history
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch sacrament history',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add sacrament record for a user (Admin only)
     */
    public function addUserSacrament(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Check if user is admin
            if (!$user->is_admin) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id',
                'type' => 'required|string|max:255',
                'date' => 'required|date',
                'parish' => 'required|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Validation failed',
                    'messages' => $validator->errors()
                ], 422);
            }

            $targetUser = \App\Models\User::findOrFail($request->user_id);

            $sacrament = SacramentHistory::create([
                'user_id' => $request->user_id,
                'type' => $request->type,
                'date' => $request->date,
                'parish' => $request->parish,
            ]);

            // Format the response
            $formattedSacrament = [
                'id' => $sacrament->id,
                'user_id' => $sacrament->user_id,
                'user_name' => $targetUser->name,
                'type' => $sacrament->type,
                'date' => $sacrament->date->format('Y-m-d'),
                'parish' => $sacrament->parish,
                'created_at' => $sacrament->created_at,
                'updated_at' => $sacrament->updated_at,
            ];

            return response()->json([
                'success' => true,
                'message' => 'Sacrament record added successfully',
                'data' => $formattedSacrament
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to create sacrament record',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update sacrament record for a user (Admin only)
     */
    public function updateUserSacrament(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            // Check if user is admin
            if (!$user->is_admin) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'type' => 'required|string|max:255',
                'date' => 'required|date',
                'parish' => 'required|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Validation failed',
                    'messages' => $validator->errors()
                ], 422);
            }

            $sacrament = SacramentHistory::findOrFail($id);
            $targetUser = \App\Models\User::findOrFail($sacrament->user_id);

            $sacrament->update([
                'type' => $request->type,
                'date' => $request->date,
                'parish' => $request->parish,
            ]);

            // Format the response
            $formattedSacrament = [
                'id' => $sacrament->id,
                'user_id' => $sacrament->user_id,
                'user_name' => $targetUser->name,
                'type' => $sacrament->type,
                'date' => $sacrament->date->format('Y-m-d'),
                'parish' => $sacrament->parish,
                'created_at' => $sacrament->created_at,
                'updated_at' => $sacrament->updated_at,
            ];

            return response()->json([
                'success' => true,
                'message' => 'Sacrament record updated successfully',
                'data' => $formattedSacrament
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to update sacrament record',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete sacrament record for a user (Admin only)
     */
    public function deleteUserSacrament($id)
    {
        try {
            $user = Auth::user();
            
            // Check if user is admin
            if (!$user->is_admin) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            $sacrament = SacramentHistory::findOrFail($id);
            $sacrament->delete();

            return response()->json([
                'success' => true,
                'message' => 'Sacrament record deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to delete sacrament record',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
