<?php

// Simple test script for the chat API
$url = 'http://localhost:8000/api/chat';
$data = [
    'message' => 'What are your mass schedules?'
];

$options = [
    'http' => [
        'header' => "Content-type: application/json\r\n",
        'method' => 'POST',
        'content' => json_encode($data)
    ]
];

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);

if ($result === FALSE) {
    echo "Error: Could not connect to the API\n";
    echo "Make sure your Laravel server is running: php artisan serve\n";
} else {
    $response = json_decode($result, true);
    echo "API Response:\n";
    echo "Success: " . ($response['success'] ? 'Yes' : 'No') . "\n";
    echo "Response: " . $response['response'] . "\n";
    if (isset($response['error'])) {
        echo "Error: " . $response['error'] . "\n";
    }
} 