<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Helpers\SacramentRequirementsHelper;

class SacramentAppointmentStatusNotification extends Notification
{
    use Queueable;

    public $appointment;
    public $status;

    /**
     * Create a new notification instance.
     */
    public function __construct($appointment, $status)
    {
        $this->appointment = $appointment;
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
        $sacramentTypeName = $this->appointment->sacramentType ? $this->appointment->sacramentType->name : 'Sacrament';
        $requirements = $this->status === 'approved' 
            ? SacramentRequirementsHelper::getRequirements($sacramentTypeName)
            : [];
        
        return (new MailMessage)
            ->subject('Sacrament Appointment ' . ucfirst($this->status))
            ->view('emails.sacrament_appointment_status', [
                'appointment' => $this->appointment,
                'status' => $this->status,
                'requirements' => $requirements
            ]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $sacramentType = $this->appointment->sacramentType ? $this->appointment->sacramentType->name : 'Sacrament';
        $requirements = $this->status === 'approved' 
            ? SacramentRequirementsHelper::getRequirements($sacramentType)
            : [];
        
        return [
            'type' => 'sacrament',
            'message' => "Your {$sacramentType} appointment has been {$this->status}.",
            'status' => $this->status,
            'appointment_id' => $this->appointment->id,
            'sacrament_type' => $sacramentType,
            'appointment_date' => $this->appointment->date,
            'requirements' => $requirements,
        ];
    }
}