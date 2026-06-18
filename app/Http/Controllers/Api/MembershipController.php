<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MembershipStatusService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MembershipController extends Controller
{
    protected $membershipService;

    public function __construct(MembershipStatusService $membershipService)
    {
        $this->membershipService = $membershipService;
    }


    /**
     * Get membership statistics
     */
    public function statistics(): JsonResponse
    {
        try {
            $stats = $this->membershipService->getMembershipStatistics();
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            \Log::error('Membership statistics error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch membership statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Auto-update functionality removed - statuses are now manually managed
}
