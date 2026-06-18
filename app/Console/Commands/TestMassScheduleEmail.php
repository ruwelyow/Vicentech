<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MassSchedule;
use App\Models\User;
use App\Notifications\NewMassScheduleNotification;
use Illuminate\Support\Facades\Notification;

class TestMassScheduleEmail extends Command
{
    protected $signature = 'test:mass-schedule-email {mass_schedule_id?}';
    protected $description = 'Send a test email for mass schedule notification';

    public function handle()
    {
        $massScheduleId = $this->argument('mass_schedule_id');
        
        if ($massScheduleId) {
            $massSchedule = MassSchedule::find($massScheduleId);
            if (!$massSchedule) {
                $this->error("Mass schedule with ID {$massScheduleId} not found.");
                return 1;
            }
        } else {
            // Get the latest mass schedule
            $massSchedule = MassSchedule::latest()->first();
            if (!$massSchedule) {
                $this->error("No mass schedules found. Please create a mass schedule first.");
                return 1;
            }
        }

        $this->info("📧 Sending test email for mass schedule:");
        $this->info("   • ID: {$massSchedule->id}");
        $this->info("   • Type: {$massSchedule->type}");
        $this->info("   • Day: {$massSchedule->day}");
        $this->info("   • Time: {$massSchedule->start_time} - {$massSchedule->end_time}");
        $this->info("   • Celebrant: {$massSchedule->celebrant}");

        // Get a test user (first user with email)
        $testUser = User::whereNotNull('email')
                        ->where('email', '!=', '')
                        ->where('email', 'REGEXP', '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
                        ->first();

        if (!$testUser) {
            $this->error("No users with valid email addresses found.");
            return 1;
        }

        $this->info("📤 Sending test email to: {$testUser->email}");

        try {
            // Send the notification
            $testUser->notify(new NewMassScheduleNotification($massSchedule));
            
            $this->info("✅ Test email sent successfully!");
            $this->info("📝 Check the email logs or your email inbox for the test message.");
            
        } catch (\Exception $e) {
            $this->error("❌ Failed to send test email:");
            $this->error($e->getMessage());
            return 1;
        }

        return 0;
    }
}
