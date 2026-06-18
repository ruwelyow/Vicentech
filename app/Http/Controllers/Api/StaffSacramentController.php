<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SacramentAppointment;
use App\Models\SacramentType;
use App\Models\SacramentTimeSlot;
use App\Notifications\SacramentAppointmentStatusNotification;

class StaffSacramentController extends Controller
{
 public function appointments()
{
    $appointments = SacramentAppointment::with(['user', 'sacramentType', 'timeSlot'])->get();

    $formatted = $appointments->map(function ($appointment) {
        return [
            'id' => $appointment->id,
            'type' => $appointment->sacramentType ? $appointment->sacramentType->name : 'N/A',
            'requestor' => $appointment->user ? $appointment->user->name : 'N/A',
            'dateRequested' => $appointment->created_at->toDateString(),
            'preferredDate' => $appointment->date,
            'status' => $appointment->status,
            'requirements' => [], // Add logic if needed
        ];
    });

    return response()->json($formatted);
}

    public function approve($id)
    {
        $appointment = SacramentAppointment::with(['user', 'sacramentType', 'timeSlot'])->findOrFail($id);
        
        // Use database transaction to ensure data consistency
        \DB::beginTransaction();
        try {
            $appointment->status = 'approved';
            $appointment->save();

            // Send notification to the parishioner
            if ($appointment->user) {
                $appointment->user->notify(new SacramentAppointmentStatusNotification($appointment, 'approved'));
            }

            \DB::commit();
            return response()->json(['message' => 'Appointment approved successfully and notification sent to parishioner']);
        } catch (\Exception $e) {
            \DB::rollback();
            return response()->json(['message' => 'Failed to approve appointment'], 500);
        }
    }

    public function reject(Request $request, $id)
    {
        $appointment = SacramentAppointment::with(['user', 'sacramentType', 'timeSlot'])->findOrFail($id);
        
        // Use database transaction to ensure data consistency
        \DB::beginTransaction();
        try {
            // Mark appointment as rejected
            $appointment->status = 'rejected';
            
            // Handle rejection reason
            if ($request->has('rejection_reason')) {
                $appointment->rejection_reason = $request->input('rejection_reason');
            }
            
            $appointment->save();

            // Free up the time slot if it was booked
            if ($appointment->timeSlot && $appointment->timeSlot->status === 'booked') {
                $appointment->timeSlot->status = 'available';
                $appointment->timeSlot->save();
            }

            // Send notification to the parishioner
            if ($appointment->user) {
                $appointment->user->notify(new SacramentAppointmentStatusNotification($appointment, 'rejected'));
            }

            \DB::commit();
            return response()->json(['message' => 'Appointment rejected successfully and notification sent to parishioner']);
        } catch (\Exception $e) {
            \DB::rollback();
            return response()->json(['message' => 'Failed to reject appointment'], 500);
        }
    }

    // Sacrament Types Management
    public function types()
    {
        $types = SacramentType::all();
        return response()->json($types);
    }

