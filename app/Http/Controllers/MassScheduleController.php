<?php

namespace App\Http\Controllers;

use App\Models\MassSchedule;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MassScheduleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $schedules = MassSchedule::active()->ordered()->get();
        return response()->json($schedules);
    }

    /**
     * Display the specified resource.
     */
    public function show(MassSchedule $massSchedule)
    {
        return response()->json($massSchedule);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'day' => ['required', Rule::in(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])],
            'time' => 'nullable|date_format:H:i',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'type' => 'required|string|max:255',
            'celebrant' => 'required|string|max:255',
            'is_active' => 'boolean'
        ]);

        // Set time to start_time for backward compatibility if time is not provided
        if (!isset($validated['time'])) {
            $validated['time'] = $validated['start_time'];
        }

        $schedule = MassSchedule::create($validated);

        \Log::info('Mass schedule created successfully: ' . $schedule->type . ' on ' . $schedule->day . ' at ' . $schedule->start_time);

        return response()->json([
            'success' => true,
            'message' => 'Mass schedule created successfully. Reminders will be sent automatically 3 hours before each scheduled mass time.',
            'data' => $schedule
        ], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, MassSchedule $massSchedule)
    {
        $validated = $request->validate([
            'day' => ['required', Rule::in(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])],
            'time' => 'nullable|date_format:H:i',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'type' => 'required|string|max:255',
            'celebrant' => 'required|string|max:255',
            'is_active' => 'boolean'
        ]);

        // Set time to start_time for backward compatibility if time is not provided
        if (!isset($validated['time'])) {
            $validated['time'] = $validated['start_time'];
        }

        $massSchedule->update($validated);
        return response()->json($massSchedule);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MassSchedule $massSchedule)
    {
        $massSchedule->delete();
        return response()->json(['message' => 'Mass schedule deleted successfully']);
    }

    /**
     * Get all schedules including inactive ones (for admin)
     */
    public function adminIndex()
    {
        $schedules = MassSchedule::ordered()->get();
        return response()->json($schedules);
    }

    /**
     * Toggle active status
     */
    public function toggleActive(MassSchedule $massSchedule)
    {
        $massSchedule->update(['is_active' => !$massSchedule->is_active]);
        return response()->json($massSchedule);
    }
}