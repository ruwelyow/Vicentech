<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Analytics API with Filtering ===\n";

try {
    // Test the analytics API without filtering
    echo "\n📊 Testing analytics without filtering:\n";
    $response = file_get_contents('http://localhost:8000/api/analytics/event-registrations');
    $data = json_decode($response, true);

    if ($data) {
        echo "✅ API call successful\n";
        echo "  - Total Registrations: " . ($data['totalRegistrations'] ?? 'N/A') . "\n";
        echo "  - Recent Registrations Count: " . count($data['recentRegistrations'] ?? []) . "\n";
        echo "  - First recent registration event: " . ($data['recentRegistrations'][0]['event'] ?? 'N/A') . "\n";
    } else {
        echo "❌ API call failed or returned invalid data\n";
    }

    // Test with filtering (assuming event ID 1 exists)
    echo "\n📊 Testing analytics with event filtering (event_id=1):\n";
    $responseFiltered = file_get_contents('http://localhost:8000/api/analytics/event-registrations?event_id=1');
    $dataFiltered = json_decode($responseFiltered, true);

    if ($dataFiltered) {
        echo "✅ Filtered API call successful\n";
        echo "  - Total Registrations: " . ($dataFiltered['totalRegistrations'] ?? 'N/A') . "\n";
        echo "  - Recent Registrations Count: " . count($dataFiltered['recentRegistrations'] ?? []) . "\n";
        if (isset($dataFiltered['recentRegistrations'][0])) {
            echo "  - First recent registration event: " . $dataFiltered['recentRegistrations'][0]['event'] . "\n";
        }
    } else {
        echo "❌ Filtered API call failed or returned invalid data\n";
    }

    echo "\n✅ Analytics API testing completed!\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}