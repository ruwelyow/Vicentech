<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use App\Models\User;

class TestEmailSystem extends Command
{
    protected $signature = 'test:email-system';
    protected $description = 'Test the email system configuration';

    public function handle()
    {
        $this->info("🔧 Testing email system configuration...");
        
        // Check mail configuration
        $mailDriver = config('mail.default');
        $mailHost = config('mail.mailers.smtp.host');
        $mailUsername = config('mail.mailers.smtp.username');
        
        $this->info("📧 Mail Driver: {$mailDriver}");
        $this->info("📧 SMTP Host: {$mailHost}");
        $this->info("📧 SMTP Username: {$mailUsername}");
        
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
            // Test basic email sending
            $this->info("📧 Sending test email...");
            
            Mail::raw('This is a test email from the Laravel application. If you receive this, the email system is working correctly.', function ($message) use ($testUser) {
                $message->to($testUser->email)
                        ->subject('Test Email - Laravel Email System');
            });
            
            $this->info("✅ Test email sent successfully!");
            $this->info("📝 Please check your email inbox and spam folder.");
            
        } catch (\Exception $e) {
            $this->error("❌ Failed to send test email:");
            $this->error($e->getMessage());
            $this->error("Stack trace:");
            $this->error($e->getTraceAsString());
            return 1;
        }

        return 0;
    }
}
