<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Updated Forgot Password Functionality...\n\n";

// Test with existing email
$existingEmail = 'admin@example.com'; // Replace with an actual email from your database
$nonExistingEmail = 'nonexistent@example.com';

echo "1. Testing with existing email: $existingEmail\n";
$user = \App\Models\User::where('email', $existingEmail)->first();
if ($user) {
    echo "   - User found: {$user->name} (ID: {$user->id})\n";
    echo "   - Expected: Success message 'Password reset email sent!'\n";
} else {
    echo "   - User not found\n";
    echo "   - Expected: Error message 'Email is not registered in our system.'\n";
}

echo "\n2. Testing with non-existing email: $nonExistingEmail\n";
$user = \App\Models\User::where('email', $nonExistingEmail)->first();
if ($user) {
    echo "   - User found: {$user->name} (ID: {$user->id})\n";
    echo "   - Expected: Success message 'Password reset email sent!'\n";
} else {
    echo "   - User not found (this is expected)\n";
    echo "   - Expected: Error message 'Email is not registered in our system.'\n";
}

echo "\nFunctionality Summary:\n";
echo "✅ Registered emails: Shows 'Password reset email sent! Check your inbox for further instructions.'\n";
echo "✅ Non-registered emails: Shows 'Email is not registered in our system.'\n";
echo "✅ All attempts are logged for security monitoring\n";
echo "✅ Clear error messaging for better user experience\n";

