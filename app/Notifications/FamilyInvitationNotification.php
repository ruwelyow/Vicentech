<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class FamilyInvitationNotification extends Notification
{
    use Queueable;

    protected $inviter;
    protected $relationship;
    protected $invitation;

    /**
     * Create a new notification instance.
     */
    public function __construct($inviter, $relationship, $invitation)
    {
        $this->inviter = $inviter;
        $this->relationship = $relationship;
        $this->invitation = $invitation;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'family_invitation',
            'message' => $this->inviter->name . ' has invited you to join their family group as ' . $this->relationship . '.',
            'inviter_id' => $this->inviter->id,
            'inviter_name' => $this->inviter->name,
            'relationship' => $this->relationship,
            'invitation_id' => $this->invitation->id,
        ];
    }
}
