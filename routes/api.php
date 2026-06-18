<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Models\User;

// Controllers
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\OtpVerificationController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\PrayerRequestController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\MinistryApplicantController;
use App\Http\Controllers\Admin\MinistryApplicantController as AdminMinistryApplicantController;
use App\Http\Controllers\ServerTypeController;
use App\Http\Controllers\Admin\ServerTypeController as AdminServerTypeController;
use App\Http\Controllers\NewsController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\CertificateRequestController;
use App\Http\Controllers\FamilyInvitationController;
use App\Http\Controllers\ShrineRectorController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\MassScheduleController;
use App\Http\Controllers\DonationPurposeController;
use App\Http\Controllers\Admin\DonationPurposeController as AdminDonationPurposeController;
use App\Http\Controllers\PriestCalendarController;
use App\Http\Controllers\Api\MortuaryController;
use App\Http\Controllers\Api\GuestVisitController;
use App\Http\Controllers\Api\MinistryController;
use App\Http\Controllers\CertificateGenerationController;

// Public Routes
Route::get('/search', [\App\Http\Controllers\SearchController::class, 'search']);
Route::post('/contact/send', [\App\Http\Controllers\ContactController::class, 'sendMessage']);
Route::get('/users', fn () => User::where('is_admin', false)->where('is_staff', false)->where('is_priest', false)->get());
Route::get('/all-users', function () {
    $users = User::with(['family', 'familyRelationship', 'familyMemberRelationship'])->get();
    
    // Get last online time from sessions table for each user
    $users = $users->map(function ($user) {
        // Clean up family data: if user has no family_id, clear family_role, is_family_head, and family relationship
        if (!$user->family_id) {
            // If family_id is null but family_role or is_family_head is set, clear them
            if ($user->family_role || $user->is_family_head) {
                $user->family_role = null;
                $user->is_family_head = false;
                // Optionally save to database (uncomment if you want to auto-clean)
                // $user->save();
            }
            // Explicitly set family relationship to null when family_id is null
            $user->setRelation('family', null);
        }
        
        // Get the most recent session activity for this user
        $latestSession = \DB::table('sessions')
            ->where('user_id', $user->id)
            ->orderBy('last_activity', 'desc')
            ->first();
        
        // Use the most recent activity: last_login_at, session last_activity, or created_at
        $lastOnline = null;
        
        if ($user->last_login_at) {
            $lastOnline = \Carbon\Carbon::parse($user->last_login_at);
        }
        
        if ($latestSession && $latestSession->last_activity) {
            $sessionTime = \Carbon\Carbon::createFromTimestamp($latestSession->last_activity);
            if (!$lastOnline || $sessionTime->gt($lastOnline)) {
                $lastOnline = $sessionTime;
            }
        }
        
        // Set last_login_at for display (use the most recent activity)
        if ($lastOnline) {
            $user->setAttribute('last_login_at', $lastOnline->format('Y-m-d H:i:s'));
        }
        
        return $user;
    });
    
    return $users;
});
Route::get('/announcements', [AnnouncementController::class, 'index']);
Route::get('/approved-prayer-requests', [PrayerRequestController::class, 'getApproved']);
Route::get('/server-types', [ServerTypeController::class, 'index']);
Route::get('/news', [NewsController::class, 'index']);
Route::get('/news/{id}', [NewsController::class, 'show']);
Route::post('/news', [NewsController::class, 'store']);
Route::put('/news/{id}', [NewsController::class, 'update']);
Route::delete('/news/{id}', [NewsController::class, 'destroy']);
Route::post('/register', [RegisterController::class, 'register']);
Route::post('/otp/verify', [OtpVerificationController::class, 'verify']);
Route::post('/otp/resend', [OtpVerificationController::class, 'resend']);
Route::post('/ministry-applicants', [MinistryApplicantController::class, 'store']);
Route::get('/donation-purposes', [DonationPurposeController::class, 'index']);

// Certificate Requests (Public - no auth required)
Route::post('/certificate-requests', [CertificateRequestController::class, 'store']);
Route::get('/certificate-requests/check-pending', [CertificateRequestController::class, 'checkPending']);
Route::get('/certificate-requests/check-pending-by-recipient/{recipientUserId}', [CertificateRequestController::class, 'checkPendingByRecipient']);
Route::post('/certificate-requests/check-pending-by-name', [CertificateRequestController::class, 'checkPendingByName']);
Route::post('/certificate-requests/check-pending-for-recipients', [CertificateRequestController::class, 'checkPendingForRecipients']);

// Certificate Validation (Public - no auth required)
Route::get('/certificate-validation/{referenceNumber}', [CertificateGenerationController::class, 'validateCertificate']);

// Check if full name exists (used by frontend register.jsx)
Route::post('/check-name', [\App\Http\Controllers\Api\UserCheckController::class, 'checkName']);

// Public Gallery - Albums can be viewed by anyone
Route::get('/admin/albums', [\App\Http\Controllers\Admin\AlbumController::class, 'index']);

