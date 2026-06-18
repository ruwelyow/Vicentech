<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MassSchedule;
use App\Models\User;
use App\Notifications\DailyMassReminderNotification;
use Illuminate\Support\Facades\Notification;
use Carbon\Carbon;

class SendMassScheduleEmails extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mass:send-schedule-emails';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send daily mass reminder emails at 3:00 AM for today\'s active mass schedules';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = Carbon::now()->format('l'); // e.g. 'Monday'
        $now = Carbon::now();
        
        // Get all active mass schedules for today
        $masses = MassSchedule::active()->where('day', $today)->get();

        if ($masses->isEmpty()) {
            $this->info('No active mass schedules for today (' . $today . '). No emails will be sent.');
            \Log::info('Daily mass reminder: No active mass schedules for ' . $today);
            return 0;
        }

        // Get all users with valid email addresses
        $users = User::whereNotNull('email')
            ->where('email', '!=', '')
            ->where('email', 'REGEXP', '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
            ->get();

        if ($users->isEmpty()) {
            $this->info('No users to notify.');
            \Log::info('Daily mass reminder: No users found with valid email addresses');
            return 0;
        }

        try {
            // Send daily mass reminder notification to all users
            Notification::send($users, new DailyMassReminderNotification($masses));
            
            $this->info('Daily mass reminder sent to ' . $users->count() . ' users for ' . $masses->count() . ' mass(es) on ' . $today);
            \Log::info('Daily mass reminder sent successfully: ' . $masses->count() . ' mass(es) on ' . $today . ' to ' . $users->count() . ' users');
            
            // Log individual mass details
            foreach ($masses as $mass) {
                \Log::info('Mass scheduled: ' . $mass->type . ' at ' . $mass->start_time . ' - ' . $mass->end_time . ' with ' . $mass->celebrant);
            }
            
        } catch (\Exception $e) {
            $this->error('Failed to send daily mass reminder emails: ' . $e->getMessage());
            \Log::error('Daily mass reminder failed: ' . $e->getMessage());
            \Log::error('Daily mass reminder stack trace: ' . $e->getTraceAsString());
            return 1;
        }

        return 0;
    }
}
