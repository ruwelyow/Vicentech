<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Carbon\Carbon;

class MembershipStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Sets sample membership statuses for existing parishioners
     */
    public function run(): void
    {
        // Get all parishioners (non-admin, non-staff, non-priest)
        $parishioners = User::where('is_admin', 0)
            ->where('is_staff', 0)
            ->where('is_priest', 0)
            ->get();

        if ($parishioners->isEmpty()) {
            $this->command->info('No parishioners found to update membership statuses.');
            return;
        }

        $statuses = ['active', 'inactive', 'visitor', 'new_member'];
        $statusCounts = [
            'active' => 0,
            'inactive' => 0,
            'visitor' => 0,
            'new_member' => 0,
        ];

        $updated = 0;

        foreach ($parishioners as $index => $user) {
            // Distribute statuses roughly:
            // 40% active, 25% inactive, 20% visitor, 15% new_member
            $status = $this->getStatusForUser($index, $parishioners->count());
            
            // Set membership date if not set (for new_member status, set recent date)
            if (!$user->membership_date) {
                if ($status === 'new_member') {
                    // New members: membership date within last 90 days
                    $user->membership_date = Carbon::now()->subDays(rand(1, 90))->format('Y-m-d');
                } else {
                    // Other statuses: membership date 6 months to 5 years ago
                    $user->membership_date = Carbon::now()->subDays(rand(180, 1825))->format('Y-m-d');
                }
            }

            // Set last_login_at if not set (for active users, set recent date)
            if (!$user->last_login_at) {
                if ($status === 'active') {
                    // Active users: last login within last 30 days
                    $user->last_login_at = Carbon::now()->subDays(rand(1, 30));
                } elseif ($status === 'inactive') {
                    // Inactive users: last login 60-120 days ago
                    $user->last_login_at = Carbon::now()->subDays(rand(60, 120));
                } elseif ($status === 'visitor') {
                    // Visitors: last login 30-90 days ago
                    $user->last_login_at = Carbon::now()->subDays(rand(30, 90));
                } else {
                    // New members: last login within last 60 days
                    $user->last_login_at = Carbon::now()->subDays(rand(1, 60));
                }
            }

            // Update membership status
            $user->membership_status = $status;
            $user->save();

            $statusCounts[$status]++;
            $updated++;
        }

        $this->command->info("Updated {$updated} users with membership statuses:");
        $this->command->info("  Active: {$statusCounts['active']}");
        $this->command->info("  Inactive: {$statusCounts['inactive']}");
        $this->command->info("  Visitor: {$statusCounts['visitor']}");
        $this->command->info("  New Member: {$statusCounts['new_member']}");
    }

    /**
     * Determine status based on user index to distribute evenly
     */
    private function getStatusForUser(int $index, int $total): string
    {
        $percentage = ($index + 1) / $total * 100;

        // 40% active
        if ($percentage <= 40) {
            return 'active';
        }
        // 25% inactive (40-65%)
        elseif ($percentage <= 65) {
            return 'inactive';
        }
        // 20% visitor (65-85%)
        elseif ($percentage <= 85) {
            return 'visitor';
        }
        // 15% new_member (85-100%)
        else {
            return 'new_member';
        }
    }
}

