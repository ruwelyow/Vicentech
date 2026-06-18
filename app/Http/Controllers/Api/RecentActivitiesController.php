<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EventRegistration;
use App\Models\Donation;
use App\Models\User;
use App\Models\PrayerRequest;
use App\Models\Announcement;
use App\Models\MinistryApplicant;
use App\Models\MassAttendance;
use App\Models\CertificateRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class RecentActivitiesController extends Controller
{
    /**
     * Get recent activities for admin dashboard
     */
    public function index(): JsonResponse
    {
        try {
            $activities = [];
            
            // Recent Event Registrations (last 10)
            $recentRegistrations = EventRegistration::with('event')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function($registration) {
                    return [
                        'id' => 'event_reg_' . $registration->id,
                        'type' => 'Event Registration',
                        'detail' => $registration->first_name . ' ' . $registration->last_name . ' registered for ' . ($registration->event->title ?? 'Unknown Event'),
                        'date' => $registration->created_at->format('M d, Y H:i'),
                        'timestamp' => $registration->created_at,
                        'icon' => 'calendar',
                        'color' => '#3B82F6'
                    ];
                });
            
            // Recent Donations (last 10)
            $recentDonations = Donation::where('verified', true)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function($donation) {
                    return [
                        'id' => 'donation_' . $donation->id,
                        'type' => 'Donation',
                        'detail' => $donation->name . ' donated ₱' . number_format($donation->amount) . ' for ' . ($donation->purpose_name ?? 'General'),
                        'date' => $donation->created_at->format('M d, Y H:i'),
                        'timestamp' => $donation->created_at,
                        'icon' => 'dollar-sign',
                        'color' => '#10B981'
                    ];
                });
            
            // Recent Prayer Requests (last 10)
            $recentPrayerRequests = PrayerRequest::orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function($request) {
                    return [
                        'id' => 'prayer_' . $request->id,
                        'type' => 'Prayer Request',
                        'detail' => $request->name . ' submitted: ' . substr($request->title, 0, 50) . (strlen($request->title) > 50 ? '...' : ''),
                        'date' => $request->created_at->format('M d, Y H:i'),
                        'timestamp' => $request->created_at,
                        'icon' => 'heart',
                        'color' => '#8B5CF6'
                    ];
                });
            
            // Recent Announcements (last 10)
            $recentAnnouncements = Announcement::orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function($announcement) {
                    return [
                        'id' => 'announcement_' . $announcement->id,
                        'type' => 'Announcement',
                        'detail' => 'New announcement: ' . substr($announcement->title, 0, 50) . (strlen($announcement->title) > 50 ? '...' : ''),
                        'date' => $announcement->created_at->format('M d, Y H:i'),
                        'timestamp' => $announcement->created_at,
                        'icon' => 'megaphone',
                        'color' => '#F59E0B'
                    ];
                });
            
            // Recent Ministry Applications (last 10)
            $recentMinistryApplications = MinistryApplicant::orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function($applicant) {
                    return [
                        'id' => 'ministry_' . $applicant->id,
                        'type' => 'Ministry Application',
                        'detail' => $applicant->name . ' applied for ' . $applicant->ministry_type . ' ministry',
                        'date' => $applicant->created_at->format('M d, Y H:i'),
                        'timestamp' => $applicant->created_at,
                        'icon' => 'users',
                        'color' => '#EF4444'
                    ];
                });
            
            // Recent Mass Attendances (last 10)
            $recentMassAttendances = MassAttendance::with('massSchedule')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function($attendance) {
                    return [
                        'id' => 'mass_' . $attendance->id,
                        'type' => 'Mass Attendance',
                        'detail' => $attendance->name . ' registered for ' . ($attendance->massSchedule->type ?? 'Mass') . ' (' . $attendance->number_of_people . ' people)',
                        'date' => $attendance->created_at->format('M d, Y H:i'),
                        'timestamp' => $attendance->created_at,
                        'icon' => 'church',
                        'color' => '#CD8B3E'
                    ];
                });
            
            // Recent Certificate Requests (last 10)
            $recentCertificateRequests = CertificateRequest::orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function($request) {
                    return [
                        'id' => 'certificate_' . $request->id,
                        'type' => 'Certificate Request',
                        'detail' => $request->name . ' requested ' . $request->certificate_type . ' certificate',
                        'date' => $request->created_at->format('M d, Y H:i'),
                        'timestamp' => $request->created_at,
                        'icon' => 'award',
                        'color' => '#06B6D4'
                    ];
                });
            
            // Recent User Registrations (last 10)
            $recentUserRegistrations = User::where('is_admin', 0)
                ->where('is_staff', 0)
                ->where('is_priest', 0)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function($user) {
                    return [
                        'id' => 'user_' . $user->id,
                        'type' => 'User Registration',
                        'detail' => $user->name . ' registered as a new parishioner',
                        'date' => $user->created_at->format('M d, Y H:i'),
                        'timestamp' => $user->created_at,
                        'icon' => 'user-plus',
                        'color' => '#84CC16'
                    ];
                });
            
            // Combine all activities
            $allActivities = collect()
                ->merge($recentRegistrations)
                ->merge($recentDonations)
                ->merge($recentPrayerRequests)
                ->merge($recentAnnouncements)
                ->merge($recentMinistryApplications)
                ->merge($recentMassAttendances)
                ->merge($recentCertificateRequests)
                ->merge($recentUserRegistrations);
            
            // Sort by timestamp (most recent first) and limit to 20
            $sortedActivities = $allActivities
                ->sortByDesc('timestamp')
                ->take(20)
                ->values();
            
            return response()->json([
                'success' => true,
                'data' => $sortedActivities
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch recent activities',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
