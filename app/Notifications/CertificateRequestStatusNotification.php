<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CertificateRequestStatusNotification extends Notification
{
    use Queueable;

    public $certificateRequest;
    public $status;

    /**
     * Create a new notification instance.
     */
    public function __construct($certificateRequest, $status)
    {
        $this->certificateRequest = $certificateRequest;
        $this->status = $status;
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
            ->subject('Certificate Request ' . ucfirst($this->status))
            ->view('emails.certificate_request_status', [
                'certificateRequest' => $this->certificateRequest,
                'status' => $this->status
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
            'message' => "Your certificate request for {$this->certificateRequest->certificate_type} has been {$this->status}.",
            'status' => $this->status,
            'certificate_request_id' => $this->certificateRequest->id,
        ];
    }
}
