<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Auth;

echo "Testing authentication and API endpoints...\n";

// Check if there are any users
$userCount = User::count();
echo "Total users: " . $userCount . "\n";

// Check admin users
$adminUsers = User::where('is_admin', true)->get();
echo "Admin users: " . $adminUsers->count() . "\n";

if ($adminUsers->count() > 0) {
    $admin = $adminUsers->first();
    echo "First admin: " . $admin->name . " (ID: " . $admin->id . ")\n";
    
    // Test authentication
    Auth::login($admin);
    echo "Logged in as: " . Auth::user()->name . "\n";
    
    // Test family statistics
    try {
        $controller = new \App\Http\Controllers\Api\FamilyController();
        $response = $controller->statistics();
        echo "Family statistics status: " . $response->getStatusCode() . "\n";
        if ($response->getStatusCode() === 200) {
            $data = json_decode($response->getContent(), true);
            echo "Family stats data: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
        } else {
            echo "Error: " . $response->getContent() . "\n";
        }
    } catch (Exception $e) {
        echo "Family stats error: " . $e->getMessage() . "\n";
    }
    
    // Test parish records
    try {
        $controller = new \App\Http\Controllers\Api\ParishRecordController();
        $response = $controller->index();
        echo "Parish records status: " . $response->getStatusCode() . "\n";
        if ($response->getStatusCode() === 200) {
            $data = json_decode($response->getContent(), true);
            echo "Parish records count: " . (isset($data['data']) ? count($data['data']) : 'N/A') . "\n";
        } else {
            echo "Error: " . $response->getContent() . "\n";
        }
    } catch (Exception $e) {
        echo "Parish records error: " . $e->getMessage() . "\n";
    }
} else {
    echo "No admin users found!\n";
}
