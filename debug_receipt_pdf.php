<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Donation;
use App\Services\DonationReceiptPdfService;

echo "=== DEBUGGING DONATION RECEIPT PDF IMAGE ISSUE ===\n\n";

// Find a donation with a receipt
$donation = Donation::whereNotNull('receipt_path')->first();

if (!$donation) {
    echo "No donations with receipts found.\n";
    exit;
}

echo "Found donation with receipt:\n";
echo "- ID: " . $donation->id . "\n";
echo "- Receipt path: " . $donation->receipt_path . "\n";

// Debug the path resolution
$receiptWebPath = $donation->receipt_path;
$receiptFsPath = public_path(ltrim($receiptWebPath, '/'));
$receiptFsPath = str_replace('\\', '/', $receiptFsPath);

echo "\nPath resolution:\n";
echo "- Web path: " . $receiptWebPath . "\n";
echo "- FS path: " . $receiptFsPath . "\n";
echo "- File exists: " . (file_exists($receiptFsPath) ? 'YES' : 'NO') . "\n";

if (file_exists($receiptFsPath)) {
    $ext = strtolower(pathinfo($receiptFsPath, PATHINFO_EXTENSION));
    echo "- Extension: " . $ext . "\n";
    echo "- Is image: " . (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']) ? 'YES' : 'NO') . "\n";
    
    $imageInfo = getimagesize($receiptFsPath);
    if ($imageInfo) {
        echo "- Image dimensions: " . $imageInfo[0] . "x" . $imageInfo[1] . "\n";
        echo "- Image type: " . $imageInfo['mime'] . "\n";
    } else {
        echo "- getimagesize() failed\n";
    }
}

// Test PDF generation with debug output
echo "\n=== TESTING PDF GENERATION ===\n";

try {
    $pdfService = new DonationReceiptPdfService();
    
    // Create a custom PDF service with debug output
    $reflection = new ReflectionClass($pdfService);
    $method = $reflection->getMethod('addReceiptImage');
    $method->setAccessible(true);
    
    // Create a mock PDF object to test the method
    $pdf = new TCPDF();
    $pdf->AddPage();
    
    echo "Testing addReceiptImage method...\n";
    $method->invoke($pdfService, $pdf, $donation);
    
    echo "Method executed without errors.\n";
    
    // Now test full PDF generation
    echo "\nGenerating full PDF...\n";
    $pdfContent = $pdfService->renderDonationReceipt($donation);
    
    echo "PDF generated successfully!\n";
    echo "PDF size: " . strlen($pdfContent) . " bytes\n";
    
    // Save PDF for inspection
    $filename = 'debug-receipt-' . $donation->id . '.pdf';
    file_put_contents($filename, $pdfContent);
    echo "PDF saved as: " . $filename . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== DEBUG COMPLETE ===\n";
