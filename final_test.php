<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Donation;
use App\Services\DonationReceiptPdfService;

echo "=== FINAL TEST: DONATION RECEIPT PDF WITH UPLOADED IMAGE ===\n\n";

// Find a donation with a receipt
$donation = Donation::whereNotNull('receipt_path')->first();

if (!$donation) {
    echo "No donations with receipts found.\n";
    exit;
}

echo "Testing donation with receipt:\n";
echo "- ID: " . $donation->id . "\n";
echo "- Receipt path: " . $donation->receipt_path . "\n";

// Verify file exists
$receiptFsPath = public_path(ltrim($donation->receipt_path, '/'));
echo "- File exists: " . (file_exists($receiptFsPath) ? 'YES' : 'NO') . "\n";

if (file_exists($receiptFsPath)) {
    $imageInfo = getimagesize($receiptFsPath);
    echo "- Image dimensions: " . $imageInfo[0] . "x" . $imageInfo[1] . "\n";
}

// Generate PDF
try {
    $pdfService = new DonationReceiptPdfService();
    $pdfContent = $pdfService->renderDonationReceipt($donation);
    
    echo "\nPDF generated successfully!\n";
    echo "PDF size: " . strlen($pdfContent) . " bytes\n";
    
    // Save PDF
    $filename = 'final-test-receipt-' . $donation->id . '.pdf';
    file_put_contents($filename, $pdfContent);
    echo "PDF saved as: " . $filename . "\n";
    
    echo "\n✅ SUCCESS: Uploaded receipt image should now be visible in the PDF!\n";
    echo "Please open the PDF file to verify the image appears.\n";
    
} catch (Exception $e) {
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
}

echo "\n=== TEST COMPLETE ===\n";
