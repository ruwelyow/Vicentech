<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use App\Models\MassSchedule;
use App\Notifications\NewMassScheduleNotification;

class TestMultipleEmails extends Command
{
    protected $signature = 'test:multiple-emails';
    protected $description = 'Test sending emails to multiple users';

    public function handle()
    {
        $this->info("🔧 Testing email system with multiple recipients...");
        
        // Create a test mass schedule
        $massSchedule = MassSchedule::create([
            'day' => 'Sunday',
            'time' => '21:00',
            'start_time' => '21:00',
            'end_time' => '22:00',
            'type' => 'Test Multiple Emails',
            'celebrant' => 'Rev. Fr. Test Multiple',
            'is_active' => true
        ]);

        $this->info("📅 Created test mass schedule: ID {$massSchedule->id}");

        // Get multiple test users
        $testUsers = User::whereNotNull('email')
                        ->where('email', '!=', '')
                        ->where('email', 'REGEXP', '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
                        ->limit(3)
                        ->get();

        if ($testUsers->isEmpty()) {
            $this->error("❌ No users with valid email addresses found.");
            return 1;
        }

        $this->info("📤 Testing with {$testUsers->count()} users:");

        foreach ($testUsers as $user) {
            $this->info("   • {$user->email}");
        }

        try {
            // Test 1: Send basic emails to all users
            $this->info("📧 Test 1: Sending basic emails to all users...");
            
            foreach ($testUsers as $user) {
                Mail::raw("Test email for mass schedule: {$massSchedule->type} on {$massSchedule->day}. This email was sent to test the email system.", function ($message) use ($user, $massSchedule) {
                    $message->to($user->email)
                            ->subject("Test Email - {$massSchedule->type} on {$massSchedule->day}");
                });
                $this->info("   ✅ Basic email sent to {$user->email}");
            }

            // Test 2: Send notification emails to all users
            $this->info("📧 Test 2: Sending notification emails to all users...");
            
            foreach ($testUsers as $user) {
                $user->notify(new NewMassScheduleNotification($massSchedule));
                $this->info("   ✅ Notification email sent to {$user->email}");
            }
            
            $this->info("✅ All test emails sent successfully!");
            
        } catch (\Exception $e) {
            $this->error("❌ Failed to send test emails:");
            $this->error($e->getMessage());
            return 1;
        }

        $this->info("📝 Please check email inboxes and spam folders for:");
        $this->info("   • Test Email - {$massSchedule->type} on {$massSchedule->day}");
        $this->info("   • New Mass Schedule: {$massSchedule->type}");

        // Clean up
        $massSchedule->delete();
        $this->info("🧹 Test mass schedule cleaned up.");

        return 0;
    }
}
