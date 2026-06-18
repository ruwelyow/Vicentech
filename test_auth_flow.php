<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Auth;

echo "Testing authentication flow...\n";

// Check if there are any users
$userCount = User::count();
echo "Total users: " . $userCount . "\n";

// Check admin users
$adminUsers = User::where('is_admin', true)->get();
echo "Admin users: " . $adminUsers->count() . "\n";

if ($adminUsers->count() > 0) {
    $admin = $adminUsers->first();
    echo "First admin: " . $admin->name . " (Email: " . $admin->email . ")\n";
    
    // Test if we can authenticate the user
    Auth::login($admin);
    echo "Authenticated user: " . Auth::user()->name . "\n";
    echo "Is admin: " . (Auth::user()->is_admin ? 'Yes' : 'No') . "\n";
    
    // Test the middleware directly
    $request = new \Illuminate\Http\Request();
    $request->setUserResolver(function () use ($admin) {
        return $admin;
    });
    
    $middleware = new \App\Http\Middleware\AdminMiddleware();
    try {
        $response = $middleware->handle($request, function ($req) {
            return response()->json(['success' => true]);
        });
        echo "Middleware test: " . $response->getStatusCode() . "\n";
    } catch (Exception $e) {
        echo "Middleware error: " . $e->getMessage() . "\n";
    }
} else {
    echo "No admin users found!\n";
}
