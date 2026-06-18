<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Auth;

echo "Testing API endpoints after middleware fix...\n";

// Get admin user and authenticate
$admin = User::where('is_admin', true)->first();
if (!$admin) {
    echo "No admin user found!\n";
    exit;
}

echo "Admin user: " . $admin->name . " (ID: " . $admin->id . ")\n";

// Test family statistics
try {
    $controller = new \App\Http\Controllers\Api\FamilyController();
    $response = $controller->statistics();
    echo "Family statistics status: " . $response->getStatusCode() . "\n";
    if ($response->getStatusCode() === 200) {
        $data = json_decode($response->getContent(), true);
        echo "Family stats: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
    } else {
        echo "Error: " . $response->getContent() . "\n";
    }
} catch (Exception $e) {
    echo "Family stats error: " . $e->getMessage() . "\n";
}

// Test family index
try {
    $controller = new \App\Http\Controllers\Api\FamilyController();
    $response = $controller->index();
    echo "Family index status: " . $response->getStatusCode() . "\n";
    if ($response->getStatusCode() === 200) {
        $data = json_decode($response->getContent(), true);
        echo "Families count: " . (isset($data['data']) ? count($data['data']) : 'N/A') . "\n";
    } else {
        echo "Error: " . $response->getContent() . "\n";
    }
} catch (Exception $e) {
    echo "Family index error: " . $e->getMessage() . "\n";
}
