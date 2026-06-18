<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Auth;

echo "Testing web authentication...\n";

// Check if there's a session
$sessionId = session_id();
echo "Session ID: " . ($sessionId ?: 'No session') . "\n";

// Check if user is authenticated
if (Auth::check()) {
    $user = Auth::user();
    echo "Authenticated user: " . $user->name . " (ID: " . $user->id . ")\n";
    echo "Is admin: " . ($user->is_admin ? 'Yes' : 'No') . "\n";
} else {
    echo "No authenticated user\n";
}

// Check if there are any admin users
$adminUsers = User::where('is_admin', true)->get();
echo "Admin users available: " . $adminUsers->count() . "\n";

if ($adminUsers->count() > 0) {
    $admin = $adminUsers->first();
    echo "First admin: " . $admin->name . " (Email: " . $admin->email . ")\n";
    echo "Password hash: " . substr($admin->password, 0, 20) . "...\n";
}
