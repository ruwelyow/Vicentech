<?php

namespace App\Notifications;

use App\Models\PrayerRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PrayerRequestUpdated extends Notification
{
    use Queueable;

    protected $prayerRequest;

    /**
     * Create a new notification instance.
     */
    public function __construct(PrayerRequest $prayerRequest)
    {
        $this->prayerRequest = $prayerRequest;
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
            ->subject('Prayer Request ' . ucfirst($this->prayerRequest->status))
            ->view('emails.prayer_request_status', [
                'prayerRequest' => $this->prayerRequest,
                'status' => $this->prayerRequest->status
            ]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $status = $this->prayerRequest->status;
        $message = "Your prayer request has been {$status}.";
        
        return [
            'prayer_request_id' => $this->prayerRequest->id,
            'request_text' => $this->prayerRequest->request,
            'status' => $status,
            'message' => $message,
        ];
    }
}