// Public Donation Pictures - Enabled pictures can be viewed by anyone
Route::get('/donation-pictures', function() {
    $pictures = \App\Models\DonationPicture::where('enabled', true)->orderBy('created_at', 'desc')->get();
    
    // Process image paths to ensure correct format
    $pictures->transform(function ($picture) {
        if ($picture->image_path && !str_starts_with($picture->image_path, 'http')) {
            $relativePath = null;
            
            // Convert old format (/storage/path) or relative paths
            if (str_starts_with($picture->image_path, '/storage/')) {
                $relativePath = str_replace('/storage/', '', $picture->image_path);
            } else {
                $relativePath = $picture->image_path;
            }
            
            // Check if file exists and normalize path
            if ($relativePath && \Illuminate\Support\Facades\Storage::disk('public')->exists($relativePath)) {
                // Ensure path is in correct format (/storage/...)
                $picture->image_path = '/storage/' . $relativePath;
            } else {
                // File doesn't exist, keep original path but it may not work
                if (!str_starts_with($picture->image_path, '/storage/')) {
                    $picture->image_path = '/storage/' . $relativePath;
                }
            }
        }
        return $picture;
    });
    
    return response()->json($pictures);
});

// Public GCash Account Settings - Enabled accounts can be viewed by anyone
Route::get('/gcash-accounts', function() {
    $accounts = \App\Models\GCashAccountSetting::where('enabled', true)->orderBy('created_at', 'desc')->get();
    return response()->json($accounts);
});

// Public Events - Events can be viewed by anyone
Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{event}', [EventController::class, 'show']);
Route::get('/calendar-events', [EventController::class, 'getCalendarEvents']);

// Public Ministries - Ministries can be viewed by anyone
Route::get('/ministries', [MinistryController::class, 'index']);
Route::get('/ministries/{id}', [MinistryController::class, 'show']);

// Event Registration (Public - no auth required)
Route::post('/events/{event}/join', [EventController::class, 'joinEvent']);

// Event Archive Management (Admin only - requires authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/events/{id}/restore', [EventController::class, 'restore']);
    Route::delete('/events/{id}/force-delete', [EventController::class, 'forceDelete']);
});

// Guest Visit / Cookie Consent (Public log endpoint)
Route::post('/guest-visits', [GuestVisitController::class, 'store']);
Route::put('/guest-visits/{id}', [GuestVisitController::class, 'updateVisit']);
Route::post('/guest-visits/track-page', [GuestVisitController::class, 'trackPageView']);

// Analytics Routes (Public - for tracking event registrations)
Route::post('/analytics/event-registration', function (Request $request) {
    try {
        // Store analytics data in database or log file
        \Log::info('Event Registration Analytics', [
            'event_id' => $request->event_id,
            'event_title' => $request->event_title,
            'registration_date' => $request->registration_date,
            'participant_data' => $request->participant_data,
            'timestamp' => now()
        ]);
        
        return response()->json(['success' => true, 'message' => 'Analytics data recorded']);
    } catch (\Exception $e) {
        \Log::error('Analytics Error: ' . $e->getMessage());
        return response()->json(['success' => false, 'message' => 'Failed to record analytics'], 500);
    }
});

