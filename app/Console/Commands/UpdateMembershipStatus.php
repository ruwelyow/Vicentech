<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\MembershipStatusService;

class UpdateMembershipStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'membership:update-status {--user= : Update specific user by ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'DEPRECATED: Auto-update functionality has been removed. Use MembershipStatusSeeder to set sample data.';

    protected $membershipService;

    public function __construct(MembershipStatusService $membershipService)
    {
        parent::__construct();
        $this->membershipService = $membershipService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->warn('This command has been disabled. Auto-update functionality has been removed.');
        $this->info('To set sample membership statuses, run: php artisan db:seed --class=MembershipStatusSeeder');
        $this->info('Membership statuses are now manually managed through the admin interface.');
        
        // Show current statistics
        $stats = $this->membershipService->getMembershipStatistics();
        $this->table(
            ['Status', 'Count'],
            [
                ['Total', $stats['total']],
                ['Active', $stats['active']],
                ['Inactive', $stats['inactive']],
                ['Visitor', $stats['visitor']],
                ['New Member', $stats['new_member']],
            ]
        );
        
        return 0;
    }
}
