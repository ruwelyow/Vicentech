<?php

namespace App\Http\Controllers;

use App\Models\MassAttendance;
use App\Models\MassSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Barryvdh\DomPDF\Facade\Pdf;

class MassAttendanceController extends Controller
{
    /**
     * Show the mass attendance form
     */
    public function showForm($massScheduleId)
    {
        $massSchedule = MassSchedule::findOrFail($massScheduleId);
        $user = Auth::user();
        
        return view('mass-attendance.form', compact('massSchedule', 'user'));
    }

    /**
     * Store mass attendance registration
     */
    public function store(Request $request)
    {
        // Require authentication
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'You must be logged in to register for mass attendance.'
            ], 401);
        }

        $validated = $request->validate([
            'mass_schedule_id' => 'required|exists:mass_schedules,id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'address' => 'required|string|max:500',
        ]);

        // Verify that the logged-in user's email matches the submitted email
        if (Auth::user()->email !== $validated['email']) {
            return response()->json([
                'success' => false,
                'message' => 'Email address does not match your account.'
            ], 400);
        }

        // Check if user is already registered for this mass
        $existingAttendance = MassAttendance::where('mass_schedule_id', $validated['mass_schedule_id'])
            ->where('user_id', Auth::id())
            ->first();

        if ($existingAttendance) {
            return response()->json([
                'success' => false,
                'message' => 'You have already registered for this mass.'
            ], 400);
        }

        // Create attendance record with default values
        $attendance = MassAttendance::create([
            'mass_schedule_id' => $validated['mass_schedule_id'],
            'user_id' => Auth::id(),
            'name' => $validated['name'],
            'email' => $validated['email'],
            'address' => $validated['address'],
            'phone' => Auth::user()->phone ?? null,
            'number_of_people' => 1, // Default to 1 person
            'special_requests' => null,
            'attendance_date' => now(),
            'is_confirmed' => true
        ]);

        // Update user's last_attendance
        $user = Auth::user();
        if ($user) {
            $user->last_attendance = now();
            $user->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Thank you for registering! We look forward to seeing you at mass.',
            'data' => $attendance
        ]);
    }

    /**
     * Get attendance statistics for admin
     */
    public function getStatistics(Request $request)
    {
        try {
            $query = MassAttendance::with(['massSchedule', 'user']);

            // Filter by date range if provided
            if ($request->has('start_date') && $request->has('end_date')) {
                $startDate = $request->input('start_date');
                $endDate = $request->input('end_date');
                
                // Validate dates
                if ($startDate && $endDate) {
                    $query->forDateRange($startDate, $endDate);
                }
            }

            // Filter by mass schedule if provided
            if ($request->has('mass_schedule_id')) {
                $query->where('mass_schedule_id', $request->mass_schedule_id);
            }

            $attendances = $query->orderBy('created_at', 'desc')->get();

        // Calculate statistics
        $totalAttendances = $attendances->count();
        $totalPeople = $attendances->sum('number_of_people');
        $uniqueUsers = $attendances->whereNotNull('user_id')->unique('user_id')->count();
        $guestAttendances = $attendances->whereNull('user_id')->count();

        // Group by mass schedule
        $attendancesByMass = $attendances->groupBy('mass_schedule_id')->map(function($group) {
            $firstAttendance = $group->first();
            $massSchedule = $firstAttendance ? $firstAttendance->massSchedule : null;
            return [
                'mass_schedule' => $massSchedule,
                'attendances' => $group->count(),
                'total_people' => $group->sum('number_of_people'),
                'registered_users' => $group->whereNotNull('user_id')->count(),
                'guests' => $group->whereNull('user_id')->count()
            ];
        })->filter(function($item) {
            // Filter out groups with null mass schedules
            return $item['mass_schedule'] !== null;
        })->values();

        // Calculate monthly attendance data for the last 36 months (3 years)
        $monthlyAttendance = [];
        for ($i = 35; $i >= 0; $i--) {
            $date = now()->copy()->subMonths($i);
            $monthKey = $date->format('Y-m');
            $monthLabel = $date->format('M Y');
            
            $monthlyCount = $attendances->filter(function($attendance) use ($monthKey) {
                if (!$attendance->created_at) {
                    return false;
                }
                return $attendance->created_at->format('Y-m') === $monthKey;
            })->sum('number_of_people');
            
            $monthlyAttendance[] = [
                'key' => $monthKey,
                'month' => $monthLabel,
                'count' => $monthlyCount
            ];
        }
        
        // Calculate insights
        $insights = $this->calculateMassAttendanceInsights($monthlyAttendance);

        // Calculate daily attendance (last 14 days)
        $dailyAttendance = [];
        for ($i = 13; $i >= 0; $i--) {
            $date = now()->copy()->subDays($i)->startOfDay();
            $dailyCount = $attendances->filter(function($attendance) use ($date) {
                if (!$attendance->created_at) {
                    return false;
                }
                return $attendance->created_at->isSameDay($date);
            })->sum('number_of_people');

            $dailyAttendance[] = [
                'date' => $date->toDateString(),
                'label' => $date->format('M d'),
                'count' => $dailyCount
            ];
        }

        // Calculate weekly attendance (last 8 weeks)
        $weeklyAttendance = [];
        for ($i = 7; $i >= 0; $i--) {
            $weekStart = now()->copy()->startOfWeek()->subWeeks($i);
            $weekEnd = $weekStart->copy()->endOfWeek();

            $weeklyCount = $attendances->filter(function($attendance) use ($weekStart, $weekEnd) {
                if (!$attendance->created_at) {
                    return false;
                }
                return $attendance->created_at->betweenIncluded($weekStart, $weekEnd);
            })->sum('number_of_people');

            $weeklyAttendance[] = [
                'week_start' => $weekStart->toDateString(),
                'week_end' => $weekEnd->toDateString(),
                'label' => $weekStart->format('M d') . ' - ' . $weekEnd->format('M d'),
                'count' => $weeklyCount
            ];
        }

            return response()->json([
                'success' => true,
                'data' => [
                    'total_attendances' => $totalAttendances,
                    'total_people' => $totalPeople,
                    'unique_users' => $uniqueUsers,
                    'guest_attendances' => $guestAttendances,
                    'attendances_by_mass' => $attendancesByMass,
                    'monthly_attendance' => $monthlyAttendance,
                    'daily_attendance' => $dailyAttendance,
                    'weekly_attendance' => $weeklyAttendance,
                    'recent_attendances' => $attendances->take(20),
                    'insights' => $insights
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Mass attendance statistics error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch mass attendance statistics',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }
    
    /**
     * Calculate insights for mass attendance
     */
    private function calculateMassAttendanceInsights($monthlyData)
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
        
        // Find peak and low months
        $maxIndex = array_search(max($counts), $counts);
        $minIndex = array_search(min($counts), $counts);
        
        return [
            'total_attendance' => $total,
            'average_monthly' => round($avg, 1),
            'peak_month' => $monthlyData[$maxIndex]['month'] ?? 'N/A',
            'peak_count' => max($counts),
            'low_month' => $monthlyData[$minIndex]['month'] ?? 'N/A',
            'low_count' => min($counts),
            'year_over_year_growth' => $yoyGrowth,
            'two_year_growth' => $twoYearGrowth,
            'trend' => $trend,
            'trend_percentage' => $olderAvg > 0 ? round((($recentAvg - $olderAvg) / $olderAvg) * 100, 1) : 0,
            'current_year_total' => $currentYearTotal,
            'previous_year_total' => $previousYearTotal
        ];
    }

    /**
     * Get all attendances for admin
     */
    public function index(Request $request)
    {
        $query = MassAttendance::with(['massSchedule', 'user']);

        // Filter by date range if provided
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->forDateRange($request->start_date, $request->end_date);
        }

        // Filter by mass schedule if provided
        if ($request->has('mass_schedule_id')) {
            $query->where('mass_schedule_id', $request->mass_schedule_id);
        }

        $attendances = $query->orderBy('created_at', 'desc')->paginate(50);

        return response()->json([
            'success' => true,
            'data' => $attendances
        ]);
    }

    /**
     * Update attendance status
     */
    public function update(Request $request, MassAttendance $attendance)
    {
        $validated = $request->validate([
            'is_confirmed' => 'boolean',
            'special_requests' => 'nullable|string|max:1000'
        ]);

        $attendance->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Attendance updated successfully',
            'data' => $attendance
        ]);
    }

    /**
     * Delete attendance
     */
    public function destroy(MassAttendance $attendance)
    {
        $attendance->delete();

        return response()->json([
            'success' => true,
            'message' => 'Attendance deleted successfully'
        ]);
    }

    /**
     * Export mass attendance to PDF
     */
    public function exportPdf(Request $request)
    {
        try {
            $view = $request->input('view', 'monthly'); // daily, weekly, monthly
            $selectedMonth = $request->input('selectedMonth', null); // YYYY-MM format or null for 'all'
            
            // Convert 'all' to null
            if ($selectedMonth === 'all') {
                $selectedMonth = null;
            }
            
            // Calculate date range based on view and selectedMonth
            $dateRange = $this->calculateDateRange($view, $selectedMonth);
            
            // Increase memory limit for PDF generation
            ini_set('memory_limit', '256M');
            
            // Fetch mass attendance records with optimized query - only select needed columns
            $query = MassAttendance::with([
                'massSchedule:id,mass_type,time',
                'user:id,name'
            ])
            ->where('is_confirmed', true) // Only confirmed attendances
            ->select('id', 'mass_schedule_id', 'user_id', 'name', 'attendance_date', 'created_at', 'is_confirmed');
            
            if ($dateRange['start'] && $dateRange['end']) {
                $query->forDateRange($dateRange['start'], $dateRange['end']);
            }
            
            // Use cursor for memory efficiency when processing large datasets
            $attendances = collect();
            foreach ($query->orderBy('attendance_date', 'asc')
                ->orderBy('created_at', 'asc')
                ->cursor() as $attendance) {
                $attendances->push($attendance);
            }
            
            // Format data for PDF - process in chunks to save memory
            $formattedAttendances = [];
            foreach ($attendances as $attendance) {
                try {
                    $attendanceDate = 'N/A';
                    if ($attendance->attendance_date) {
                        $attendanceDate = \Carbon\Carbon::parse($attendance->attendance_date)->format('Y-m-d');
                    } elseif ($attendance->created_at) {
                        $attendanceDate = $attendance->created_at->format('Y-m-d');
                    }
                    
                    $massSchedule = $attendance->massSchedule;
                    $scheduleTime = 'N/A';
                    if ($massSchedule) {
                        $time = '';
                        if ($massSchedule->time) {
                            try {
                                $time = \Carbon\Carbon::parse($massSchedule->time)->format('h:i A');
                            } catch (\Exception $e) {
                                $time = $massSchedule->time;
                            }
                        }
                        $massType = $massSchedule->mass_type ?? 'Mass';
                        $scheduleTime = $massType . ($time ? ' - ' . $time : '');
                    }
                    
                    $name = 'Guest';
                    if ($attendance->name) {
                        $name = $attendance->name;
                    } elseif ($attendance->user && $attendance->user->name) {
                        $name = $attendance->user->name;
                    }
                    
                    $formattedAttendances[] = [
                        'name' => $name,
                        'attendance_date' => $attendanceDate,
                        'mass_schedule' => $scheduleTime,
                        'confirmation_status' => $attendance->is_confirmed ? 'Confirmed' : 'Pending'
                    ];
                } catch (\Exception $e) {
                    \Log::error('Error formatting attendance for PDF: ' . $e->getMessage());
                    $formattedAttendances[] = [
                        'name' => 'Error',
                        'attendance_date' => 'N/A',
                        'mass_schedule' => 'N/A',
                        'confirmation_status' => 'N/A'
                    ];
                }
                
                // Unset to free memory
                unset($attendance);
            }
            
            // Clear the collection to free memory
            $attendances = null;
            
            // Format data for PDF
            $data = [
                'title' => 'Mass Attendance Report',
                'view' => $view,
                'selectedMonth' => $selectedMonth,
                'dateRange' => $dateRange,
                'attendances' => collect($formattedAttendances)
            ];
            
            // Generate PDF
            $html = view('pdf.mass-attendance-report', $data)->render();
            $pdf = Pdf::loadHTML($html);
            $pdf->setPaper('A4', 'landscape'); // Landscape for better table display
            
            $filename = 'mass_attendance_' . $view . '_' . ($selectedMonth ? $selectedMonth : 'all') . '_' . date('Y-m-d') . '.pdf';
            
            return $pdf->download($filename);
        } catch (\Exception $e) {
            \Log::error('Mass attendance PDF export error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF: ' . ($e->getMessage()),
                'error' => config('app.debug') ? $e->getTraceAsString() : 'An error occurred'
            ], 500);
        }
    }
    
    /**
     * Calculate date range based on view and selectedMonth
     */
    private function calculateDateRange($view, $selectedMonth)
    {
        $now = \Carbon\Carbon::now();
        $start = null;
        $end = null;
        $label = '';
        
        if ($selectedMonth && $selectedMonth !== 'all') {
            // Parse selected month (YYYY-MM)
            $parts = explode('-', $selectedMonth);
            $year = (int)$parts[0];
            $month = (int)$parts[1];
            
            $start = \Carbon\Carbon::create($year, $month, 1)->startOfMonth();
            $end = $start->copy()->endOfMonth();
            $label = $start->format('F Y');
        } else {
            // No month filter - use view-based range
            switch ($view) {
                case 'daily':
                    $start = $now->copy()->subDays(13)->startOfDay(); // Last 14 days
                    $end = $now->copy()->endOfDay();
                    $label = 'Last 14 Days';
                    break;
                case 'weekly':
                    $start = $now->copy()->subWeeks(7)->startOfWeek(); // Last 8 weeks
                    $end = $now->copy()->endOfWeek();
                    $label = 'Last 8 Weeks';
                    break;
                case 'monthly':
                default:
                    $start = $now->copy()->subMonths(11)->startOfMonth(); // Last 12 months
                    $end = $now->copy()->endOfMonth();
                    $label = 'Last 12 Months';
                    break;
            }
        }
        
        return [
            'start' => $start ? $start->format('Y-m-d') : null,
            'end' => $end ? $end->format('Y-m-d') : null,
            'label' => $label
        ];
    }
}