<?php

namespace App\Notifications;

use App\Models\Donation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Services\DonationReceiptPdfService;

class DonationVerifiedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public Donation $donation;

    public function __construct(Donation $donation)
    {
        $this->donation = $donation;
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        // Refresh donation from database to ensure we have latest data (important for queued notifications)
        try {
            $this->donation->refresh();
        } catch (\Exception $e) {
            // If refresh fails, continue with existing data
            \Log::warning('Could not refresh donation in notification: ' . $e->getMessage());
        }
        
        $mail = (new MailMessage)
            ->subject('Your Donation Has Been Verified')
            ->view('emails.donation_verified', ['donation' => $this->donation]);

        // Attach PDF receipt
        try {
            $pdfService = app(DonationReceiptPdfService::class);
            $pdf = $pdfService->renderDonationReceipt($this->donation);
            
            if ($pdf && strlen($pdf) > 0) {
                $mail->attachData($pdf, 'donation-receipt-'.$this->donation->id.'.pdf', [
                    'mime' => 'application/pdf',
                ]);
                \Log::info('PDF receipt attached successfully for donation ID: ' . $this->donation->id . ', PDF size: ' . strlen($pdf) . ' bytes');
            } else {
                \Log::warning('PDF receipt is empty for donation ID: ' . $this->donation->id);
            }
        } catch (\Throwable $e) {
            \Log::error('Failed to attach donation receipt PDF for donation ID: ' . $this->donation->id, [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
        }

        return $mail;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'donation_verified',
            'message' => 'Your donation of ₱' . number_format((float)$this->donation->amount, 2) . ' has been verified. Thank you!',
            'amount' => $this->donation->amount,
            'reference' => $this->donation->reference,
            'category' => $this->donation->category,
            'donation_id' => $this->donation->id,
            'verified_at' => now()->toDateTimeString(),
        ];
    }
}