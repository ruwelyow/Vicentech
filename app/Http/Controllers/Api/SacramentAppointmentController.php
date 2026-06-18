<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SacramentAppointment;
use App\Models\SacramentType;
use App\Models\SacramentTimeSlot;
use Illuminate\Support\Facades\Auth;

class SacramentAppointmentController extends Controller
{
    public function types()
    {
        $types = SacramentType::all();
        return response()->json($types);
    }

    public function availableSlots(Request $request)
    {
        // Get all time slots that are available (not booked or disabled)
        $slots = SacramentTimeSlot::where('status', 'available')->get();
        
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
        
        // Also get date availability information
        $dateAvailability = [];
        $dates = $slots->pluck('date')->unique();
        
        foreach ($dates as $date) {
            $dateSlots = $slots->where('date', $date);
            $totalSlots = SacramentTimeSlot::where('date', $date)->count();
            $availableSlots = $dateSlots->count();
            $bookedSlots = SacramentTimeSlot::where('date', $date)->where('status', 'booked')->count();
            
            $dateAvailability[$date] = [
                'total_slots' => $totalSlots,
                'available_slots' => $availableSlots,
                'booked_slots' => $bookedSlots,
                'is_fully_booked' => $availableSlots === 0 && $totalSlots > 0,
                'is_available' => $availableSlots > 0
            ];
        }
        
        return response()->json([
            'slots' => $slots,
            'date_availability' => $dateAvailability
        ]);
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

    public function book(Request $request)
    {
        $request->validate([
            'sacrament_type' => 'required|exists:sacrament_types,id',
            'preferred_date' => 'required|date',
            'time_slot_id' => 'required|exists:sacrament_time_slots,id',
        ]);

        $user = Auth::user();
        $timeSlotId = $request->input('time_slot_id');

        // Check if the time slot is still available
        $timeSlot = SacramentTimeSlot::find($timeSlotId);
        if (!$timeSlot || $timeSlot->status !== 'available') {
            return response()->json(['message' => 'This time slot is no longer available'], 400);
        }

        // Use database transaction to ensure data consistency
        \DB::beginTransaction();
        try {
            // Create the appointment
        $appointment = new SacramentAppointment();
        $appointment->user_id = $user->id;
        $appointment->sacrament_type_id = $request->input('sacrament_type');
        $appointment->date = $request->input('preferred_date');
            $appointment->time_slot_id = $timeSlotId;
        $appointment->status = 'pending';
            $appointment->save();

            // Mark the time slot as booked
            $timeSlot->status = 'booked';
            $timeSlot->save();

            \DB::commit();
            
            \Log::info('Sacrament appointment saved successfully', ['appointment_id' => $appointment->id]);
            
            // Trigger notification update for staff sidebar
            // This could be handled via events/listeners in a more robust implementation
            
            return response()->json(['message' => 'Appointment booked successfully']);
        } catch (\Exception $e) {
            \DB::rollback();
            \Log::error('Failed to save sacrament appointment', ['request' => $request->all(), 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to book appointment'], 500);
        }
    }

    public function myAppointments()
    {
        $user = Auth::user();
        $appointments = SacramentAppointment::where('user_id', $user->id)->get();
        return response()->json($appointments);
    }
}
