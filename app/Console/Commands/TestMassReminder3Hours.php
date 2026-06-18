<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MassSchedule;
use App\Models\User;
use App\Notifications\MassReminder3HoursBeforeNotification;
use Illuminate\Support\Facades\Notification;
use Carbon\Carbon;

class TestMassReminder3Hours extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mass:test-3hour-reminder {--schedule-id= : The ID of the mass schedule to test} {--email= : Send to specific email address}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test sending a 3-hour-before mass reminder email';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $scheduleId = $this->option('schedule-id');
        $email = $this->option('email');

        // Set timezone to Asia/Manila
        $now = Carbon::now('Asia/Manila');
        $today = $now->format('l');

        if ($scheduleId) {
            $mass = MassSchedule::find($scheduleId);
            if (!$mass) {
                $this->error("Mass schedule with ID {$scheduleId} not found.");
                return 1;
            }
        } else {
            // Get first active mass for today
            $mass = MassSchedule::active()->where('day', $today)->first();
            if (!$mass) {
                $this->error("No active mass schedules found for today ({$today}).");
                $this->info("Available mass schedules:");
                $allMasses = MassSchedule::active()->get();
                foreach ($allMasses as $m) {
                    $this->line("  ID: {$m->id} - {$m->type} on {$m->day} at {$m->start_time}");
                }
                return 1;
            }
        }

        $this->info("Testing reminder for: {$mass->type} on {$mass->day} at {$mass->start_time}");

        // Calculate mass date/time
        $massDate = $now->copy();
        // Adjust to the correct day of the week if needed
        $dayOrder = ['Sunday' => 0, 'Monday' => 1, 'Tuesday' => 2, 'Wednesday' => 3, 'Thursday' => 4, 'Friday' => 5, 'Saturday' => 6];
        $targetDay = $dayOrder[$mass->day];
        $currentDay = $now->dayOfWeek;
        $daysToAdd = ($targetDay - $currentDay + 7) % 7;
        if ($daysToAdd > 0) {
            $massDate->addDays($daysToAdd);
        }
        $massDateTime = Carbon::parse($massDate->format('Y-m-d') . ' ' . $mass->start_time, 'Asia/Manila');

        $this->info("Mass will be on: {$massDateTime->format('l, F j, Y g:i A')}");
        $this->info("Reminder would be sent at: {$massDateTime->copy()->subHours(3)->format('l, F j, Y g:i A')}");

        // Get users
        if ($email) {
            $user = User::where('email', $email)->first();
            if (!$user) {
                $this->error("User with email {$email} not found.");
                return 1;
            }
            $users = collect([$user]);
        } else {
            $users = User::whereNotNull('email')
                ->where('email', '!=', '')
                ->where('email', 'REGEXP', '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
                ->limit(5) // Limit to 5 users for testing
                ->get();
            
            if ($users->isEmpty()) {
                $this->error('No users found with valid email addresses.');
                return 1;
            }
        }

        $this->info("Sending test reminder to {$users->count()} user(s)...");

        try {
            foreach ($users as $user) {
                $user->notify(new MassReminder3HoursBeforeNotification($mass, $massDateTime));
                $this->info("  ✓ Sent to: {$user->email} ({$user->name})");
            }
            
            $this->info("\n✓ Test reminder sent successfully!");
            $this->info("Check the email inbox(es) or logs to verify the email was sent.");
            
        } catch (\Exception $e) {
            $this->error("Failed to send test reminder: " . $e->getMessage());
            \Log::error("Test mass reminder failed: " . $e->getMessage());
            \Log::error("Stack trace: " . $e->getTraceAsString());
            return 1;
        }

        return 0;
    }
}

