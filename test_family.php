<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Family;
use App\Models\User;

echo "Testing Family model...\n";

try {
    $families = Family::all();
    echo "Total families: " . $families->count() . "\n";
    
    foreach ($families as $family) {
        echo "Family ID: " . $family->id . "\n";
        echo "Family Name: " . ($family->family_name ?? 'NULL') . "\n";
        echo "Family Code: " . ($family->family_code ?? 'NULL') . "\n";
        echo "Members count: " . $family->members()->count() . "\n";
        echo "---\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
