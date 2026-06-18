<?php

namespace App\Http\Controllers;

use App\Models\CertificateRequest;
use Illuminate\Http\Request;
use App\Notifications\CertificateRequestStatusNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use App\Models\FamilyMember;
use App\Mail\CertificateRequestReadyMail;

class CertificateRequestController extends Controller
{
    // For parishioner: submit request
    public function store(Request $request)
    {
        $user = auth()->user();
        
        $validated = $request->validate([
            'firstName' => ['required', 'string', 'max:255', 'regex:/^[\p{L}\s.]+$/u'],
            'lastName' => ['required', 'string', 'max:255', 'regex:/^[\p{L}\s.]+$/u'],
            'birthdate' => 'required|date',
            'email' => 'required|email',
            'phone' => 'required|string|max:20',
            'address' => ['required', 'string', 'max:500', 'regex:/^[\p{L}0-9\s,.\-#\/()]+$/u'],
            'certificateType' => 'required|string',
            'purpose' => 'required|string',
            'dateNeeded' => 'required|date',
            'additionalInfo' => 'nullable|string',
            'recipientUserId' => 'nullable|exists:users,id', // ID of family member if requesting for someone else
        ], [
            'firstName.regex' => 'First Name may only contain letters, spaces, and periods (for middle initials). Numbers and other special characters are not allowed.',
            'lastName.regex' => 'Last Name may only contain letters, spaces, and periods. Numbers and other special characters are not allowed.',
            'address.regex' => 'Address may only contain letters, numbers, spaces, and common address characters (comma, period, hyphen, hash, slash, parentheses).',
        ]);

        // Get recipientUserId first
        $recipientUserId = $validated['recipientUserId'] ?? null;
        
        // Convert empty string to null
        if ($recipientUserId === '') {
            $recipientUserId = null;
        }

        // Check if recipient already has a pending certificate request
        // Validation is now per recipient, not per requester
        if ($recipientUserId !== null) {
            // For family members/myself: check by recipient_user_id
            $pendingRequest = CertificateRequest::where('status', 'pending')
                ->where('recipient_user_id', $recipientUserId)
                ->first();
            
            if ($pendingRequest) {
                $recipient = User::find($recipientUserId);
                $recipientName = $recipient ? $recipient->name : 'this person';
                return response()->json([
                    'error' => "There is already a pending certificate request for {$recipientName}. Please wait for it to be processed before submitting a new request.",
                    'pending_request' => [
                        'id' => $pendingRequest->id,
                        'certificate_type' => $pendingRequest->certificate_type,
                        'created_at' => $pendingRequest->created_at
                    ]
                ], 409); // 409 Conflict
            }
        } else {
            // For "Request for Others": check by first name + last name (case-insensitive)
            // Check both: pure "others" requests AND requests where recipient user's name matches
            $firstName = $validated['firstName'];
            $lastName = $validated['lastName'];
            $fullName = trim($firstName . ' ' . $lastName);
            
            // First check: pending requests with recipient_user_id IS NULL (pure "others" requests)
            $pendingRequest = CertificateRequest::where('status', 'pending')
                ->whereNull('recipient_user_id')
                ->whereRaw('LOWER(first_name) = LOWER(?)', [$firstName])
                ->whereRaw('LOWER(last_name) = LOWER(?)', [$lastName])
                ->first();
            
            // Second check: pending requests where recipient user's name matches
            // Check if a user exists with this name and has a pending request
            if (!$pendingRequest) {
                // Find users with matching name (case-insensitive)
                $matchingUsers = User::whereRaw('LOWER(name) = LOWER(?)', [$fullName])
                    ->orWhere(function($query) use ($firstName, $lastName) {
                        $query->whereRaw('LOWER(SUBSTRING_INDEX(name, " ", 1)) = LOWER(?)', [$firstName])
                              ->whereRaw('LOWER(SUBSTRING_INDEX(name, " ", -1)) = LOWER(?)', [$lastName]);
                    })
                    ->pluck('id');
                
                if ($matchingUsers->isNotEmpty()) {
                    // Check if any of these users have pending requests
                    $pendingRequest = CertificateRequest::where('status', 'pending')
                        ->whereIn('recipient_user_id', $matchingUsers->toArray())
                        ->first();
                }
            }
            
            if ($pendingRequest) {
                $recipientName = $fullName;
                return response()->json([
                    'error' => "There is already a pending certificate request for {$recipientName}. Please wait for it to be processed before submitting a new request.",
                    'pending_request' => [
                        'id' => $pendingRequest->id,
                        'certificate_type' => $pendingRequest->certificate_type,
                        'created_at' => $pendingRequest->created_at
                    ]
                ], 409); // 409 Conflict
            }
        }

        // If requesting for a family member, verify they're in the requester's family
        
        // Only validate family member requests if recipientUserId is provided
        // If recipientUserId is null, it's either "for myself" or "for others" - both are allowed
        if ($recipientUserId !== null && $user) {
            // Check if recipient is in the requester's family (either same family_id or linked via FamilyMember)
            $recipient = User::find($recipientUserId);
            if ($recipient) {
                $isInFamily = false;
                
                // Check same family_id
                if ($user->family_id && $recipient->family_id === $user->family_id) {
                    $isInFamily = true;
                }
                
                // Check linked via FamilyMember relationships
                if (!$isInFamily) {
                    $isLinked = FamilyMember::where(function($query) use ($user, $recipient) {
                        $query->where('user_id', $user->id)
                              ->where('family_member_id', $recipient->id);
                    })->orWhere(function($query) use ($user, $recipient) {
                        $query->where('user_id', $recipient->id)
                              ->where('family_member_id', $user->id);
                    })->exists();
                    
                    if ($isLinked) {
                        $isInFamily = true;
                    }
                }
                
                // Any family member can request for other family members
                // Only check if recipient is in the same family
                if (!$isInFamily) {
                    return response()->json([
                        'error' => 'The selected family member is not in your family group.'
                    ], 403);
                }
            }
        }
        
        // Allow "for myself" and "for others" requests when recipientUserId is null
        // No additional validation needed - any logged-in user can request for themselves or others

        // Use direct DB insert to avoid id field issues
        $certId = \DB::table('certificate_requests')->insertGetId([
            'first_name' => $validated['firstName'],
            'last_name' => $validated['lastName'],
            'birthdate' => $validated['birthdate'],
            'email' => $validated['email'], // Requester's email for contact
            'phone' => $validated['phone'], // Requester's phone for contact
            'address' => $validated['address'],
            'certificate_type' => $validated['certificateType'],
            'purpose' => $validated['purpose'],
            'date_needed' => $validated['dateNeeded'],
            'additional_info' => $validated['additionalInfo'] ?? null,
            'requester_id' => $user ? $user->id : null,
            'recipient_user_id' => $recipientUserId,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Get the created record
        $cert = CertificateRequest::find($certId);

        return response()->json($cert, 201);
    }

    // Check if user has pending request (public endpoint)
    public function checkPending(Request $request)
    {
        $user = auth()->user();
        $email = $request->input('email');
        
        $pendingQuery = CertificateRequest::where('status', 'pending');
        
        if ($user) {
            // If logged in, check by requester_id
            $pendingQuery->where('requester_id', $user->id);
        } elseif ($email) {
            // If not logged in, check by email
            $pendingQuery->where('email', $email);
        } else {
            return response()->json(['has_pending' => false]);
        }
        
        $pendingRequest = $pendingQuery->first();
        
        return response()->json([
            'has_pending' => $pendingRequest !== null,
            'pending_request' => $pendingRequest ? [
                'id' => $pendingRequest->id,
                'certificate_type' => $pendingRequest->certificate_type,
                'created_at' => $pendingRequest->created_at,
                'status' => $pendingRequest->status
            ] : null
        ]);
    }

    // Check if recipient has pending request by user ID
    public function checkPendingByRecipient($recipientUserId)
    {
        $pendingRequest = CertificateRequest::where('status', 'pending')
            ->where('recipient_user_id', $recipientUserId)
            ->first();
        
        return response()->json([
            'has_pending' => $pendingRequest !== null,
            'pending_request' => $pendingRequest ? [
                'id' => $pendingRequest->id,
                'certificate_type' => $pendingRequest->certificate_type,
                'created_at' => $pendingRequest->created_at,
                'status' => $pendingRequest->status
            ] : null
        ]);
    }

    // Check if recipient has pending request by name (for "Request for Others")
    public function checkPendingByName(Request $request)
    {
        $firstName = $request->input('firstName');
        $lastName = $request->input('lastName');
        
        if (!$firstName || !$lastName) {
            return response()->json(['has_pending' => false]);
        }
        
        $fullName = trim($firstName . ' ' . $lastName);
        
        // First check: pending requests with recipient_user_id IS NULL (pure "others" requests)
        $pendingRequest = CertificateRequest::where('status', 'pending')
            ->whereNull('recipient_user_id')
            ->whereRaw('LOWER(first_name) = LOWER(?)', [$firstName])
            ->whereRaw('LOWER(last_name) = LOWER(?)', [$lastName])
            ->first();
        
        // Second check: pending requests where recipient user's name matches
        // Check if a user exists with this name and has a pending request
        if (!$pendingRequest) {
            // Find users with matching name (case-insensitive)
            $matchingUsers = User::whereRaw('LOWER(name) = LOWER(?)', [$fullName])
                ->orWhere(function($query) use ($firstName, $lastName) {
                    $query->whereRaw('LOWER(SUBSTRING_INDEX(name, " ", 1)) = LOWER(?)', [$firstName])
                          ->whereRaw('LOWER(SUBSTRING_INDEX(name, " ", -1)) = LOWER(?)', [$lastName]);
                })
                ->pluck('id');
            
            if ($matchingUsers->isNotEmpty()) {
                // Check if any of these users have pending requests
                $pendingRequest = CertificateRequest::where('status', 'pending')
                    ->whereIn('recipient_user_id', $matchingUsers->toArray())
                    ->first();
            }
        }
        
        return response()->json([
            'has_pending' => $pendingRequest !== null,
            'pending_request' => $pendingRequest ? [
                'id' => $pendingRequest->id,
                'certificate_type' => $pendingRequest->certificate_type,
                'created_at' => $pendingRequest->created_at,
                'status' => $pendingRequest->status,
                'first_name' => $pendingRequest->first_name,
                'last_name' => $pendingRequest->last_name
            ] : null
        ]);
    }

    // Get all pending requests for multiple recipients (for family members check)
    public function checkPendingForRecipients(Request $request)
    {
        $recipientUserIds = $request->input('recipient_user_ids', []);
        
        if (empty($recipientUserIds) || !is_array($recipientUserIds)) {
            return response()->json(['pending_recipients' => []]);
        }
        
        $pendingRequests = CertificateRequest::where('status', 'pending')
            ->whereIn('recipient_user_id', $recipientUserIds)
            ->get();
        
        $pendingRecipients = $pendingRequests->pluck('recipient_user_id')->unique()->toArray();
        
        return response()->json([
            'pending_recipients' => $pendingRecipients
        ]);
    }

    // For staff: list all requests
    public function index()
    {
        return CertificateRequest::with(['requester', 'recipient'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    // For staff: update status
    public function update(Request $request, $id)
    {
        $cert = CertificateRequest::findOrFail($id);
        $cert->status = $request->input('status');
        
        // Handle rejection reason
        if ($request->has('rejection_reason')) {
            $cert->rejection_reason = $request->input('rejection_reason');
        }
        
        $cert->save();

        // Send notification if status is approved or rejected
        if (in_array($cert->status, ['approved', 'rejected'])) {
            // Email notification
            Notification::route('mail', $cert->email)
                ->notify(new CertificateRequestStatusNotification($cert, $cert->status));
            // In-app notification if user exists
            $user = User::where('email', $cert->email)->first();
            if ($user) {
                $user->notify(new CertificateRequestStatusNotification($cert, $cert->status));
            }
        }

        return response()->json($cert);
    }

    // For staff: release certificate (send ready for pickup email)
    public function release($id)
    {
        $cert = CertificateRequest::findOrFail($id);
        
        // Send email notification that certificate is ready for pickup
        try {
            Mail::to($cert->email)->send(new CertificateRequestReadyMail($cert));
            
            // Optionally update status to 'completed' or keep current status
            // Uncomment the line below if you want to mark it as completed when released
            // $cert->status = 'completed';
            // $cert->save();
            
            return response()->json([
                'message' => 'Certificate ready notification sent successfully',
                'certificate' => $cert
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send notification: ' . $e->getMessage()
            ], 500);
        }
    }

    // For staff: delete certificate request
    public function destroy($id)
    {
        try {
            $cert = CertificateRequest::findOrFail($id);
            $cert->delete();
            
            return response()->json([
                'message' => 'Certificate request deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete certificate request: ' . $e->getMessage()
            ], 500);
        }
    }
} 