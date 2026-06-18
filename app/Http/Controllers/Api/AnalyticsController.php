<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Donation;
use App\Models\User;
use App\Models\Family;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    /**
     * Get event registration analytics
     */
    public function eventRegistrations(Request $request): JsonResponse
    {
        try {
            // Get event filter from query parameter (can filter by specific event or show all)
            $eventId = $request->query('event_id');
            $archivedStatus = $request->query('archived_status', 'all'); // 'active', 'archived', or 'all'
            
            // Build base query with event filter support
            $registrationQuery = EventRegistration::query();
            if ($eventId && $eventId !== 'all') {
                $registrationQuery->where('event_id', $eventId);
            } else if ($archivedStatus !== 'all') {
                // Filter by archived status when showing all events
                $eventIds = Event::withTrashed()
                    ->when($archivedStatus === 'active', function($q) {
                        $q->whereNull('deleted_at');
                    })
                    ->when($archivedStatus === 'archived', function($q) {
                        $q->whereNotNull('deleted_at');
                    })
                    ->pluck('id');
                $registrationQuery->whereIn('event_id', $eventIds);
            }
            
            // Get total registrations
            $totalRegistrations = $registrationQuery->count();
            
            // Get active events (non-archived)
            $activeEvents = Event::where('date', '>=', now())->count();
            
            // Get total participants (unique emails) - also respects event filter
            $participantQuery = EventRegistration::distinct('email');
            if ($eventId && $eventId !== 'all') {
                $participantQuery->where('event_id', $eventId);
            } else if ($archivedStatus !== 'all') {
                // Filter by archived status when showing all events
                $eventIds = Event::withTrashed()
                    ->when($archivedStatus === 'active', function($q) {
                        $q->whereNull('deleted_at');
                    })
                    ->when($archivedStatus === 'archived', function($q) {
                        $q->whereNotNull('deleted_at');
                    })
                    ->pluck('id');
                $participantQuery->whereIn('event_id', $eventIds);
            }
            $totalParticipants = $participantQuery->count('email');
            
            // Get monthly registrations for last 36 months (3 years) BY EVENT DATE
            // Include archived events in analytics
            $monthlyRegistrations = [];
            for ($i = 35; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $monthLabel = $date->format('M Y');
                $monthKey = $date->format('Y-m');

                // Get registration count by event date, not registration date
                // Include archived events by not filtering by deleted_at
                $monthlyQuery = EventRegistration::join('events', 'event_registrations.event_id', '=', 'events.id')
                    ->whereYear('events.date', $date->year)
                    ->whereMonth('events.date', $date->month)
                    ->where('event_registrations.status', 'approved');
                
                // Apply event filter
                if ($eventId && $eventId !== 'all') {
                    $monthlyQuery->where('event_registrations.event_id', $eventId);
                } else if ($archivedStatus !== 'all') {
                    // Filter by archived status when showing all events
                    $eventIds = Event::withTrashed()
                        ->when($archivedStatus === 'active', function($q) {
                            $q->whereNull('deleted_at');
                        })
                        ->when($archivedStatus === 'archived', function($q) {
                            $q->whereNotNull('deleted_at');
                        })
                        ->pluck('id');
                    $monthlyQuery->whereIn('event_registrations.event_id', $eventIds);
                }
                
                $count = $monthlyQuery->count();

                $monthlyRegistrations[] = [
                    'key' => $monthKey,
                    'month' => $monthLabel,
                    'count' => $count
                ];
            }
            
            // Calculate insights for event registrations
            $registrationInsights = $this->calculateRegistrationInsights($monthlyRegistrations);
            
            // Get event popularity (top 10 events by registrations)
            // Include archived events in analytics to preserve historical data
            // Apply event filter if specified
            // Count only approved registrations to match what users expect to see
            $eventPopularityQuery = Event::withTrashed()
                ->withCount(['registrations' => function($query) {
                    $query->where('status', 'approved');
                }]);
            
            if ($eventId && $eventId !== 'all') {
                $eventPopularityQuery->where('id', $eventId);
            } else if ($archivedStatus !== 'all') {
                // Filter by archived status when showing all events
                if ($archivedStatus === 'active') {
                    $eventPopularityQuery->whereNull('deleted_at');
                } else if ($archivedStatus === 'archived') {
                    $eventPopularityQuery->whereNotNull('deleted_at');
                }
            }
            
            $eventPopularity = $eventPopularityQuery
                ->orderBy('registrations_count', 'desc')
                ->limit(10)
                ->get()
                ->map(function($event) {
                    return [
                        'event' => $event->title,
                        'registrations' => $event->registrations_count,
                        'archived' => $event->trashed()
                    ];
                });
            
            // Get recent registrations (last 20)
            // Include registrations from archived events
            // Show only approved registrations to match the graph count
            $recentRegistrationsQuery = EventRegistration::with(['event' => function($query) {
                    $query->withTrashed(); // Include archived events in the relationship
                }])
                ->where('status', 'approved'); // Only show approved registrations to match graph
            
            // Apply event filter
            if ($eventId && $eventId !== 'all') {
                $recentRegistrationsQuery->where('event_id', $eventId);
            } else if ($archivedStatus !== 'all') {
                // Filter by archived status when showing all events
                $eventIds = Event::withTrashed()
                    ->when($archivedStatus === 'active', function($q) {
                        $q->whereNull('deleted_at');
                    })
                    ->when($archivedStatus === 'archived', function($q) {
                        $q->whereNotNull('deleted_at');
                    })
                    ->pluck('id');
                $recentRegistrationsQuery->whereIn('event_id', $eventIds);
            }
            
            $recentRegistrations = $recentRegistrationsQuery
                ->orderBy('created_at', 'desc')
                ->limit(20)
                ->get()
                ->map(function($registration) {
                    return [
                        'date' => $registration->created_at->toISOString(),
                        'event' => $registration->event->title ?? 'Unknown Event (Archived)',
                        'participant' => $registration->first_name . ' ' . $registration->last_name,
                        'email' => $registration->email,
                        'status' => ucfirst($registration->status),
                        'event_archived' => $registration->event ? $registration->event->trashed() : false
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => [
                    'totalRegistrations' => $totalRegistrations,
                    'activeEvents' => $activeEvents,
                    'totalParticipants' => $totalParticipants,
                    'monthlyRegistrations' => $monthlyRegistrations,
                    'eventPopularity' => $eventPopularity,
                    'recentRegistrations' => $recentRegistrations,
                    'insights' => $registrationInsights
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch event analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get recent event registrations with filtration support
     * Supports filtering by event and includes archived events
     */
    public function recentEventRegistrations(Request $request): JsonResponse
    {
        try {
            // Get filters from query parameters
            $eventId = $request->query('event_id');
            $limit = $request->query('limit', 20);
            $status = $request->query('status'); // Optional: filter by status
            $archivedStatus = $request->query('archived_status', 'all'); // 'active', 'archived', or 'all'
            
            // Build the query with event filter support
            $query = EventRegistration::with(['event' => function($q) {
                $q->withTrashed(); // Include archived events in the relationship
            }]);
            
            // Apply event filter
            if ($eventId && $eventId !== 'all') {
                $query->where('event_id', $eventId);
            } else if ($archivedStatus !== 'all') {
                // Filter by archived status when showing all events
                $eventIds = Event::withTrashed()
                    ->when($archivedStatus === 'active', function($q) {
                        $q->whereNull('deleted_at');
                    })
                    ->when($archivedStatus === 'archived', function($q) {
                        $q->whereNotNull('deleted_at');
                    })
                    ->pluck('id');
                $query->whereIn('event_id', $eventIds);
            }
            
            // Apply status filter if provided, otherwise default to approved to match graph
            if ($status && $status !== 'all') {
                $query->where('status', $status);
            } else if (!$status) {
                // Default to approved if no status filter is specified
                $query->where('status', 'approved');
            }
            
            $recentRegistrations = $query
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get()
                ->map(function($registration) {
                    return [
                        'id' => $registration->id,
                        'date' => $registration->created_at->toISOString(),
                        'event_id' => $registration->event_id,
                        'event' => $registration->event->title ?? 'Unknown Event (Archived)',
                        'participant' => $registration->first_name . ' ' . $registration->last_name,
                        'email' => $registration->email,
                        'status' => ucfirst($registration->status),
                        'event_archived' => $registration->event ? $registration->event->trashed() : false,
                        'event_date' => $registration->event ? $registration->event->date : null
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => $recentRegistrations,
                'count' => $recentRegistrations->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch recent event registrations',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get event list with registration counts (for filtering purposes)
     * Includes both active and archived events
     */
    public function getEventsForFiltering(): JsonResponse
    {
        try {
            $events = Event::withTrashed()
                ->withCount('registrations')
                ->orderBy('date', 'desc')
                ->get()
                ->map(function($event) {
                    return [
                        'id' => $event->id,
                        'title' => $event->title,
                        'date' => $event->date,
                        'registrations_count' => $event->registrations_count,
                        'archived' => $event->trashed()
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => $events
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch events for filtering',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get parishioner attendance analytics
     */
    public function parishionerAttendanceMonthly(): JsonResponse
    {
        try {
            $monthlyAttendance = [];
            
            for ($i = 35; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $monthLabel = $date->format('M Y');
                $monthKey = $date->format('Y-m');
                
                // Count unique parishioners who registered for events in this month
                $count = EventRegistration::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->distinct('email')
                    ->count('email');
                
                $monthlyAttendance[] = [
                    'key' => $monthKey,
                    'month' => $monthLabel,
                    'count' => $count
                ];
            }
            
            // Calculate insights
            $insights = $this->calculateAttendanceInsights($monthlyAttendance);
            
            return response()->json([
                'success' => true,
                'data' => $monthlyAttendance,
                'insights' => $insights
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch attendance analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get activity involvement analytics
     */
    public function activityInvolvement(): JsonResponse
    {
        try {
            // Get ministry involvement from users
            $activityData = User::whereNotNull('ministry_involvements')
                ->where('is_admin', 0)
                ->where('is_staff', 0)
                ->where('is_priest', 0)
                ->get()
                ->flatMap(function($user) {
                    $ministries = is_array($user->ministry_involvements) 
                        ? $user->ministry_involvements 
                        : json_decode($user->ministry_involvements, true) ?? [];
                    
                    return array_map(function($ministry) {
                        return ['ministry' => $ministry, 'user_id' => $user->id];
                    }, $ministries);
                })
                ->groupBy('ministry')
                ->map(function($group) {
                    return [
                        'label' => $group->first()['ministry'],
                        'count' => $group->count()
                    ];
                })
                ->values()
                ->sortByDesc('count')
                ->take(10);
            
            // If no ministry data, provide default activities
            if ($activityData->isEmpty()) {
                $activityData = collect([
                    ['label' => 'Choir', 'count' => 0],
                    ['label' => 'Ushers', 'count' => 0],
                    ['label' => 'Catechists', 'count' => 0],
                    ['label' => 'Youth Ministry', 'count' => 0],
                    ['label' => 'Lectors', 'count' => 0]
                ]);
            }
            
            return response()->json([
                'success' => true,
                'data' => $activityData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch activity involvement',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get family analytics
     */
    public function familyAnalytics(): JsonResponse
    {
        try {
            $totalFamilies = Family::count();
            $activeFamilies = Family::where('family_status', 'active')->count();
            $totalFamilyMembers = User::whereNotNull('family_id')
                ->where('is_admin', 0)
                ->where('is_staff', 0)
                ->where('is_priest', 0)
                ->count();
            $unassignedMembers = User::whereNull('family_id')
                ->where('is_admin', 0)
                ->where('is_staff', 0)
                ->where('is_priest', 0)
                ->count();
            
            $averageFamilySize = $totalFamilies > 0 ? round($totalFamilyMembers / $totalFamilies, 1) : 0;
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_families' => $totalFamilies,
                    'active_families' => $activeFamilies,
                    'total_members' => $totalFamilyMembers,
                    'unassigned_members' => $unassignedMembers,
                    'average_family_size' => $averageFamilySize
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch family analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get comprehensive analytics dashboard data
     */
    public function dashboard(): JsonResponse
    {
        try {
            // Event analytics
            $totalRegistrations = EventRegistration::count();
            $activeEvents = Event::where('date', '>=', now())->count();
            $totalParticipants = EventRegistration::distinct('email')->count('email');
            
            // Donation analytics
            $totalDonations = Donation::where('verified', true)->sum('amount');
            $donationCount = Donation::where('verified', true)->count();
            $averageDonation = $donationCount > 0 ? round($totalDonations / $donationCount, 2) : 0;
            
            // Parishioner analytics
            $totalParishioners = User::where('is_admin', 0)
                ->where('is_staff', 0)
                ->where('is_priest', 0)
                ->count();
            
            $activeMembers = User::where('membership_status', 'active')
                ->where('is_admin', 0)
                ->where('is_staff', 0)
                ->where('is_priest', 0)
                ->count();
            
            // Use created_at instead of membership_date to include accounts created by admin
            // This ensures all new parishioner accounts are counted, regardless of how they were created
            $newMembersThisMonth = User::whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->where('is_admin', 0)
                ->where('is_staff', 0)
                ->where('is_priest', 0)
                ->count();
            
            // Family analytics
            $totalFamilies = Family::count();
            $activeFamilies = Family::where('family_status', 'active')->count();
            
            // Monthly trends for last 36 months (3 years)
            $monthlyData = [];
            for ($i = 35; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $monthLabel = $date->format('M Y');
                $monthKey = $date->format('Y-m');
                
                $eventRegistrations = EventRegistration::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count();
                
                $donations = Donation::where('verified', true)
                    ->whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->sum('amount');
                
                $monthlyData[] = [
                    'key' => $monthKey,
                    'month' => $monthLabel,
                    'event_registrations' => $eventRegistrations,
                    'donations' => $donations,
                    'attendance' => EventRegistration::whereYear('created_at', $date->year)
                        ->whereMonth('created_at', $date->month)
                        ->distinct('email')
                        ->count('email')
                ];
            }
            
            // Calculate insights
            $insights = $this->calculateDashboardInsights($monthlyData, $totalParishioners, $activeMembers, $newMembersThisMonth);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'events' => [
                        'total_registrations' => $totalRegistrations,
                        'active_events' => $activeEvents,
                        'total_participants' => $totalParticipants
                    ],
                    'donations' => [
                        'total_amount' => $totalDonations,
                        'total_count' => $donationCount,
                        'average_amount' => $averageDonation
                    ],
                    'parishioners' => [
                        'total' => $totalParishioners,
                        'active' => $activeMembers,
                        'new_this_month' => $newMembersThisMonth,
                        'active_rate' => $totalParishioners > 0 ? round(($activeMembers / $totalParishioners) * 100, 1) : 0
                    ],
                    'families' => [
                        'total' => $totalFamilies,
                        'active' => $activeFamilies
                    ],
                    'monthly_trends' => $monthlyData,
                    'insights' => $insights
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Calculate insights for event registrations
     */
    private function calculateRegistrationInsights($monthlyData)
    {
        if (empty($monthlyData)) {
            return [];
        }
        
        $counts = array_column($monthlyData, 'count');
        $total = array_sum($counts);
        $avg = $total / count($counts);
        
        // Calculate year-over-year growth
        $currentYear = array_slice($counts, -12);
        $previousYear = array_slice($counts, -24, 12);
        $twoYearsAgo = array_slice($counts, -36, 12);
        
        $currentYearTotal = array_sum($currentYear);
        $previousYearTotal = array_sum($previousYear);
        $twoYearsAgoTotal = count($twoYearsAgo) > 0 ? array_sum($twoYearsAgo) : 0;
        
        $yoyGrowth = $previousYearTotal > 0 
            ? round((($currentYearTotal - $previousYearTotal) / $previousYearTotal) * 100, 1)
            : 0;
        
        $twoYearGrowth = $twoYearsAgoTotal > 0
            ? round((($currentYearTotal - $twoYearsAgoTotal) / $twoYearsAgoTotal) * 100, 1)
            : 0;
        
        // Find peak and low months
        $maxIndex = array_search(max($counts), $counts);
        $minIndex = array_search(min($counts), $counts);
        
        // Calculate trend (increasing, decreasing, stable)
        $recentMonths = array_slice($counts, -6);
        $olderMonths = array_slice($counts, -12, 6);
        $recentAvg = array_sum($recentMonths) / count($recentMonths);
        $olderAvg = count($olderMonths) > 0 ? array_sum($olderMonths) / count($olderMonths) : $recentAvg;
        
        $trend = 'stable';
        if ($recentAvg > $olderAvg * 1.1) {
            $trend = 'increasing';
        } elseif ($recentAvg < $olderAvg * 0.9) {
            $trend = 'decreasing';
        }
        
        // Calculate seasonal patterns
        $seasonalPattern = $this->detectSeasonalPattern($monthlyData);
        
        return [
            'total_registrations' => $total,
            'average_monthly' => round($avg, 1),
            'peak_month' => $monthlyData[$maxIndex]['month'] ?? 'N/A',
            'peak_count' => max($counts),
            'low_month' => $monthlyData[$minIndex]['month'] ?? 'N/A',
            'low_count' => min($counts),
            'year_over_year_growth' => $yoyGrowth,
            'two_year_growth' => $twoYearGrowth,
            'trend' => $trend,
            'trend_percentage' => $olderAvg > 0 ? round((($recentAvg - $olderAvg) / $olderAvg) * 100, 1) : 0,
            'seasonal_pattern' => $seasonalPattern,
            'current_year_total' => $currentYearTotal,
            'previous_year_total' => $previousYearTotal
        ];
    }
    
    /**
     * Calculate insights for attendance
     */
    private function calculateAttendanceInsights($monthlyData)
    {
        if (empty($monthlyData)) {
            return [];
        }
        
        $counts = array_column($monthlyData, 'count');
        $total = array_sum($counts);
        $avg = $total / count($counts);
        
        // Year-over-year comparison
        $currentYear = array_slice($counts, -12);
        $previousYear = array_slice($counts, -24, 12);
        
        $currentYearTotal = array_sum($currentYear);
        $previousYearTotal = array_sum($previousYear);
        
        $yoyGrowth = $previousYearTotal > 0
            ? round((($currentYearTotal - $previousYearTotal) / $previousYearTotal) * 100, 1)
            : 0;
        
        // Trend analysis
        $recentMonths = array_slice($counts, -6);
        $olderMonths = array_slice($counts, -12, 6);
        $recentAvg = array_sum($recentMonths) / count($recentMonths);
        $olderAvg = count($olderMonths) > 0 ? array_sum($olderMonths) / count($olderMonths) : $recentAvg;
        
        $trend = 'stable';
        if ($recentAvg > $olderAvg * 1.1) {
            $trend = 'increasing';
        } elseif ($recentAvg < $olderAvg * 0.9) {
            $trend = 'decreasing';
        }
        
        return [
            'total_attendance' => $total,
            'average_monthly' => round($avg, 1),
            'year_over_year_growth' => $yoyGrowth,
            'trend' => $trend,
            'trend_percentage' => $olderAvg > 0 ? round((($recentAvg - $olderAvg) / $olderAvg) * 100, 1) : 0,
            'current_year_total' => $currentYearTotal,
            'previous_year_total' => $previousYearTotal
        ];
    }
    
    /**
     * Calculate insights for dashboard
     */
    private function calculateDashboardInsights($monthlyData, $totalParishioners, $activeMembers, $newMembersThisMonth)
    {
        if (empty($monthlyData)) {
            return [];
        }
        
        $eventCounts = array_column($monthlyData, 'event_registrations');
        $donationAmounts = array_column($monthlyData, 'donations');
        $attendanceCounts = array_column($monthlyData, 'attendance');
        
        // Event registration insights
        $currentYearEvents = array_sum(array_slice($eventCounts, -12));
        $previousYearEvents = array_sum(array_slice($eventCounts, -24, 12));
        $eventGrowth = $previousYearEvents > 0
            ? round((($currentYearEvents - $previousYearEvents) / $previousYearEvents) * 100, 1)
            : 0;
        
        // Donation insights
        $currentYearDonations = array_sum(array_slice($donationAmounts, -12));
        $previousYearDonations = array_sum(array_slice($donationAmounts, -24, 12));
        $donationGrowth = $previousYearDonations > 0
            ? round((($currentYearDonations - $previousYearDonations) / $previousYearDonations) * 100, 1)
            : 0;
        
        // Attendance insights
        $currentYearAttendance = array_sum(array_slice($attendanceCounts, -12));
        $previousYearAttendance = array_sum(array_slice($attendanceCounts, -24, 12));
        $attendanceGrowth = $previousYearAttendance > 0
            ? round((($currentYearAttendance - $previousYearAttendance) / $previousYearAttendance) * 100, 1)
            : 0;
        
        // Member growth rate
        $memberGrowthRate = $totalParishioners > 0
            ? round(($newMembersThisMonth / $totalParishioners) * 100, 2)
            : 0;
        
        // Engagement rate
        $engagementRate = $totalParishioners > 0
            ? round(($activeMembers / $totalParishioners) * 100, 1)
            : 0;
        
        return [
            'event_registrations' => [
                'current_year' => $currentYearEvents,
                'previous_year' => $previousYearEvents,
                'growth_percentage' => $eventGrowth,
                'trend' => $eventGrowth > 5 ? 'growing' : ($eventGrowth < -5 ? 'declining' : 'stable')
            ],
            'donations' => [
                'current_year' => $currentYearDonations,
                'previous_year' => $previousYearDonations,
                'growth_percentage' => $donationGrowth,
                'trend' => $donationGrowth > 5 ? 'growing' : ($donationGrowth < -5 ? 'declining' : 'stable')
            ],
            'attendance' => [
                'current_year' => $currentYearAttendance,
                'previous_year' => $previousYearAttendance,
                'growth_percentage' => $attendanceGrowth,
                'trend' => $attendanceGrowth > 5 ? 'growing' : ($attendanceGrowth < -5 ? 'declining' : 'stable')
            ],
            'membership' => [
                'total_parishioners' => $totalParishioners,
                'active_members' => $activeMembers,
                'new_this_month' => $newMembersThisMonth,
                'engagement_rate' => $engagementRate,
                'monthly_growth_rate' => $memberGrowthRate
            ]
        ];
    }
    
    /**
     * Detect seasonal patterns in data
     */
    private function detectSeasonalPattern($monthlyData)
    {
        if (count($monthlyData) < 12) {
            return 'insufficient_data';
        }
        
        // Group by month name (Jan, Feb, etc.) across all years
        $monthlyGroups = [];
        foreach ($monthlyData as $item) {
            // Extract month name from the month string (format: "Dec 2022" or use key "2022-12")
            $monthName = null;
            if (isset($item['key'])) {
                // Use key field if available (format: "2022-12")
                $parts = explode('-', $item['key']);
                if (count($parts) >= 2) {
                    $year = (int)$parts[0];
                    $monthNum = (int)$parts[1];
                    $monthName = Carbon::create($year, $monthNum, 1)->format('M');
                }
            }
            
            // Fallback: extract from month string (format: "Dec 2022")
            if (!$monthName && isset($item['month'])) {
                $monthStr = trim($item['month']);
                // Extract first 3 characters (month abbreviation)
                $monthName = substr($monthStr, 0, 3);
                // Validate it's a valid month abbreviation
                try {
                    Carbon::parse($monthName . ' 1, 2020'); // Test if valid month
                } catch (\Exception $e) {
                    // If not valid, try parsing the full string differently
                    $parts = explode(' ', $monthStr);
                    if (count($parts) >= 1) {
                        $monthName = $parts[0];
                    }
                }
            }
            
            if ($monthName) {
                if (!isset($monthlyGroups[$monthName])) {
                    $monthlyGroups[$monthName] = [];
                }
                $monthlyGroups[$monthName][] = $item['count'];
            }
        }
        
        // Calculate average for each month
        $monthlyAverages = [];
        foreach ($monthlyGroups as $month => $counts) {
            $monthlyAverages[$month] = array_sum($counts) / count($counts);
        }
        
        // Find peak and low seasons
        $peakMonth = array_search(max($monthlyAverages), $monthlyAverages);
        $lowMonth = array_search(min($monthlyAverages), $monthlyAverages);
        
        return [
            'peak_season' => $peakMonth,
            'low_season' => $lowMonth,
            'monthly_averages' => $monthlyAverages
        ];
    }
}