// Analytics data retrieval (Public for staff dashboard)
Route::get('/analytics/event-registrations', function (Request $request) {
    try {
        // Get event filter from query parameter
        $eventId = $request->query('event_id');

        // Get actual event registration data from database
        $totalRegistrationsQuery = \App\Models\EventRegistration::query();
        if ($eventId && $eventId !== 'all') {
            $totalRegistrationsQuery->where('event_id', $eventId);
        }
        $totalRegistrations = $totalRegistrationsQuery->count();

        $activeEvents = \App\Models\Event::where('date', '>=', now())->count();

        $totalParticipantsQuery = \App\Models\EventRegistration::where('status', 'approved');
        if ($eventId && $eventId !== 'all') {
            $totalParticipantsQuery->where('event_id', $eventId);
        }
        $totalParticipants = $totalParticipantsQuery->count();

        // Get monthly registrations (only months with actual registrations)
        $dateExpression = 'COALESCE(events.date, event_registrations.registered_at, event_registrations.created_at)';

        $monthlyQuery = \App\Models\EventRegistration::selectRaw("
                YEAR($dateExpression) as year,
                MONTH($dateExpression) as month_num,
                COUNT(*) as count
            ")
            ->leftJoin('events', 'event_registrations.event_id', '=', 'events.id')
            ->where('event_registrations.status', 'approved')
            ->where(function ($query) {
                $query->whereNotNull('events.date')
                    ->orWhereNotNull('event_registrations.registered_at')
                    ->orWhereNotNull('event_registrations.created_at');
            });

        if ($eventId && $eventId !== 'all') {
            $monthlyQuery->where('event_registrations.event_id', $eventId);
        }

        $monthlyRegistrations = $monthlyQuery
            ->groupBy('year', 'month_num')
            ->orderBy('year', 'desc')
            ->orderBy('month_num', 'desc')
            ->get()
            ->map(function ($item) {
                $date = \Carbon\Carbon::create($item->year, $item->month_num, 1);
                return [
                    'month' => $date->format('M Y'),
                    'label' => $date->format('M'),
                    'year' => (int) $item->year,
                    'month_number' => (int) $item->month_num,
                    'count' => $item->count
                ];
            })
            ->toArray();

        // Get event popularity (events with most registrations)
        // Count only approved registrations to match user expectations
        $eventPopularityQuery = \App\Models\Event::withCount(['registrations' => function($query) {
            $query->where('status', 'approved');
        }]);
        if ($eventId && $eventId !== 'all') {
            $eventPopularityQuery->where('id', $eventId);
        }
        $eventPopularity = $eventPopularityQuery
            ->orderBy('registrations_count', 'desc')
            ->take(4)
            ->get()
            ->map(function ($event, $index) {
                $totalRegs = \App\Models\EventRegistration::count();
                $percentage = $totalRegs > 0 ? round(($event->registrations_count / $totalRegs) * 100) : 0;

                return [
                    'event' => $event->title,
                    'registrations' => $event->registrations_count,
                    'percentage' => $percentage
                ];
            });

        // Get recent registrations (last 10)
        // Include registrations from archived events
        // Show only approved registrations to match the graph count
        $recentQuery = \App\Models\EventRegistration::with(['event' => function($query) {
                $query->withTrashed(); // Include archived events in the relationship
            }])
            ->where('status', 'approved'); // Only show approved registrations to match graph

        if ($eventId && $eventId !== 'all') {
            $recentQuery->where('event_id', $eventId);
        }

        $recentRegistrations = $recentQuery
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($registration) {
                return [
                    'date' => $registration->created_at->toDateString(),
                    'event' => $registration->event->title ?? 'Unknown Event (Archived)',
                    'participant' => $registration->first_name . ' ' . $registration->last_name,
                    'email' => $registration->email
                ];
            });

        // Get registration trends by day of week (last 30 days)
        $registrationTrends = [];
        $days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        foreach ($days as $index => $day) {
            $dayNumber = $index + 1; // Monday = 1, Sunday = 7
            $trendQuery = \App\Models\EventRegistration::where('created_at', '>=', now()->subDays(30))
                ->whereRaw('DAYOFWEEK(created_at) = ?', [$dayNumber]);

            if ($eventId && $eventId !== 'all') {
                $trendQuery->where('event_id', $eventId);
            }

            $count = $trendQuery->count();

            $registrationTrends[] = [
                'day' => $day,
                'count' => $count
            ];
        }

        return response()->json([
            'totalRegistrations' => $totalRegistrations,
            'activeEvents' => $activeEvents,
            'totalParticipants' => $totalParticipants,
            'monthlyRegistrations' => $monthlyRegistrations,
            'eventPopularity' => $eventPopularity,
            'recentRegistrations' => $recentRegistrations,
            'registrationTrends' => $registrationTrends
        ]);
    } catch (\Exception $e) {
        \Log::error('Analytics Retrieval Error: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to retrieve analytics data'], 500);
    }
});

// Special route for UserStatusChecker - bypass status check to allow detection
Route::middleware('auth:sanctum')->get('/me', [UserController::class, 'me']);

