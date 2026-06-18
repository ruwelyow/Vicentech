<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MassSchedule;
use App\Models\User;
use App\Notifications\MassReminder3HoursBeforeNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class SendMassReminder3HoursBefore extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mass:send-3hour-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send mass reminder emails 3 hours before each scheduled mass time';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Set timezone to Asia/Manila
        $now = Carbon::now('Asia/Manila');
        $today = $now->format('l'); // e.g. 'Monday'
        
        $this->info("Checking for masses on {$today} at {$now->format('Y-m-d H:i:s')} (Asia/Manila)");
        
        // Get all active mass schedules for today
        $masses = MassSchedule::active()->where('day', $today)->get();

        if ($masses->isEmpty()) {
            $this->info('No active mass schedules for today (' . $today . ').');
            \Log::info('Mass 3-hour reminder: No active mass schedules for ' . $today);
            return 0;
        }

        // Get all users with valid email addresses
        $users = User::whereNotNull('email')
            ->where('email', '!=', '')
            ->where('email', 'REGEXP', '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
            ->get();

        if ($users->isEmpty()) {
            $this->info('No users to notify.');
            \Log::info('Mass 3-hour reminder: No users found with valid email addresses');
            return 0;
        }

        $remindersSent = 0;
        $todayDate = $now->format('Y-m-d');

        foreach ($masses as $mass) {
            // Parse the mass start time
            $massTime = Carbon::parse($todayDate . ' ' . $mass->start_time, 'Asia/Manila');
            
            // Calculate 3 hours before the mass time
            $reminderTime = $massTime->copy()->subHours(3);
            
            // Check if current time is within the reminder window (within 15 minutes of the 3-hour mark)
            // This allows for the command running every 15 minutes
            $timeDifference = abs($now->diffInMinutes($reminderTime));
            
            if ($timeDifference <= 15) {
                // Create a unique cache key for this mass reminder
                $cacheKey = "mass_reminder_{$mass->id}_{$todayDate}";
                
                // Check if we've already sent this reminder
                if (!Cache::has($cacheKey)) {
                    try {
                        // Send reminder notification to all users
                        Notification::send($users, new MassReminder3HoursBeforeNotification($mass, $massTime));
                        
                        // Mark as sent in cache (expires after 24 hours to be safe)
                        Cache::put($cacheKey, true, now()->addHours(24));
                        
                        $remindersSent++;
                        $this->info("✓ Reminder sent for {$mass->type} at {$massTime->format('g:i A')} (reminder sent at {$now->format('g:i A')})");
                        \Log::info("Mass 3-hour reminder sent: {$mass->type} at {$massTime->format('g:i A')} to {$users->count()} users");
                        
                    } catch (\Exception $e) {
                        $this->error("Failed to send reminder for {$mass->type}: " . $e->getMessage());
                        \Log::error("Mass 3-hour reminder failed for {$mass->type}: " . $e->getMessage());
                        \Log::error("Stack trace: " . $e->getTraceAsString());
                    }
                } else {
                    $this->info("Reminder already sent for {$mass->type} at {$massTime->format('g:i A')}");
                }
            } else {
                // Log when the reminder will be sent (for debugging)
                if ($now->lt($reminderTime)) {
                    $minutesUntilReminder = $now->diffInMinutes($reminderTime);
                    $this->line("  - {$mass->type} at {$massTime->format('g:i A')}: Reminder will be sent in {$minutesUntilReminder} minutes");
                } else {
                    $minutesPastReminder = $now->diffInMinutes($reminderTime);
                    $this->line("  - {$mass->type} at {$massTime->format('g:i A')}: Reminder time passed {$minutesPastReminder} minutes ago");
                }
            }
        }

        if ($remindersSent > 0) {
            $this->info("Successfully sent {$remindersSent} reminder(s) to {$users->count()} users.");
        } else {
            $this->info("No reminders to send at this time.");
        }

        return 0;
    }
}

