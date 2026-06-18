<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use App\Models\MassSchedule;
use App\Notifications\NewMassScheduleNotification;
use Illuminate\Support\Facades\Notification;

class TestMassScheduleEmailDetailed extends Command
{
    protected $signature = 'test:mass-email-detailed';
    protected $description = 'Test mass schedule email with detailed logging';

    public function handle()
    {
        $this->info("🔧 Testing mass schedule email system with detailed logging...");
        
        // Create a test mass schedule
        $massSchedule = MassSchedule::create([
            'day' => 'Saturday',
            'time' => '20:00',
            'start_time' => '20:00',
            'end_time' => '21:00',
            'type' => 'Test Mass Email Detailed',
            'celebrant' => 'Rev. Fr. Test Detailed',
            'is_active' => true
        ]);

        $this->info("📅 Created test mass schedule: ID {$massSchedule->id}");

        // Get test user
        $testUser = User::whereNotNull('email')
                        ->where('email', '!=', '')
                        ->where('email', 'REGEXP', '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
                        ->first();

        if (!$testUser) {
            $this->error("❌ No users with valid email addresses found.");
            return 1;
        }

        $this->info("📤 Test user: {$testUser->email}");

        try {
            // Test 1: Basic Mail facade
            $this->info("📧 Test 1: Sending basic email...");
            
            Mail::raw("Test basic email for mass schedule: {$massSchedule->type} on {$massSchedule->day}", function ($message) use ($testUser, $massSchedule) {
                $message->to($testUser->email)
                        ->subject("Basic Test - {$massSchedule->type} on {$massSchedule->day}");
            });
            
            $this->info("✅ Basic email sent successfully!");

            // Test 2: Notification system
            $this->info("📧 Test 2: Sending notification email...");
            
            $testUser->notify(new NewMassScheduleNotification($massSchedule));
            
            $this->info("✅ Notification email sent successfully!");

            // Test 3: Check if notification was queued
            $this->info("📧 Test 3: Checking notification queue...");
            
            // Log the notification attempt
            \Log::info("Test notification sent to {$testUser->email} for mass schedule {$massSchedule->id}");
            
            $this->info("✅ Notification logged successfully!");
            
        } catch (\Exception $e) {
            $this->error("❌ Failed to send test email:");
            $this->error($e->getMessage());
            $this->error("Stack trace:");
            $this->error($e->getTraceAsString());
            return 1;
        }

        $this->info("📝 Please check your email inbox and spam folder for:");
        $this->info("   • Basic Test - {$massSchedule->type} on {$massSchedule->day}");
        $this->info("   • New Mass Schedule: {$massSchedule->type}");

        // Clean up
        $massSchedule->delete();
        $this->info("🧹 Test mass schedule cleaned up.");

        return 0;
    }
}