// Sanctum Authenticated Routes
Route::middleware(['auth:sanctum', 'check.user.status'])->group(function () {
    // Chat - Requires authentication
    Route::post('/chat', [ChatController::class, 'chat']);
    
    // User
    Route::get('/user', fn (Request $request) => $request->user());
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Profile
    Route::post('/update-profile', function (Request $request) {
        $user = $request->user();
        $user->update($request->only('name', 'phone', 'gender', 'birthdate', 'address'));
        if ($request->hasFile('profile_image')) {
            $file = $request->file('profile_image');
            $path = $file->store('profile_images', 'public');
            
            // Ensure the file is accessible by copying it to public directory
            $storagePath = storage_path('app/public/' . $path);
            $publicPath = public_path('storage/' . $path);
            
            // Create directory if it doesn't exist
            $publicDir = dirname($publicPath);
            if (!file_exists($publicDir)) {
                mkdir($publicDir, 0755, true);
            }
            
            // Copy file to public directory
            if (file_exists($storagePath)) {
                copy($storagePath, $publicPath);
            }
            
            $user->profile_image = '/storage/' . $path;
        }
        $user->save();
        return response()->json(['user' => $user, 'message' => 'Profile updated successfully']);
    });

    Route::post('/change-password', function (Request $request) {
        $user = $request->user();
        if (!\Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Incorrect current password.'], 422);
        }
        
        // Validate new password with password history check
        $request->validate([
            'new_password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                function ($attribute, $value, $fail) use ($user) {
                    // Check if the new password has been used before
                    if (\App\Models\PasswordHistory::hasUsedPassword($user->id, $value)) {
                        $fail('The new password cannot be the same as a previously used password.');
                    }
                }
            ]
        ]);
        
        // Store current password in history before updating
        \App\Models\PasswordHistory::storePassword($user->id, $request->current_password);
        
        // Update user's password
        $user->password = bcrypt($request->new_password);
        $user->save();
        
        // Store the new password in history
        \App\Models\PasswordHistory::storePassword($user->id, $request->new_password);
        
        // Clean up old password history (keep only last 5 passwords)
        \App\Models\PasswordHistory::cleanupOldPasswords($user->id, 5);

        // Send email notification about the password change
        try {
            if (!empty($user->email)) {
                \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\PasswordChangedMail($user->name ?? 'User'));
            }
        } catch (\Exception $e) {
            \Log::warning('Password changed mail failed to send: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Password changed successfully.']);
    });

    // Prayer Requests
    Route::get('/prayer-requests', [PrayerRequestController::class, 'index']);
    Route::post('/prayer-requests/{id}/status', [PrayerRequestController::class, 'updateStatus']);
    Route::post('/prayer-requests/{id}/mark-as-read', [PrayerRequestController::class, 'markAsRead']);
    Route::get('/prayer-requests/pending-count', [PrayerRequestController::class, 'pendingCount']);
    Route::delete('/prayer-requests/{id}', [PrayerRequestController::class, 'destroy']);
    Route::post('/prayer-request', [PrayerRequestController::class, 'store']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/mark-as-read', [NotificationController::class, 'markAllAsRead']);

    // Admin - Announcements
    Route::post('/announcements', [AnnouncementController::class, 'store']);
    Route::put('/announcements/{id}', [AnnouncementController::class, 'update']);
    Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy']);

    // Admin - Gallery (excluding index which is public)
    Route::prefix('admin')->group(function () {
        Route::apiResource('albums', \App\Http\Controllers\Admin\AlbumController::class)->except(['index']);
        Route::post('/albums/{album}/images', [\App\Http\Controllers\Admin\AlbumController::class, 'uploadImages']);
        Route::put('/albums/images/{image}', [\App\Http\Controllers\Admin\AlbumController::class, 'updateImage']);
        Route::delete('/albums/{album}/images/{image}', [\App\Http\Controllers\Admin\AlbumController::class, 'deleteImage']);
    });

    // Admin - Ministry Applicants
    Route::prefix('admin')->group(function () {
        Route::get('/ministry-applicants', [AdminMinistryApplicantController::class, 'index']);
        Route::patch('/ministry-applicants/{id}', [AdminMinistryApplicantController::class, 'update']);
        Route::get('/ministry-applicants-pending-count', [AdminMinistryApplicantController::class, 'pendingCount']);
        Route::get('/ministry-applicants/{id}', [AdminMinistryApplicantController::class, 'show']);
        Route::delete('/ministry-applicants/{id}', [AdminMinistryApplicantController::class, 'destroy']);
    });

    // Admin - Server Types
    Route::prefix('admin')->group(function () {
        Route::get('/server-types', [AdminServerTypeController::class, 'index']);
        Route::patch('/server-types/{id}', [AdminServerTypeController::class, 'update']);
        Route::post('/server-types', [AdminServerTypeController::class, 'store']);
        Route::delete('/server-types/{id}', [AdminServerTypeController::class, 'destroy']);
    });

    // Admin - Membership Management
    Route::prefix('admin')->middleware('admin')->group(function () {
            Route::get('/membership/statistics', [\App\Http\Controllers\Api\MembershipController::class, 'statistics']);

            // Family management routes
            Route::get('/families/statistics', [\App\Http\Controllers\Api\FamilyController::class, 'statistics']);
            Route::post('/families/add-member', [\App\Http\Controllers\Api\FamilyController::class, 'addMember']);
            Route::post('/families/remove-member', [\App\Http\Controllers\Api\FamilyController::class, 'removeMember']);
            Route::apiResource('families', \App\Http\Controllers\Api\FamilyController::class);

            // Admin Sacrament History Management
            Route::get('/sacrament-history/user/{userId}', [\App\Http\Controllers\Api\SacramentHistoryController::class, 'getUserSacramentHistory']);
            Route::post('/sacrament-history', [\App\Http\Controllers\Api\SacramentHistoryController::class, 'addUserSacrament']);
            Route::put('/sacrament-history/{id}', [\App\Http\Controllers\Api\SacramentHistoryController::class, 'updateUserSacrament']);
            Route::delete('/sacrament-history/{id}', [\App\Http\Controllers\Api\SacramentHistoryController::class, 'deleteUserSacrament']);

            // Analytics routes
            Route::get('/analytics/dashboard', [\App\Http\Controllers\Api\AnalyticsController::class, 'dashboard']);
            Route::get('/analytics/event-registrations', [\App\Http\Controllers\Api\AnalyticsController::class, 'eventRegistrations']);
            Route::get('/analytics/recent-event-registrations', [\App\Http\Controllers\Api\AnalyticsController::class, 'recentEventRegistrations']);
            Route::get('/analytics/events-filter', [\App\Http\Controllers\Api\AnalyticsController::class, 'getEventsForFiltering']);
            Route::get('/analytics/parishioners/attendance-monthly', [\App\Http\Controllers\Api\AnalyticsController::class, 'parishionerAttendanceMonthly']);
            Route::get('/analytics/parishioners/activity-involvement', [\App\Http\Controllers\Api\AnalyticsController::class, 'activityInvolvement']);
            Route::get('/analytics/families', [\App\Http\Controllers\Api\AnalyticsController::class, 'familyAnalytics']);
            
            // Recent Activities route
            Route::get('/recent-activities', [\App\Http\Controllers\Api\RecentActivitiesController::class, 'index']);
        });

    // Admin - Donation Purposes
    Route::prefix('admin')->group(function () {
        Route::get('/donation-purposes', [AdminDonationPurposeController::class, 'index']);
        Route::post('/donation-purposes', [AdminDonationPurposeController::class, 'store']);
        Route::patch('/donation-purposes/{id}', [AdminDonationPurposeController::class, 'update']);
        Route::delete('/donation-purposes/{id}', [AdminDonationPurposeController::class, 'destroy']);
        Route::post('/donation-purposes/{id}/restore', [AdminDonationPurposeController::class, 'restore']);
    });

    // Admin - Donation Pictures (moved to session auth group)


    // Admin - Guest Visits (admin only)
    Route::prefix('admin')->middleware(\App\Http\Middleware\AdminMiddleware::class)->group(function () {
        Route::get('/guest-visits', [GuestVisitController::class, 'index']);
    });

    // Events (API Resource - excluding index and show which are public)
    Route::apiResource('events', EventController::class)->except(['index', 'show']);
    Route::apiResource('ministries', MinistryController::class)->except(['index', 'show']);
    // POST route for FormData updates (workaround for PUT with FormData)
    Route::post('/ministries/{id}/update', [MinistryController::class, 'update']);

    // Certificates (Staff only)
    Route::get('/certificate-requests', [CertificateRequestController::class, 'index']);
    Route::patch('/certificate-requests/{id}', [CertificateRequestController::class, 'update']);
    Route::post('/certificate-requests/{id}/release', [CertificateRequestController::class, 'release']);
    Route::delete('/certificate-requests/{id}', [CertificateRequestController::class, 'destroy']);
    
    // Certificate Generation (Staff only)
    Route::middleware([\App\Http\Middleware\StaffMiddleware::class])->prefix('certificate-generation')->group(function () {
        Route::get('/data/{id}', [CertificateGenerationController::class, 'getCertificateData']);
        Route::get('/template/{type}', [CertificateGenerationController::class, 'getTemplateByType']);
        Route::post('/template', [CertificateGenerationController::class, 'saveTemplate']);
        Route::post('/generate', [CertificateGenerationController::class, 'generateCertificate']);
        Route::post('/pdf/{id}', [CertificateGenerationController::class, 'generatePDF']);
        Route::post('/print/{id}', [CertificateGenerationController::class, 'printCertificate']);
        Route::get('/releases', [CertificateGenerationController::class, 'getCertificateReleases']);
        Route::get('/releases/{id}', [CertificateGenerationController::class, 'getCertificateRelease']);
        Route::patch('/releases/{id}', [CertificateGenerationController::class, 'updateCertificateRelease']);
        Route::post('/priest-signature', [CertificateGenerationController::class, 'uploadPriestSignature']);
        Route::post('/upload-image', [CertificateGenerationController::class, 'uploadImage']);
        Route::get('/download/{id}', [CertificateGenerationController::class, 'downloadCertificate']);
    });

    // Family & Parishioners
    Route::get('/parishioners', [FamilyInvitationController::class, 'search']);
    Route::post('/family-invitations', [FamilyInvitationController::class, 'send']);
    Route::get('/family-invitations', [FamilyInvitationController::class, 'index']);
    Route::post('/family-invitations/{id}/respond', [FamilyInvitationController::class, 'respond']);
    Route::get('/family-members', [FamilyInvitationController::class, 'familyMembers']);
    Route::post('/family-members/leave', [UserController::class, 'leave']);
    Route::post('/family-members/remove-relationship', [UserController::class, 'removeRelationship']);
    Route::delete('/family-members/{id}', [UserController::class, 'removeFamilyMember']);
    Route::get('/user/family-members', [UserController::class, 'viewFamilyMembers']);
    
    // Family creation for regular users
    Route::post('/families', [\App\Http\Controllers\Api\FamilyController::class, 'store']);
    Route::delete('/families/{family}', [\App\Http\Controllers\Api\FamilyController::class, 'destroy']);
    Route::get('/user/families', [\App\Http\Controllers\Api\FamilyController::class, 'getUserFamilies']);
    
    // Family head management routes
    Route::get('/family-head/dashboard', [UserController::class, 'getFamilyHeadDashboard']);
    Route::put('/family-head/member/{id}', [UserController::class, 'updateFamilyMemberProfile']);
    Route::put('/family-head/family-info', [UserController::class, 'updateFamilyInfo']);
    Route::post('/family-head/transfer/{id}', [UserController::class, 'transferFamilyHead']);

    // Shrine Rectors
    Route::post('/shrine-rectors', [ShrineRectorController::class, 'store']);
    Route::patch('/shrine-rectors/{id}', [ShrineRectorController::class, 'update']);
    Route::delete('/shrine-rectors/{id}', [ShrineRectorController::class, 'destroy']);

    // Mass Schedules (Admin)
    Route::get('/admin/mass-schedules', [MassScheduleController::class, 'adminIndex']);
    Route::post('/mass-schedules', [MassScheduleController::class, 'store']);
    Route::patch('/mass-schedules/{massSchedule}', [MassScheduleController::class, 'update']);
    Route::delete('/mass-schedules/{massSchedule}', [MassScheduleController::class, 'destroy']);
    Route::patch('/mass-schedules/{massSchedule}/toggle-active', [MassScheduleController::class, 'toggleActive']);

    // Mass Attendance Analytics (Admin)
    Route::get('/admin/mass-attendance', [App\Http\Controllers\MassAttendanceController::class, 'index']);
    Route::get('/admin/mass-attendance/statistics', [App\Http\Controllers\MassAttendanceController::class, 'getStatistics']);
    Route::get('/admin/mass-attendance/export-pdf', [App\Http\Controllers\MassAttendanceController::class, 'exportPdf']);
    Route::patch('/admin/mass-attendance/{attendance}', [App\Http\Controllers\MassAttendanceController::class, 'update']);
    Route::delete('/admin/mass-attendance/{attendance}', [App\Http\Controllers\MassAttendanceController::class, 'destroy']);


});

