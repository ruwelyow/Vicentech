<?php

namespace App\Http\Controllers;

use App\Models\PrayerRequest;
use App\Models\User;
use App\Notifications\PrayerRequestUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PrayerRequestController extends Controller
{
    /**
     * Store a new prayer request from a logged-in user.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'request' => 'required|string',
        ]);

        PrayerRequest::create([
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone ?? '',
            'request' => $validated['request'],
            'title' => $validated['title'],
            'status' => 'pending',
            'is_read' => false,
        ]);

        return response()->json(['message' => 'Prayer request submitted successfully.']);
    }
    
    /**
     * Get all prayer requests (for admin view).
     */
    public function index()
    {
        return PrayerRequest::orderBy('created_at', 'desc')->get();
    }

    /**
     * Get all approved prayer requests for public view.
     */
    public function getApproved()
    {
        return PrayerRequest::where('status', 'approved')
            ->orderBy('updated_at', 'desc') // Show most recently approved first
            ->get();
    }

    /**
     * Update status to approved or rejected.
     */
    public function updateStatus($id, Request $request)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'nullable|string'
        ]);

        $prayer = PrayerRequest::findOrFail($id);
        $prayer->status = $request->status;
        $prayer->is_read = true;
        
        // Handle rejection reason
        if ($request->has('rejection_reason')) {
            $prayer->rejection_reason = $request->input('rejection_reason');
        }
        
        $prayer->save();

        // Find the user who submitted the request and notify them
        $user = User::where('email', $prayer->email)->first();
        if ($user) {
            $user->notify(new PrayerRequestUpdated($prayer));
        }

        return response()->json(['message' => 'Prayer request status updated.']);
    }

    public function markAsRead($id)
    {
        $prayer = PrayerRequest::findOrFail($id);
        if (!$prayer->is_read) {
            $prayer->is_read = true;
            $prayer->save();
        }
        return response()->json(['message' => 'Prayer request marked as read.']);
    }

    /**
     * Get count of pending requests (for sidebar badge).
     */
    public function pendingCount()
    {
        $count = PrayerRequest::where('is_read', false)->count();
        return response()->json(['count' => $count]);
    }

    /**
     * Delete a prayer request by ID (admin only).
     */
    public function destroy($id)
    {
        $prayer = PrayerRequest::findOrFail($id);
        $prayer->delete();
        return response()->json(['message' => 'Prayer request deleted successfully.']);
    }
}
