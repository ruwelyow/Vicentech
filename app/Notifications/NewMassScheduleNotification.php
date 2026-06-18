<?php

namespace App\Notifications;

use App\Models\MassSchedule;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewMassScheduleNotification extends Notification
{
    use Queueable;

    protected $massSchedule;

    /**
     * Create a new notification instance.
     */
    public function __construct(MassSchedule $massSchedule)
    {
        $this->massSchedule = $massSchedule;
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
        return (new MailMessage)
            ->subject('New Mass Schedule: ' . $this->massSchedule->type . ' on ' . $this->massSchedule->day)
            ->view('emails.new_mass_schedule', [
                'massSchedule' => $this->massSchedule,
                'user' => $notifiable
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
            'mass_schedule_id' => $this->massSchedule->id,
            'mass_type' => $this->massSchedule->type,
            'mass_day' => $this->massSchedule->day,
            'mass_time' => $this->massSchedule->time,
            'mass_start_time' => $this->massSchedule->start_time,
            'mass_end_time' => $this->massSchedule->end_time,
            'celebrant' => $this->massSchedule->celebrant,
            'message' => 'A new mass schedule "' . $this->massSchedule->type . '" has been scheduled for ' . $this->massSchedule->day . ' at ' . $this->massSchedule->time . ' with ' . $this->massSchedule->celebrant,
        ];
    }
}