Route::get('/shrine-rectors', [ShrineRectorController::class, 'index']);

// Mass Schedules (Public)
Route::get('/mass-schedules', [MassScheduleController::class, 'index']);
Route::get('/mass-schedules/{massSchedule}', [MassScheduleController::class, 'show']);

// Mass Attendance (Requires authentication)
Route::middleware('auth:sanctum')->group(function() {
    Route::post('/mass-attendance', [App\Http\Controllers\MassAttendanceController::class, 'store']);
});

// Test route for debugging authentication
Route::middleware('auth:sanctum')->get('/test-auth', function (Request $request) {
    return response()->json([
        'success' => true,
        'user' => $request->user(),
        'message' => 'Authentication is working'
    ]);
});

// Sacrament Appointment (Parishioner)
Route::middleware('auth:sanctum')->group(function() {
    Route::get('/sacrament-types', [\App\Http\Controllers\Api\SacramentAppointmentController::class, 'types']);
    Route::get('/sacrament-appointments/available-slots', [\App\Http\Controllers\Api\SacramentAppointmentController::class, 'availableSlots']);
    Route::post('/sacrament-appointments', [\App\Http\Controllers\Api\SacramentAppointmentController::class, 'book']);
    Route::get('/sacrament-appointments/my', [\App\Http\Controllers\Api\SacramentAppointmentController::class, 'myAppointments']);
    
    // Sacrament History (Parishioner)
    Route::get('/sacrament-history', [\App\Http\Controllers\Api\SacramentHistoryController::class, 'index']);
    Route::post('/sacrament-history', [\App\Http\Controllers\Api\SacramentHistoryController::class, 'store']);
    Route::put('/sacrament-history/{id}', [\App\Http\Controllers\Api\SacramentHistoryController::class, 'update']);
    Route::delete('/sacrament-history/{id}', [\App\Http\Controllers\Api\SacramentHistoryController::class, 'destroy']);
    
    // Family Sacrament History Management (Family Head only)
    Route::get('/family-sacrament-history', [\App\Http\Controllers\Api\SacramentHistoryController::class, 'getFamilySacramentHistory']);
    Route::post('/family-sacrament-history', [\App\Http\Controllers\Api\SacramentHistoryController::class, 'addFamilyMemberSacrament']);
    Route::put('/family-sacrament-history/{id}', [\App\Http\Controllers\Api\SacramentHistoryController::class, 'updateFamilyMemberSacrament']);
    Route::delete('/family-sacrament-history/{id}', [\App\Http\Controllers\Api\SacramentHistoryController::class, 'deleteFamilyMemberSacrament']);
});

