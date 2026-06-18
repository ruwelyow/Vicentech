<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Family;
use App\Models\User;

echo "Testing Family statistics endpoint...\n";

try {
    $controller = new \App\Http\Controllers\Api\FamilyController();
    
    // Test the statistics method
    echo "Calling FamilyController->statistics()...\n";
    $response = $controller->statistics();
    echo "Response status: " . $response->getStatusCode() . "\n";
    
    if ($response->getStatusCode() === 200) {
        $data = json_decode($response->getContent(), true);
        echo "Success! Data: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
    } else {
        echo "Error response: " . $response->getContent() . "\n";
    }
    
} catch (Exception $e) {
    echo "Exception caught: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
} catch (Error $e) {
    echo "Error caught: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
