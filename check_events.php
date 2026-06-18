<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Checking Available Events ===\n";

try {
    $events = App\Models\Event::all();
    echo "Available Events:\n";
    foreach($events as $event) {
        echo "  ID: " . $event->id . " - Title: " . $event->title . "\n";
    }

    if ($events->isEmpty()) {
        echo "No events found.\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}