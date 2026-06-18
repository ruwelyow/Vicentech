<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MassSchedule;
use App\Models\User;
use App\Notifications\DailyMassReminderNotification;
use Illuminate\Support\Facades\Notification;
use Carbon\Carbon;

class TestDailyMassReminderEmail extends Command
{
    protected $signature = 'test:daily-mass-reminder {day?}';
    protected $description = 'Send a test daily mass reminder email for a specific day';

    public function handle()
    {
        $day = $this->argument('day') ?: Carbon::now()->format('l');
        
        $this->info("📧 Sending test daily mass reminder for: {$day}");

        // Get active mass schedules for the specified day
        $massSchedules = MassSchedule::where('day', $day)
                                    ->where('is_active', true)
                                    ->orderBy('start_time')
                                    ->get();

        if ($massSchedules->isEmpty()) {
            $this->error("No active mass schedules found for {$day}.");
            $this->info("Available days with mass schedules:");
            $availableDays = MassSchedule::where('is_active', true)
                                        ->distinct()
                                        ->pluck('day')
                                        ->toArray();
            foreach ($availableDays as $availableDay) {
                $this->info("   • {$availableDay}");
            }
            return 1;
        }

        $this->info("📅 Found {$massSchedules->count()} mass schedule(s) for {$day}:");
        foreach ($massSchedules as $schedule) {
            $this->info("   • {$schedule->type} at {$schedule->start_time} - {$schedule->end_time} with {$schedule->celebrant}");
        }

        // Get a test user (first user with email)
        $testUser = User::whereNotNull('email')
                        ->where('email', '!=', '')
                        ->where('email', 'REGEXP', '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
                        ->first();

        if (!$testUser) {
            $this->error("No users with valid email addresses found.");
            return 1;
        }

        $this->info("📤 Sending test daily reminder email to: {$testUser->email}");

        try {
            // Send the notification
            $testUser->notify(new DailyMassReminderNotification($massSchedules));
            
            $this->info("✅ Test daily reminder email sent successfully!");
            $this->info("📝 Check the email logs or your email inbox for the test message.");
            
        } catch (\Exception $e) {
            $this->error("❌ Failed to send test daily reminder email:");
            $this->error($e->getMessage());
            return 1;
        }

        return 0;
    }
}
