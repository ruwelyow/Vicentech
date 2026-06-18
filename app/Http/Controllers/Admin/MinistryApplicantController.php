<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MinistryApplicant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use App\Notifications\MinistryApplicantStatusUpdated;
use App\Models\User;

class MinistryApplicantController extends Controller
{
    // List all applicants, with optional filtering by status
    public function index(Request $request)
    {
        $status = $request->query('status');
        $query = MinistryApplicant::query();
        if ($status && in_array($status, ['pending', 'approved', 'rejected'])) {
            $query->where('status', $status);
        }
        $applicants = $query->orderBy('created_at', 'desc')->get();
        return response()->json($applicants);
    }

    // Update status (approve/reject) and notify applicant
    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,approved,rejected',
            'rejection_reason' => 'nullable|string'
        ]);

        $applicant = MinistryApplicant::findOrFail($id);
        $applicant->status = $request->status;
        
        // Handle rejection reason
        if ($request->has('rejection_reason')) {
            $applicant->rejection_reason = $request->input('rejection_reason');
        }
        
        $applicant->save();

        // Send notification (email)
        Notification::route('mail', $applicant->email)
            ->notify(new MinistryApplicantStatusUpdated($applicant));

        // Send in-app notification if user exists
        $user = User::where('email', $applicant->email)->first();
        if ($user) {
            $user->notify(new MinistryApplicantStatusUpdated($applicant));
        }

        return response()->json($applicant);
    }

    // Show full details and mark as read
    public function show($id)
    {
        $applicant = MinistryApplicant::findOrFail($id);
        if (!$applicant->is_read) {
            $applicant->is_read = true;
            $applicant->save();
        }
        return response()->json($applicant);
    }

    // Get count of pending applicants (for badge)
    public function pendingCount()
    {
        $count = MinistryApplicant::where('status', 'pending')->where('is_read', false)->count();
        return response()->json(['pending' => $count]);
    }

    public function destroy($id)
    {
        $applicant = MinistryApplicant::find($id);
        if (!$applicant) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $applicant->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
