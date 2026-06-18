<?php

namespace App\Http\Controllers;

use App\Models\DonationPurpose;
use App\Models\Donation;
use Illuminate\Http\Request;

class DonationPurposeController extends Controller
{
    public function index()
    {
        $purposes = DonationPurpose::where('enabled', true)->get();
        
        // Filter out purposes that have reached their goal and archive them
        $filteredPurposes = $purposes->filter(function ($purpose) {
            // If no goal is set, always show the purpose
            if (!$purpose->goal_amount || $purpose->goal_amount <= 0) {
                return true;
            }
            
            // Calculate total verified donations for this purpose
            $totalDonations = Donation::where('verified', true)
                ->where(function ($query) use ($purpose) {
                    $query->where('category', $purpose->id)
                          ->orWhere('purpose_name', $purpose->name);
                })
                ->sum('amount');
            
            // If goal is reached, archive the purpose automatically
            if ($totalDonations >= $purpose->goal_amount) {
                if (!$purpose->trashed()) {
                    $purpose->delete(); // Soft delete (archive)
                    \Log::info("Donation purpose '{$purpose->name}' automatically archived - goal reached (₱{$totalDonations} >= ₱{$purpose->goal_amount})");
                }
                return false; // Don't show archived purposes
            }
            
            // Only show if goal hasn't been reached
            return true;
        });
        
        return $filteredPurposes->values();
    }
}