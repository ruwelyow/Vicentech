<?php

namespace App\Notifications;

use App\Models\MassSchedule;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Carbon\Carbon;

class MassReminder3HoursBeforeNotification extends Notification
{
    use Queueable;

    protected $massSchedule;
    protected $massDateTime;

    /**
     * Create a new notification instance.
     */
    public function __construct(MassSchedule $massSchedule, Carbon $massDateTime)
    {
        $this->massSchedule = $massSchedule;
        $this->massDateTime = $massDateTime;
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
        $massTime = $this->massDateTime->format('g:i A');
        $massDate = $this->massDateTime->format('l, F j, Y');
        
        return (new MailMessage)
            ->subject('Mass Reminder: ' . $this->massSchedule->type . ' in 3 Hours')
            ->view('emails.mass_reminder_3hours', [
                'massSchedule' => $this->massSchedule,
                'massDateTime' => $this->massDateTime,
                'user' => $notifiable,
                'massTime' => $massTime,
                'massDate' => $massDate
            ]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'mass_reminder_3hours',
            'mass_schedule_id' => $this->massSchedule->id,
            'mass_type' => $this->massSchedule->type,
            'mass_time' => $this->massDateTime->format('g:i A'),
            'mass_date' => $this->massDateTime->format('Y-m-d'),
            'celebrant' => $this->massSchedule->celebrant,
            'message' => "Mass reminder: {$this->massSchedule->type} at {$this->massDateTime->format('g:i A')} in 3 hours.",
        ];
    }
}