// Staff Sacrament Management
Route::middleware(['auth:sanctum', \App\Http\Middleware\StaffMiddleware::class])->prefix('staff')->group(function() {
    Route::get('/sacrament-appointments', [\App\Http\Controllers\Api\StaffSacramentController::class, 'appointments']);
    Route::patch('/sacrament-appointments/{id}/approve', [\App\Http\Controllers\Api\StaffSacramentController::class, 'approve']);
    Route::patch('/sacrament-appointments/{id}/reject', [\App\Http\Controllers\Api\StaffSacramentController::class, 'reject']);

    // Time Slot Management
    Route::prefix('sacrament-time-slots')->group(function() {
        Route::get('/', [\App\Http\Controllers\Api\StaffSacramentController::class, 'slots']);
        Route::post('/', [\App\Http\Controllers\Api\StaffSacramentController::class, 'addSlot']);
        Route::post('/bulk', [\App\Http\Controllers\Api\StaffSacramentController::class, 'bulkAddSlots']);
        Route::post('/bulk-delete', [\App\Http\Controllers\Api\StaffSacramentController::class, 'bulkDeleteSlots']);
        Route::patch('/{id}', [\App\Http\Controllers\Api\StaffSacramentController::class, 'editSlot']);
        Route::patch('/{id}/enable', [\App\Http\Controllers\Api\StaffSacramentController::class, 'enableSlot']);
        Route::patch('/{id}/disable', [\App\Http\Controllers\Api\StaffSacramentController::class, 'disableSlot']);
    });

    // Sacrament Types Management
    Route::prefix('sacrament-types')->group(function() {
        Route::get('/', [\App\Http\Controllers\Api\StaffSacramentController::class, 'types']);
        Route::post('/', [\App\Http\Controllers\Api\StaffSacramentController::class, 'addType']);
        Route::patch('/{id}', [\App\Http\Controllers\Api\StaffSacramentController::class, 'editType']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\StaffSacramentController::class, 'deleteType']);
    });

    // Parish Records Management
    Route::prefix('parish-records')->group(function() {
        Route::get('/', [\App\Http\Controllers\Api\ParishRecordController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\ParishRecordController::class, 'store']);
        Route::get('/statistics', [\App\Http\Controllers\Api\ParishRecordController::class, 'statistics']);
        Route::get('/export', [\App\Http\Controllers\Api\ParishRecordController::class, 'export']);
        Route::get('/default-details/{type}', [\App\Http\Controllers\Api\ParishRecordController::class, 'getDefaultDetails']);
        Route::get('/{id}', [\App\Http\Controllers\Api\ParishRecordController::class, 'show']);
        Route::patch('/{id}', [\App\Http\Controllers\Api\ParishRecordController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\ParishRecordController::class, 'destroy']);
    });

    // Donation Pictures Management (moved back to main auth group)

    // Mortuary Management
    Route::prefix('mortuary')->group(function() {
        Route::get('/', [MortuaryController::class, 'index']);
        Route::get('/statistics', [MortuaryController::class, 'statistics']);
        Route::get('/available-positions', [MortuaryController::class, 'getAvailablePositions']);
        Route::post('/', [MortuaryController::class, 'store']);
        Route::get('/{id}', [MortuaryController::class, 'show']);
        Route::patch('/{id}', [MortuaryController::class, 'update']);
        Route::delete('/{id}', [MortuaryController::class, 'destroy']);
        Route::patch('/{id}/reset', [MortuaryController::class, 'reset']);
        Route::post('/bulk-update', [MortuaryController::class, 'bulkUpdate']);
        Route::post('/initialize', [MortuaryController::class, 'initialize']);
    });
});

