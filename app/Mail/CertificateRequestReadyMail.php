<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\CertificateRequest;

class CertificateRequestReadyMail extends Mailable
{
    use Queueable, SerializesModels;

    public $certificateRequest;

    /**
     * Create a new message instance.
     */
    public function __construct(CertificateRequest $certificateRequest)
    {
        $this->certificateRequest = $certificateRequest;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Certificate is Ready for Collection',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        // Create a mock certificateRelease object structure for the template
        $mockCertificateRelease = (object) [
            'recipient_name' => $this->certificateRequest->first_name . ' ' . $this->certificateRequest->last_name,
            'certificate_date' => $this->certificateRequest->date_needed ?? $this->certificateRequest->created_at,
            'priest_name' => 'Parish Priest', // Default or can be fetched from config
            'unique_reference' => 'CR-' . str_pad($this->certificateRequest->id, 6, '0', STR_PAD_LEFT),
        ];

        return new Content(
            view: 'emails.certificate_ready',
            with: [
                'certificateRelease' => $mockCertificateRelease,
                'recipientName' => $this->certificateRequest->first_name . ' ' . $this->certificateRequest->last_name,
                'certificateType' => ucfirst(str_replace('_', ' ', $this->certificateRequest->certificate_type)),
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

