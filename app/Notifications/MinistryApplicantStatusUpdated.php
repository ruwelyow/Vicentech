<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\MinistryApplicant;

class MinistryApplicantStatusUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    public $applicant;

    public function __construct(MinistryApplicant $applicant)
    {
        $this->applicant = $applicant;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable)
    {
        return (new \Illuminate\Notifications\Messages\MailMessage)
            ->subject('Ministry Application ' . ucfirst($this->applicant->status ?? 'Update'))
            ->view('emails.ministry_application_status', [
                'applicant' => $this->applicant,
                'status' => $this->applicant->status ?? 'pending'
            ]);
    }

    public function toDatabase($notifiable)
    {
        return [
            'applicant_id' => $this->applicant->id,
            'first_name' => $this->applicant->first_name ?? 'N/A',
            'last_name' => $this->applicant->last_name ?? 'N/A',
            'status' => $this->applicant->status ?? 'pending',
            'message' => 'Your ministry application status has been updated to: ' . ucfirst($this->applicant->status ?? 'pending') . '.',
        ];
    }
} 