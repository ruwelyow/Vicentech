<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\CertificateRelease;

class CertificateReadyMail extends Mailable
{
    use Queueable, SerializesModels;

    public $certificateRelease;

    /**
     * Create a new message instance.
     */
    public function __construct(CertificateRelease $certificateRelease)
    {
        $this->certificateRelease = $certificateRelease;
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
        return new Content(
            view: 'emails.certificate_ready',
            with: [
                'certificateRelease' => $this->certificateRelease,
                'recipientName' => $this->certificateRelease->recipient_name,
                'certificateType' => ucfirst(str_replace('_', ' ', $this->certificateRelease->certificate_type)),
                'certificateDate' => $this->certificateRelease->certificate_date,
                'uniqueReference' => $this->certificateRelease->unique_reference,
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