// Test route for debugging
Route::get('/test-events', function () {
    return response()->json([
        'success' => true,
        'message' => 'Events API is working',
        'events_count' => \App\Models\Event::count(),
        'timestamp' => now()
    ]);
});

// Test route for admin endpoints (temporary - remove in production)
Route::get('/test-admin-families', function () {
    try {
        $controller = new \App\Http\Controllers\Api\FamilyController();
        $response = $controller->statistics();
        return $response;
    } catch (Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

// Test route for parish records
Route::get('/test-parish-records', function () {
    return response()->json([
        'success' => true,
        'message' => 'Parish Records API is working',
        'records_count' => \App\Models\ParishRecord::count(),
        'sample_records' => \App\Models\ParishRecord::take(3)->get(),
        'timestamp' => now()
    ]);
});

// Public test route for parish records controller
Route::get('/test-parish-controller', [\App\Http\Controllers\Api\ParishRecordController::class, 'index']);

// Temporary public routes for testing parish records (remove in production)
Route::prefix('public-parish-records')->group(function() {
    Route::get('/', [\App\Http\Controllers\Api\ParishRecordController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\ParishRecordController::class, 'store']);
    Route::get('/statistics', [\App\Http\Controllers\Api\ParishRecordController::class, 'statistics']);
    Route::get('/export', [\App\Http\Controllers\Api\ParishRecordController::class, 'export']);
    Route::get('/default-details/{type}', [\App\Http\Controllers\Api\ParishRecordController::class, 'getDefaultDetails']);
    Route::get('/{id}', [\App\Http\Controllers\Api\ParishRecordController::class, 'show']);
    Route::patch('/{id}', [\App\Http\Controllers\Api\ParishRecordController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\ParishRecordController::class, 'destroy']);
});

// Test available positions
Route::get('/test-available-positions', function () {
    try {
        $controller = new \App\Http\Controllers\Api\MortuaryController();
        $response = $controller->getAvailablePositions();
        
        return response()->json([
            'success' => true,
            'message' => 'Available positions test',
            'data' => $response->getData()
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Available positions test error: ' . $e->getMessage()
        ], 500);
    }
});

// Test database connection
Route::get('/test-db', function () {
    try {
        $priestCount = \App\Models\User::where('is_priest', true)->count();
        $calendarCount = \App\Models\PriestCalendar::count();
        
        return response()->json([
            'success' => true,
            'message' => 'Database connection working',
            'data' => [
                'priests_count' => $priestCount,
                'calendar_entries_count' => $calendarCount
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ], 500);
    }
});

// Test priests endpoint without auth
Route::get('/test-priests', function () {
    try {
        $priests = \App\Models\User::where('is_priest', true)->select('id', 'name', 'email')->get();
        
        return response()->json([
            'success' => true,
            'message' => 'Priests retrieved successfully',
            'data' => $priests
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error retrieving priests: ' . $e->getMessage()
        ], 500);
    }
});

// Test controller method without auth
Route::get('/test-controller', function () {
    try {
        $controller = new \App\Http\Controllers\PriestCalendarController();
        $request = new \Illuminate\Http\Request();
        $response = $controller->getPriests();
        
        return $response;
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Controller error: ' . $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

// Test priest schedule for specific priest
Route::get('/test-priest-schedule/{priestId}', function ($priestId) {
    try {
        $controller = new \App\Http\Controllers\PriestCalendarController();
        $request = new \Illuminate\Http\Request();
        
        // Add some query parameters to test date filtering
        $request->merge([
            'start_date' => '2025-08-01',
            'end_date' => '2025-08-31'
        ]);
        
        $response = $controller->getPriestSchedule($request, $priestId);
        
        return $response;
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Priest schedule error: ' . $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

// Donations (Public)
Route::get('/donations', [\App\Http\Controllers\Api\DonationController::class, 'index']);
Route::post('/donations', [\App\Http\Controllers\Api\DonationController::class, 'store']);
Route::post('/donations/physical', [\App\Http\Controllers\Api\DonationController::class, 'storePhysical']);
Route::post('/donations/{id}/verify', [\App\Http\Controllers\Api\DonationController::class, 'verify']);
Route::post('/donations/{id}/reject', [\App\Http\Controllers\Api\DonationController::class, 'reject']);
Route::delete('/donations/{id}', [\App\Http\Controllers\Api\DonationController::class, 'destroy']);
Route::get('/donations/{id}/receipt', [\App\Http\Controllers\Api\DonationController::class, 'receipt']);

// Optional: Generate/download donation receipt PDF (server-side)
Route::get('/donations/{id}/receipt-pdf', function ($id) {
    $donation = \App\Models\Donation::findOrFail($id);
    $pdf = app(\App\Services\DonationReceiptPdfService::class)->renderDonationReceipt($donation);
    return response($pdf, 200, [
        'Content-Type' => 'application/pdf',
        'Content-Disposition' => 'inline; filename="donation-receipt-'.$id.'.pdf"'
    ]);
});

// Test date saving
Route::post('/test-date-save', function (Request $request) {
    try {
        \Log::info('Test Date Save - Raw Input:', $request->all());
        
        $data = $request->validate([
            'date' => 'required|date',
            'time' => 'required'
        ]);
        
        \Log::info('Test Date Save - Validated:', $data);
        
        // Create a test entry
        $entry = \App\Models\PriestCalendar::create([
            'priest_id' => 7, // priest1
            'duty' => 'test duty',
            'date' => $data['date'],
            'time' => $data['time'],
            'notes' => 'test entry',
            'status' => 'scheduled'
        ]);
        
        \Log::info('Test Date Save - Created Entry:', $entry->toArray());
        
        // Fetch it back to see how it's stored
        $fetched = \App\Models\PriestCalendar::find($entry->id);
        \Log::info('Test Date Save - Fetched Entry:', $fetched->toArray());
        
        return response()->json([
            'success' => true,
            'message' => 'Test entry created',
            'input_data' => $data,
            'created_entry' => $entry->toArray(),
            'fetched_entry' => $fetched->toArray()
        ]);
        
    } catch (\Exception $e) {
        \Log::error('Test Date Save Error:', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return response()->json([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ], 500);
    }
});

// Test staff calendar API
Route::get('/test-staff-calendar', function () {
    try {
        $controller = new \App\Http\Controllers\PriestCalendarController();
        $request = new \Illuminate\Http\Request();
        
        $response = $controller->index($request);
        
        return $response;
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Staff calendar error: ' . $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

// Debug routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/debug/user', function (Request $request) {
        return response()->json([
            'success' => true,
            'user' => $request->user(),
            'is_staff' => $request->user()->is_staff ?? false,
            'is_priest' => $request->user()->is_priest ?? false
        ]);
    });
    
    Route::middleware('staff')->get('/debug/staff', function (Request $request) {
        return response()->json([
            'success' => true,
            'message' => 'Staff middleware working',
            'user' => $request->user()->only(['id', 'name', 'is_staff'])
        ]);
    });
});

// Priest Calendar Routes
Route::middleware(['auth:sanctum'])->group(function () {
    // Public priest calendar routes (for staff to manage)
    Route::get('/priests', [PriestCalendarController::class, 'getPriests']);
    Route::get('/priest-calendar', [PriestCalendarController::class, 'index']);
    Route::get('/priest-calendar/monthly', [PriestCalendarController::class, 'getMonthlySchedule']);
    Route::get('/priest-calendar/priest/{priestId}', [PriestCalendarController::class, 'getPriestSchedule']);
    
    // Staff/Admin only routes for managing priest calendar (temporarily without middleware for testing)
    Route::post('/priest-calendar', [PriestCalendarController::class, 'store']);
    Route::get('/priest-calendar/{id}', [PriestCalendarController::class, 'show']);
    Route::put('/priest-calendar/{id}', [PriestCalendarController::class, 'update']);
    Route::delete('/priest-calendar/{id}', [PriestCalendarController::class, 'destroy']);
    
    // Priest-only routes for viewing their own schedule (temporarily without middleware for testing)
    Route::prefix('priest')->group(function () {
        Route::get('/my-schedule', function (Request $request) {
            $priestId = $request->user()->id;
            return app(PriestCalendarController::class)->getPriestSchedule($request, $priestId);
        });
    });
});

// OPTIONS fallback for preflight
Route::options('/{any}', function () {
    return response()->json([], 200);
})->where('any', '.*');
