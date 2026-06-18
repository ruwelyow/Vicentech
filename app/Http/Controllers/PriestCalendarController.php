<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PriestCalendar;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class PriestCalendarController extends Controller
{
    /**
     * Display a listing of priest calendar entries.
     * Can be filtered by priest_id, date, or date range.
     */
    public function index(Request $request): JsonResponse
    {
        $query = PriestCalendar::with('priest:id,name');

        // Filter by priest
        if ($request->has('priest_id')) {
            $query->forPriest($request->priest_id);
        }

        // Filter by specific date
        if ($request->has('date')) {
            $query->forDate($request->date);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->dateRange($request->start_date, $request->end_date);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Order by date and time
        $query->orderBy('date', 'asc')->orderBy('time', 'asc');

        $entries = $query->get();

        return response()->json([
            'success' => true,
            'data' => $entries
        ]);
    }

    /**
     * Store a newly created priest calendar entry.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            \Log::info('PriestCalendar Store - Raw Request Data:', $request->all());
            
            $validated = $request->validate([
                'priest_id' => 'required|exists:users,id',
                'duty' => 'required|string|max:255',
                'date' => 'required|date|after_or_equal:today',
                'time' => 'required|date_format:H:i',
                'notes' => 'nullable|string|max:1000',
                'status' => 'nullable|in:scheduled,completed,cancelled'
            ]);

            \Log::info('PriestCalendar Store - Validated Data:', $validated);

            // Verify the user is actually a priest
            $priest = User::findOrFail($validated['priest_id']);
            if (!$priest->isPriest()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selected user is not a priest'
                ], 422);
            }

            // Enhanced conflict checking
            $conflictQuery = PriestCalendar::where('priest_id', $validated['priest_id'])
                ->where('date', $validated['date'])
                ->where('status', 'scheduled');

            // Check for exact time conflict
            $exactConflict = $conflictQuery->where('time', $validated['time'])->first();
            
            if ($exactConflict) {
                $priestName = $priest->name;
                return response()->json([
                    'success' => false,
                    'message' => "Priest {$priestName} already has a duty scheduled on {$validated['date']} at {$validated['time']}. Please choose a different time or date."
                ], 422);
            }

            // Check for overlapping time conflicts (optional - you can enable this if needed)
            // This checks for duties that might overlap in time
            $overlappingConflict = $conflictQuery
                ->where(function($query) use ($validated) {
                    $query->where('time', '<=', $validated['time'])
                          ->whereRaw("ADDTIME(time, '01:00:00') > ?", [$validated['time']]); // Assuming 1-hour duties
                })
                ->first();

            if ($overlappingConflict) {
                $priestName = $priest->name;
                return response()->json([
                    'success' => false,
                    'message' => "Priest {$priestName} has a duty scheduled on {$validated['date']} at {$overlappingConflict->time} that may conflict with the requested time {$validated['time']}. Please choose a different time."
                ], 422);
            }

            $entry = PriestCalendar::create($validated);
            \Log::info('PriestCalendar Store - Created Entry:', $entry->toArray());
            
            $entry->load('priest:id,name');

            return response()->json([
                'success' => true,
                'message' => 'Priest duty assigned successfully',
                'data' => $entry
            ], 201);

        } catch (ValidationException $e) {
            \Log::error('PriestCalendar Store - Validation Error:', $e->errors());
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('PriestCalendar Store - General Error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified priest calendar entry.
     */
    public function show(string $id): JsonResponse
    {
        $entry = PriestCalendar::with('priest:id,name')->find($id);

        if (!$entry) {
            return response()->json([
                'success' => false,
                'message' => 'Calendar entry not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $entry
        ]);
    }

    /**
     * Update the specified priest calendar entry.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $entry = PriestCalendar::find($id);

        if (!$entry) {
            return response()->json([
                'success' => false,
                'message' => 'Calendar entry not found'
            ], 404);
        }

        try {
            $validated = $request->validate([
                'priest_id' => 'sometimes|exists:users,id',
                'duty' => 'sometimes|string|max:255',
                'date' => 'sometimes|date|after_or_equal:today',
                'time' => 'sometimes|date_format:H:i',
                'notes' => 'nullable|string|max:1000',
                'status' => 'sometimes|in:scheduled,completed,cancelled'
            ]);

            // If priest_id is being updated, verify the new user is a priest
            if (isset($validated['priest_id'])) {
                $priest = User::findOrFail($validated['priest_id']);
                if (!$priest->isPriest()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Selected user is not a priest'
                    ], 422);
                }
            }

            // Enhanced conflict checking if date, time, or priest is being updated
            if (isset($validated['priest_id']) || isset($validated['date']) || isset($validated['time'])) {
                $priestId = $validated['priest_id'] ?? $entry->priest_id;
                $date = $validated['date'] ?? $entry->date->format('Y-m-d');
                $time = $validated['time'] ?? $entry->time->format('H:i');

                // Get priest name for error messages
                $priest = User::find($priestId);
                $priestName = $priest ? $priest->name : 'Selected priest';

                // Check for exact time conflict
                $exactConflict = PriestCalendar::where('priest_id', $priestId)
                    ->where('date', $date)
                    ->where('time', $time)
                    ->where('status', 'scheduled')
                    ->where('id', '!=', $id)
                    ->first();

                if ($exactConflict) {
                    return response()->json([
                        'success' => false,
                        'message' => "Priest {$priestName} already has a duty scheduled on {$date} at {$time}. Please choose a different time or date."
                    ], 422);
                }

                // Check for overlapping time conflicts (optional)
                $overlappingConflict = PriestCalendar::where('priest_id', $priestId)
                    ->where('date', $date)
                    ->where('status', 'scheduled')
                    ->where('id', '!=', $id)
                    ->where(function($query) use ($time) {
                        $query->where('time', '<=', $time)
                              ->whereRaw("ADDTIME(time, '01:00:00') > ?", [$time]); // Assuming 1-hour duties
                    })
                    ->first();

                if ($overlappingConflict) {
                    return response()->json([
                        'success' => false,
                        'message' => "Priest {$priestName} has a duty scheduled on {$date} at {$overlappingConflict->time} that may conflict with the requested time {$time}. Please choose a different time."
                    ], 422);
                }
            }

            $entry->update($validated);
            $entry->load('priest:id,name');

            return response()->json([
                'success' => true,
                'message' => 'Calendar entry updated successfully',
                'data' => $entry
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }
    }

    /**
     * Remove the specified priest calendar entry.
     */
    public function destroy(string $id): JsonResponse
    {
        $entry = PriestCalendar::find($id);

        if (!$entry) {
            return response()->json([
                'success' => false,
                'message' => 'Calendar entry not found'
            ], 404);
        }

        $entry->delete();

        return response()->json([
            'success' => true,
            'message' => 'Calendar entry deleted successfully'
        ]);
    }

    /**
     * Get all priests (users with is_priest = true).
     */
    public function getPriests(): JsonResponse
    {
        $priests = User::where('is_priest', true)
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $priests
        ]);
    }

    /**
     * Get calendar entries for a specific priest.
     */
    public function getPriestSchedule(Request $request, string $priestId): JsonResponse
    {
        $priest = User::find($priestId);

        if (!$priest || !$priest->isPriest()) {
            return response()->json([
                'success' => false,
                'message' => 'Priest not found'
            ], 404);
        }

        $query = PriestCalendar::forPriest($priestId);

        // Filter by date range if provided
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->dateRange($request->start_date, $request->end_date);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $entries = $query->orderBy('date', 'asc')
            ->orderBy('time', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'priest' => $priest->only(['id', 'name', 'email']),
                'schedule' => $entries
            ]
        ]);
    }

    /**
     * Get calendar entries for a specific month.
     */
    public function getMonthlySchedule(Request $request): JsonResponse
    {
        $year = $request->get('year', date('Y'));
        $month = $request->get('month', date('m'));

        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = Carbon::create($year, $month, 1)->endOfMonth();

        $entries = PriestCalendar::with('priest:id,name')
            ->dateRange($startDate, $endDate)
            ->orderBy('date', 'asc')
            ->orderBy('time', 'asc')
            ->get();

        // Group entries by date
        $groupedEntries = $entries->groupBy(function ($entry) {
            return $entry->date->format('Y-m-d');
        });

        return response()->json([
            'success' => true,
            'data' => [
                'year' => $year,
                'month' => $month,
                'entries' => $groupedEntries
            ]
        ]);
    }
}
