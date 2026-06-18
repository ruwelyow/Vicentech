<?php

namespace App\Jobs;

use App\Models\Event;
use App\Models\User;
use App\Notifications\NewEventNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log;

class SendEventNotificationJob implements ShouldQueue
{
    use Queueable;

    protected $event;

    /**
     * Create a new job instance.
     */
    public function __construct(Event $event)
    {
        $this->event = $event;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Get all users with valid email addresses
            $users = User::whereNotNull('email')
                        ->where('email', '!=', '')
                        ->where('email', 'REGEXP', '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
                        ->get();
            
            if ($users->isEmpty()) {
                Log::info('No users found to notify about event: ' . $this->event->title);
                return;
            }
            
            Log::info('Sending notifications to ' . $users->count() . ' users for event: ' . $this->event->title);
            
            // Send notification to all users
            Notification::send($users, new NewEventNotification($this->event));
            
            Log::info('Notifications sent successfully for event: ' . $this->event->title);
            
        } catch (\Exception $e) {
            Log::error('Failed to send notifications for event: ' . $this->event->title);
            Log::error('Notification error: ' . $e->getMessage());
            Log::error('Notification stack trace: ' . $e->getTraceAsString());
            
            // Don't fail the job, just log the error
            // This prevents the job from being retried indefinitely
        }
    }
}
