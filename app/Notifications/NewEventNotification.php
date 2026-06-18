<?php

namespace App\Notifications;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewEventNotification extends Notification
{
    use Queueable;

    protected $event;

    /**
     * Create a new notification instance.
     */
    public function __construct(Event $event)
    {
        $this->event = $event;
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
        $mailMessage = (new MailMessage)
            ->subject('New Event: ' . $this->event->title)
            ->view('emails.new_event', [
                'event' => $this->event,
                'user' => $notifiable
            ]);

        // If event has image data, attach it as CID for better email client compatibility
        if ($this->event->image_data && $this->event->image_mime) {
            $imageData = base64_decode($this->event->image_data);
            $mailMessage->attachData($imageData, 'event-image', [
                'mime' => $this->event->image_mime,
                'as' => 'event-image.' . $this->getImageExtension($this->event->image_mime)
            ]);
        }

        return $mailMessage;
    }

    /**
     * Get file extension from mime type
     */
    private function getImageExtension($mimeType)
    {
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp'
        ];

        return $extensions[$mimeType] ?? 'jpg';
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'event_id' => $this->event->id,
            'event_title' => $this->event->title,
            'event_date' => $this->event->date,
            'event_time' => $this->event->time,
            'event_location' => $this->event->location,
            'message' => 'A new event "' . $this->event->title . '" has been scheduled for ' . $this->event->date . ' at ' . $this->event->time,
        ];
    }
}
