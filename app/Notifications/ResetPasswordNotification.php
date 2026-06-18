<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public $token; // <-- must be public

    /**
     * Create a new notification instance.
     */
    public function __construct($token)
    {
        $this->token = $token;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable)
    {
        $url = url('/reset-password?token=' . $this->token . '&email=' . urlencode($notifiable->getEmailForPasswordReset()));

        return (new \Illuminate\Mail\Mailable)
            ->to($notifiable->getEmailForPasswordReset())
            ->subject('Password Reset Request - Parish Community')
            ->view('emails.password_reset')
            ->with([
                'userName' => $notifiable->name ?? 'User',
                'userEmail' => $notifiable->getEmailForPasswordReset(),
                'resetUrl' => $url,
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
            //
        ];
    }
}
