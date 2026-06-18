<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DonationPurpose;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DonationPurposeController extends Controller
{
    public function index()
    {
        // Return all purposes including archived ones for admin/staff
        // Also include total donations and goal status
        $purposes = DonationPurpose::withTrashed()->orderBy('deleted_at', 'asc')->orderBy('name', 'asc')->get();
        
        return $purposes->map(function ($purpose) {
            // Calculate total verified donations for this purpose
            $totalDonations = \App\Models\Donation::where('verified', true)
                ->where(function ($query) use ($purpose) {
                    $query->where('category', $purpose->id)
                          ->orWhere('purpose_name', $purpose->name);
                })
                ->sum('amount');
            
            $purpose->total_donations = $totalDonations;
            $purpose->goal_reached = $purpose->goal_amount && $purpose->goal_amount > 0 && $totalDonations >= $purpose->goal_amount;
            $purpose->progress_percentage = $purpose->goal_amount && $purpose->goal_amount > 0 
                ? min(100, round(($totalDonations / $purpose->goal_amount) * 100, 2))
                : null;
            
            return $purpose;
        });
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'goal_amount' => 'nullable|numeric|min:0'
        ]);
        
        // Use direct DB insert to avoid id field issues
        $purposeId = \DB::table('donation_purposes')->insertGetId([
            'name' => $request->name,
            'goal_amount' => $request->goal_amount ?? null,
            'enabled' => $request->enabled ?? true,
            'description' => $request->description ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Get the created record
        $purpose = DonationPurpose::find($purposeId);
        
        return response()->json($purpose, 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'enabled' => 'sometimes|boolean',
            'goal_amount' => 'nullable|numeric|min:0'
        ]);
        $purpose = DonationPurpose::withTrashed()->findOrFail($id);
        $purpose->update($request->all());
        return response()->json($purpose);
    }

    public function destroy($id)
    {
        // Use soft delete to archive the purpose instead of permanently deleting
        $purpose = DonationPurpose::withTrashed()->findOrFail($id);
        $purpose->delete(); // This will soft delete (archive) if SoftDeletes is enabled
        return response()->json(['message' => 'Donation purpose archived successfully'], 200);
    }

    public function restore($id)
    {
        $purpose = DonationPurpose::withTrashed()->findOrFail($id);
        
        if (!$purpose->trashed()) {
            return response()->json([
                'success' => false,
                'message' => 'Donation purpose is not archived.'
            ], 400);
        }
        
        $purpose->restore();
        
        return response()->json([
            'success' => true,
            'message' => 'Donation purpose restored successfully.',
            'purpose' => $purpose->fresh()
        ], 200);
    }
}