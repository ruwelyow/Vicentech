<?php

// Comprehensive test script for the chat API
function testChatAPI($message, $expectedKeywords = []) {
    $url = 'http://localhost:8000/api/chat';
    $data = ['message' => $message];

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
        echo "❌ Error: Could not connect to the API\n";
        return false;
    }

    $response = json_decode($result, true);
    
    echo "📝 Test: \"$message\"\n";
    echo "✅ Success: " . ($response['success'] ? 'Yes' : 'No') . "\n";
    echo "🤖 Response: " . $response['response'] . "\n";
    
    if (isset($response['error'])) {
        echo "⚠️  Error: " . $response['error'] . "\n";
    }
    
    // Check if response contains expected keywords (for fallback responses)
    if (!empty($expectedKeywords)) {
        $containsKeywords = false;
        foreach ($expectedKeywords as $keyword) {
            if (stripos($response['response'], $keyword) !== false) {
                $containsKeywords = true;
                break;
            }
        }
        echo "🎯 Contains expected keywords: " . ($containsKeywords ? 'Yes' : 'No') . "\n";
    }
    
    echo "---\n";
    return $response['success'];
}

echo "🧪 Testing Chat API Integration\n";
echo "================================\n\n";

// Test cases
$tests = [
    [
        'message' => 'What are your mass schedules?',
        'keywords' => ['mass', 'schedule', 'AM', 'PM']
    ],
    [
        'message' => 'Where are you located?',
        'keywords' => ['Mamatid', 'Cabuyao', 'Laguna']
    ],
    [
        'message' => 'How can I contact you?',
        'keywords' => ['phone', 'email', '09123456789']
    ],
    [
        'message' => 'Hello there!',
        'keywords' => ['hello', 'assist', 'church']
    ],
    [
        'message' => 'Tell me about your church history',
        'keywords' => []
    ]
];

$successCount = 0;
foreach ($tests as $test) {
    if (testChatAPI($test['message'], $test['keywords'])) {
        $successCount++;
    }
}

echo "📊 Test Results: $successCount/" . count($tests) . " tests passed\n";

if ($successCount === count($tests)) {
    echo "🎉 All tests passed! Your AI chat is working correctly.\n";
} else {
    echo "⚠️  Some tests failed. Check your OpenAI API key and configuration.\n";
} 