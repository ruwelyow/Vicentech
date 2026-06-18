<?php

namespace App\Services;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class MembershipStatusService
{
    // Auto-update functionality removed - statuses are now manually managed
    /**
     * Get membership status statistics
     */
    public function getMembershipStatistics()
    {
        // Get all parishioners first
        $allParishioners = User::where('is_admin', 0)
                              ->where('is_staff', 0)
                              ->where('is_priest', 0)
                              ->get();
        
        // Count by status using collection methods
        $total = $allParishioners->count();
        $active = $allParishioners->where('membership_status', 'active')->count();
        $inactive = $allParishioners->where('membership_status', 'inactive')->count();
        $visitor = $allParishioners->where('membership_status', 'visitor')->count();
        $new_member = $allParishioners->where('membership_status', 'new_member')->count();
        
        return [
            'total' => $total,
            'active' => $active,
            'inactive' => $inactive,
            'visitor' => $visitor,
            'new_member' => $new_member,
        ];
    }
}
