<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MassSchedule;
use App\Models\User;
use App\Notifications\NewMassScheduleNotification;
use App\Notifications\DailyMassReminderNotification;
use Illuminate\Support\Facades\Notification;

class TestMassScheduleEmailAllParishioners extends Command
{
    protected $signature = 'test:mass-schedule-all-parishioners {type=immediate}';
    protected $description = 'Send test mass schedule emails to ALL parishioners (immediate or daily)';

    public function handle()
    {
        $type = $this->argument('type'); // 'immediate' or 'daily'
        
        $this->info("📧 Sending test {$type} mass schedule email to ALL parishioners...");

        // Get ALL users with valid email addresses
        $users = User::whereNotNull('email')
                    ->where('email', '!=', '')
                    ->where('email', 'REGEXP', '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
                    ->get();

        if ($users->isEmpty()) {
            $this->error("❌ No parishioners with valid email addresses found.");
            return 1;
        }

        $this->info("📤 Found {$users->count()} parishioners to notify:");
        foreach ($users as $user) {
            $this->info("   • {$user->name} ({$user->email})");
        }

        if ($type === 'immediate') {
            // Test immediate notification
            $massSchedule = MassSchedule::latest()->first();
            if (!$massSchedule) {
                $this->error("❌ No mass schedules found. Please create a mass schedule first.");
                return 1;
            }

            $this->info("📅 Using mass schedule: {$massSchedule->type} on {$massSchedule->day}");

            try {
                $this->info("📤 Sending immediate notifications to ALL parishioners...");
                
                // Send notifications in batches to avoid timeout
                $batchSize = 5; // Send to 5 users at a time
                $batches = $users->chunk($batchSize);
                
                foreach ($batches as $batchIndex => $batch) {
                    $this->info("📧 Sending batch " . ($batchIndex + 1) . " to " . $batch->count() . " parishioners...");
                    
                    foreach ($batch as $user) {
                        $user->notify(new NewMassScheduleNotification($massSchedule));
                        $this->info("   ✅ Sent to {$user->name} ({$user->email})");
                    }
                    
                    // Small delay between batches
                    usleep(500000); // 0.5 second delay
                }
                
                $this->info("✅ All immediate notifications sent successfully!");
                
            } catch (\Exception $e) {
                $this->error("❌ Failed to send immediate notifications:");
                $this->error($e->getMessage());
                return 1;
            }

        } elseif ($type === 'daily') {
            // Test daily reminder
            $day = 'Wednesday'; // Use Wednesday since we have Wednesday masses
            $massSchedules = MassSchedule::where('day', $day)
                                        ->where('is_active', true)
                                        ->orderBy('start_time')
                                        ->get();

            if ($massSchedules->isEmpty()) {
                $this->error("❌ No active mass schedules found for {$day}.");
                return 1;
            }

            $this->info("📅 Found {$massSchedules->count()} mass schedule(s) for {$day}:");
            foreach ($massSchedules as $schedule) {
                $this->info("   • {$schedule->type} at {$schedule->start_time} - {$schedule->end_time} with {$schedule->celebrant}");
            }

            try {
                $this->info("📤 Sending daily reminders to ALL parishioners...");
                
                // Send notifications in batches to avoid timeout
                $batchSize = 5; // Send to 5 users at a time
                $batches = $users->chunk($batchSize);
                
                foreach ($batches as $batchIndex => $batch) {
                    $this->info("📧 Sending batch " . ($batchIndex + 1) . " to " . $batch->count() . " parishioners...");
                    
                    foreach ($batch as $user) {
                        $user->notify(new DailyMassReminderNotification($massSchedules));
                        $this->info("   ✅ Sent to {$user->name} ({$user->email})");
                    }
                    
                    // Small delay between batches
                    usleep(500000); // 0.5 second delay
                }
                
                $this->info("✅ All daily reminders sent successfully!");
                
            } catch (\Exception $e) {
                $this->error("❌ Failed to send daily reminders:");
                $this->error($e->getMessage());
                return 1;
            }
        } else {
            $this->error("❌ Invalid type. Use 'immediate' or 'daily'");
            return 1;
        }

        $this->info("📝 Check all parishioner email inboxes and spam folders!");
        $this->info("📊 Total emails sent: {$users->count()}");

        return 0;
    }
}
