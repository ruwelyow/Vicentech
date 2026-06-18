<?php

require_once 'vendor/autoload.php';

use App\Models\EventRegistration;

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    // Read the sample registration IDs
    if (!file_exists('sample_registration_ids.txt')) {
        echo "No sample registration IDs file found.\n";
        exit;
    }
    
    $sampleIds = explode(',', file_get_contents('sample_registration_ids.txt'));
    $sampleIds = array_map('trim', $sampleIds);
    $sampleIds = array_filter($sampleIds, 'is_numeric');
    
    echo "Found " . count($sampleIds) . " sample registration IDs to delete\n";
    echo "IDs: " . implode(', ', $sampleIds) . "\n";
    
    // Count before deletion
    $beforeCount = EventRegistration::count();
    $beforeOctCount = EventRegistration::whereYear('created_at', 2025)->whereMonth('created_at', 10)->count();
    
    // Delete the sample registrations
    $deleted = EventRegistration::whereIn('id', $sampleIds)->delete();
    
    // Count after deletion
    $afterCount = EventRegistration::count();
    $afterOctCount = EventRegistration::whereYear('created_at', 2025)->whereMonth('created_at', 10)->count();
    
    echo "\nDeletion complete!\n";
    echo "Deleted: $deleted registrations\n";
    echo "Total registrations: $beforeCount → $afterCount\n";
    echo "October 2025 registrations: $beforeOctCount → $afterOctCount\n";
    
    // Clean up the IDs file
    unlink('sample_registration_ids.txt');
    echo "\nCleaned up sample_registration_ids.txt file\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
