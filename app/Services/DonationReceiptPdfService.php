<?php

namespace App\Services;

use App\Models\Donation;
use TCPDF;
use Illuminate\Support\Facades\View;

class DonationReceiptPdfService
{
    public function renderDonationReceipt(Donation $donation): string
    {
        // Render the modern blade template to HTML
        $html = View::make('pdf.donation_receipt_modern', [
            'donation' => $donation
        ])->render();
        
        // Create PDF from HTML
        $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
        
        // Set document information
        $pdf->SetCreator('DS-San Vicente Ferrer');
        $pdf->SetAuthor('Diocesan Shrine of San Vicente Ferrer');
        $pdf->SetTitle('Donation Receipt');
        $pdf->SetSubject('Donation Receipt');
        
        // Remove default header/footer
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        
        // Set margins - minimal margins to maximize space
        $pdf->SetMargins(5, 5, 5);
        $pdf->SetAutoPageBreak(false, 0); // Disable auto page break to fit on one page
        
        // Add a page
        $pdf->AddPage();
        
        // Set font for better Unicode support
        $pdf->SetFont('dejavusans', '', 10);
        
        // Write HTML content - set to fit on one page
        $pdf->writeHTML($html, true, false, true, false, '');
        
        // Close and output PDF document
        return $pdf->Output('receipt.pdf', 'S');
    }
}