    public function addType(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:sacrament_types,name',
        ]);

        $type = SacramentType::create([
            'name' => $request->name,
            'description' => $request->description ?? null,
            'requirements' => $request->requirements ?? null,
        ]);

        return response()->json($type, 201);
    }

    public function editType(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:sacrament_types,name,' . $id,
        ]);

        $type = SacramentType::findOrFail($id);
        $type->update([
            'name' => $request->name,
            'description' => $request->description ?? $type->description,
            'requirements' => $request->requirements ?? $type->requirements,
        ]);

        return response()->json($type);
    }

    public function deleteType($id)
    {
        $type = SacramentType::findOrFail($id);
        $type->delete();

        return response()->json(['message' => 'Sacrament type deleted successfully']);
    }

    // Time Slots Management
    public function slots()
    {
        $slots = SacramentTimeSlot::with('sacramentType')->get();
        
        // Sort by time (earliest first) - parse time string and sort by start time
        $slots = $slots->sort(function($a, $b) {
            $timeA = $this->parseStartTime($a->time);
            $timeB = $this->parseStartTime($b->time);
            
            // If same time, sort by date
            if ($timeA == $timeB) {
                return strcmp($a->date, $b->date);
            }
            
            return $timeA <=> $timeB;
        })->values();
        
        return response()->json($slots);
    }
    
    /**
     * Parse time string (e.g., "7:00 AM - 8:00 AM") and return minutes since midnight
     * Returns integer for easy sorting (earliest times have lower values)
     */
    private function parseStartTime($timeString)
    {
        if (empty($timeString)) {
            return 9999; // Put empty times at the end
        }
        
        // Extract start time (before " - ")
        $parts = explode(' - ', $timeString);
        $startTime = trim($parts[0]);
        
        // Parse time format like "7:00 AM" or "07:00 AM"
        // Handle both "H:MM AM/PM" and "HH:MM AM/PM"
        if (preg_match('/(\d{1,2}):(\d{2})\s*(AM|PM)/i', $startTime, $matches)) {
            $hour = (int)$matches[1];
            $minute = (int)$matches[2];
            $period = strtoupper($matches[3]);
            
            // Convert to 24-hour format
            if ($period == 'PM' && $hour != 12) {
                $hour += 12;
            } elseif ($period == 'AM' && $hour == 12) {
                $hour = 0;
            }
            
            return $hour * 60 + $minute; // Return minutes since midnight
        }
        
        return 9999; // If parsing fails, put at end
    }

    public function addSlot(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'time' => 'required|string|max:255',
            'status' => 'required|in:available,disabled',
            'sacrament_type_id' => 'required|exists:sacrament_types,id',
        ]);

        $slot = SacramentTimeSlot::create([
            'date' => $request->date,
            'time' => $request->time,
            'status' => $request->status,
            'sacrament_type_id' => $request->sacrament_type_id,
        ]);

        return response()->json($slot->load('sacramentType'), 201);
    }

    public function bulkAddSlots(Request $request)
    {
        $request->validate([
            'slots' => 'required|array|min:1',
            'slots.*.date' => 'required|date',
            'slots.*.time' => 'required|string|max:255',
            'slots.*.status' => 'required|in:available,disabled',
        ]);

        try {
            \DB::beginTransaction();
            
            $createdSlots = [];
            $skippedSlots = [];
            
            foreach ($request->slots as $slotData) {
                // Check if slot already exists for this date and time
                $existingSlot = SacramentTimeSlot::where('date', $slotData['date'])
                    ->where('time', $slotData['time'])
                    ->first();
                
                if ($existingSlot) {
                    $skippedSlots[] = [
                        'date' => $slotData['date'],
                        'time' => $slotData['time'],
                        'reason' => 'Already exists'
                    ];
                    continue;
                }
                
                $slot = SacramentTimeSlot::create([
                    'date' => $slotData['date'],
                    'time' => $slotData['time'],
                    'status' => $slotData['status'],
                ]);
                
                $createdSlots[] = $slot;
            }
            
            \DB::commit();
            
            return response()->json([
                'message' => 'Bulk time slots creation completed',
                'created_count' => count($createdSlots),
                'skipped_count' => count($skippedSlots),
                'created_slots' => $createdSlots,
                'skipped_slots' => $skippedSlots
            ], 201);
            
        } catch (\Exception $e) {
            \DB::rollback();
            return response()->json([
                'message' => 'Failed to create bulk time slots',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function editSlot(Request $request, $id)
    {
        $request->validate([
            'date' => 'required|date',
            'time' => 'required|string|max:255',
            'status' => 'required|in:available,disabled',
            'sacrament_type_id' => 'nullable|exists:sacrament_types,id',
        ]);

        $slot = SacramentTimeSlot::findOrFail($id);
        $slot->update([
            'date' => $request->date,
            'time' => $request->time,
            'status' => $request->status,
            'sacrament_type_id' => $request->sacrament_type_id,
        ]);

        return response()->json($slot->load('sacramentType'));
    }

    public function enableSlot($id)
    {
        $slot = SacramentTimeSlot::findOrFail($id);
        $slot->update(['status' => 'available']);

        return response()->json(['message' => 'Time slot enabled successfully']);
    }

    public function disableSlot($id)
    {
        $slot = SacramentTimeSlot::findOrFail($id);
        $slot->update(['status' => 'disabled']);

        return response()->json(['message' => 'Time slot disabled successfully']);
    }

    public function bulkDeleteSlots(Request $request)
    {
        $request->validate([
            'slot_ids' => 'required|array',
            'slot_ids.*' => 'required|exists:sacrament_time_slots,id',
        ]);

        try {
            $deletedCount = SacramentTimeSlot::whereIn('id', $request->slot_ids)->delete();

            return response()->json([
                'success' => true,
                'message' => "Successfully deleted {$deletedCount} time slot(s)",
                'deleted_count' => $deletedCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete time slots: ' . $e->getMessage()
            ], 500);
        }
    }
}
