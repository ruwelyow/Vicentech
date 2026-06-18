<?php

namespace App\Notifications;

use App\Models\MassSchedule;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DailyMassReminderNotification extends Notification
{
    use Queueable;

    protected $massSchedules;

    /**
     * Create a new notification instance.
     */
    public function __construct($massSchedules)
    {
        $this->massSchedules = $massSchedules;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $today = now()->format('l'); // e.g. 'Monday'
        
        return (new MailMessage)
            ->subject('Daily Mass Reminder - ' . $today)
            ->view('emails.daily_mass_reminder', [
                'massSchedules' => $this->massSchedules,
                'user' => $notifiable,
                'today' => $today
            ]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $today = now()->format('l');
        $scheduleCount = $this->massSchedules->count();
        
        return [
            'type' => 'daily_mass_reminder',
            'day' => $today,
            'mass_count' => $scheduleCount,
            'message' => "Daily mass reminder for {$today}. {$scheduleCount} mass(es) scheduled today.",
            'schedules' => $this->massSchedules->map(function($schedule) {
                return [
                    'id' => $schedule->id,
                    'type' => $schedule->type,
                    'time' => $schedule->start_time,
                    'end_time' => $schedule->end_time,
                    'celebrant' => $schedule->celebrant
                ];
            })->toArray()
        ];
    }
}
