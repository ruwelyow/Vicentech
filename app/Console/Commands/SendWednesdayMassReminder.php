<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MassSchedule;
use App\Models\User;
use App\Notifications\DailyMassReminderNotification;
use Illuminate\Support\Facades\Notification;
use Carbon\Carbon;

class SendWednesdayMassReminder extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mass:send-wednesday-reminder';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send mass reminder emails for Wednesday masses';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Checking for Wednesday mass schedules...');
        
        // Get all active mass schedules for Wednesday
        $wednesdayMasses = MassSchedule::active()->where('day', 'Wednesday')->get();

        if ($wednesdayMasses->isEmpty()) {
            $this->warn('❌ No active mass schedules found for Wednesday.');
            $this->info('💡 You can add a Wednesday mass schedule through the admin panel.');
            return 0;
        }

        $this->info('✅ Found ' . $wednesdayMasses->count() . ' active Wednesday mass(es):');
        foreach ($wednesdayMasses as $mass) {
            $this->line('   • ' . $mass->type . ' at ' . $mass->start_time . ' - ' . $mass->end_time . ' with ' . $mass->celebrant);
        }

        // Get all users with valid email addresses
        $users = User::whereNotNull('email')
            ->where('email', '!=', '')
            ->where('email', 'REGEXP', '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
            ->get();

        if ($users->isEmpty()) {
            $this->warn('❌ No users found with valid email addresses.');
            return 0;
        }

        $this->info('📧 Found ' . $users->count() . ' users to notify.');

        try {
            // Send daily mass reminder notification to all users
            $this->info('📤 Sending Wednesday mass reminder emails...');
            
            Notification::send($users, new DailyMassReminderNotification($wednesdayMasses));
            
            $this->info('✅ Wednesday mass reminder sent successfully!');
            $this->info('📊 Sent to ' . $users->count() . ' users for ' . $wednesdayMasses->count() . ' mass(es)');
            
            // Log the details
            \Log::info('Wednesday mass reminder sent successfully: ' . $wednesdayMasses->count() . ' mass(es) to ' . $users->count() . ' users');
            
            // Log individual mass details
            foreach ($wednesdayMasses as $mass) {
                \Log::info('Wednesday Mass: ' . $mass->type . ' at ' . $mass->start_time . ' - ' . $mass->end_time . ' with ' . $mass->celebrant);
            }
            
            $this->info('📝 Details logged successfully.');
            
        } catch (\Exception $e) {
            $this->error('❌ Failed to send Wednesday mass reminder emails: ' . $e->getMessage());
            \Log::error('Wednesday mass reminder failed: ' . $e->getMessage());
            \Log::error('Wednesday mass reminder stack trace: ' . $e->getTraceAsString());
            return 1;
        }

        $this->info('🎉 Wednesday mass reminder process completed!');
        return 0;
    }
}