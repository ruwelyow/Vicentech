<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Donation;
use App\Services\DonationReceiptPdfService;

echo "=== COMPARING PDFs WITH AND WITHOUT RECEIPT IMAGES ===\n\n";

// Find donations with and without receipts
$donationWithReceipt = Donation::whereNotNull('receipt_path')->first();
$donationWithoutReceipt = Donation::whereNull('receipt_path')->first();

if (!$donationWithReceipt) {
    echo "No donations with receipts found.\n";
    exit;
}

if (!$donationWithoutReceipt) {
    echo "No donations without receipts found.\n";
    exit;
}

echo "Testing donation WITH receipt (ID: " . $donationWithReceipt->id . "):\n";
echo "- Receipt path: " . $donationWithReceipt->receipt_path . "\n";

try {
    $pdfService = new DonationReceiptPdfService();
    $pdfWithReceipt = $pdfService->renderDonationReceipt($donationWithReceipt);
    
    $filename1 = 'test-with-receipt-' . $donationWithReceipt->id . '.pdf';
    file_put_contents($filename1, $pdfWithReceipt);
    echo "- PDF generated: " . $filename1 . " (" . strlen($pdfWithReceipt) . " bytes)\n";
    
} catch (Exception $e) {
    echo "- Error: " . $e->getMessage() . "\n";
}

echo "\nTesting donation WITHOUT receipt (ID: " . $donationWithoutReceipt->id . "):\n";

try {
    $pdfService = new DonationReceiptPdfService();
    $pdfWithoutReceipt = $pdfService->renderDonationReceipt($donationWithoutReceipt);
    
    $filename2 = 'test-without-receipt-' . $donationWithoutReceipt->id . '.pdf';
    file_put_contents($filename2, $pdfWithoutReceipt);
    echo "- PDF generated: " . $filename2 . " (" . strlen($pdfWithoutReceipt) . " bytes)\n";
    
} catch (Exception $e) {
    echo "- Error: " . $e->getMessage() . "\n";
}

echo "\n=== COMPARISON COMPLETE ===\n";
echo "Please check both PDFs to see if the image appears in the first one.\n";
