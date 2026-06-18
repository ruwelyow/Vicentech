<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Family;
use App\Models\User;

echo "Testing Family controller with detailed error handling...\n";

try {
    $controller = new \App\Http\Controllers\Api\FamilyController();
    
    // Test the index method
    echo "Calling FamilyController->index()...\n";
    $response = $controller->index();
    echo "Response status: " . $response->getStatusCode() . "\n";
    
    if ($response->getStatusCode() === 200) {
        $data = json_decode($response->getContent(), true);
        echo "Success! Families count: " . (isset($data['data']) ? count($data['data']) : 'N/A') . "\n";
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
