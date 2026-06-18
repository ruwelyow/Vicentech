<?php

require_once 'vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\EventRegistration;
use Carbon\Carbon;

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    // Get the existing registration to use same event_id
    $existingReg = EventRegistration::first();
    $eventId = $existingReg->event_id;
    
    echo "Creating 10 sample registrations for event ID: $eventId\n";
    
    // Sample names and data
    $sampleData = [
        ['first_name' => 'Maria', 'last_name' => 'Santos', 'email' => 'maria.santos@example.com', 'phone' => '09123456789'],
        ['first_name' => 'Juan', 'last_name' => 'Dela Cruz', 'email' => 'juan.delacruz@example.com', 'phone' => '09234567890'],
        ['first_name' => 'Anna', 'last_name' => 'Garcia', 'email' => 'anna.garcia@example.com', 'phone' => '09345678901'],
        ['first_name' => 'Jose', 'last_name' => 'Rodriguez', 'email' => 'jose.rodriguez@example.com', 'phone' => '09456789012'],
        ['first_name' => 'Carmen', 'last_name' => 'Flores', 'email' => 'carmen.flores@example.com', 'phone' => '09567890123'],
        ['first_name' => 'Miguel', 'last_name' => 'Torres', 'email' => 'miguel.torres@example.com', 'phone' => '09678901234'],
        ['first_name' => 'Rosa', 'last_name' => 'Morales', 'email' => 'rosa.morales@example.com', 'phone' => '09789012345'],
        ['first_name' => 'Pedro', 'last_name' => 'Ramos', 'email' => 'pedro.ramos@example.com', 'phone' => '09890123456'],
        ['first_name' => 'Luz', 'last_name' => 'Villanueva', 'email' => 'luz.villanueva@example.com', 'phone' => '09901234567'],
        ['first_name' => 'Ricardo', 'last_name' => 'Mendoza', 'email' => 'ricardo.mendoza@example.com', 'phone' => '09012345678']
    ];
    
    $addresses = [
        'Quezon City, Metro Manila',
        'Makati City, Metro Manila', 
        'Caloocan City, Metro Manila',
        'Las Pinas City, Metro Manila',
        'Marikina City, Metro Manila',
        'Pasay City, Metro Manila',
        'Taguig City, Metro Manila',
        'Paranaque City, Metro Manila',
        'Muntinlupa City, Metro Manila',
        'Cabuyao, Laguna'
    ];
    
    $createdRegistrations = [];
    
    for ($i = 0; $i < 10; $i++) {
        // Create dates spread throughout October 2025
        $randomDay = rand(1, 31);
        $randomHour = rand(8, 18);
        $randomMinute = rand(0, 59);
        $randomSecond = rand(0, 59);
        
        $registrationDate = Carbon::create(2025, 10, $randomDay, $randomHour, $randomMinute, $randomSecond);
        
        $registration = EventRegistration::create([
            'event_id' => $eventId,
            'first_name' => $sampleData[$i]['first_name'],
            'last_name' => $sampleData[$i]['last_name'],
            'email' => $sampleData[$i]['email'],
            'phone' => $sampleData[$i]['phone'],
            'address' => $addresses[$i],
            'status' => 'approved',
            'registered_at' => $registrationDate,
            'created_at' => $registrationDate,
            'updated_at' => $registrationDate
        ]);
        
        $createdRegistrations[] = $registration->id;
        
        echo "Created registration #{$registration->id}: {$sampleData[$i]['first_name']} {$sampleData[$i]['last_name']} on {$registrationDate->format('Y-m-d H:i:s')}\n";
    }
    
    echo "\nSuccessfully created 10 sample registrations!\n";
    echo "Registration IDs: " . implode(', ', $createdRegistrations) . "\n";
    echo "Total registrations now: " . EventRegistration::count() . "\n";
    echo "October 2025 registrations: " . EventRegistration::whereYear('created_at', 2025)->whereMonth('created_at', 10)->count() . "\n";
    
    // Save the IDs to a file for easy cleanup later
    file_put_contents('sample_registration_ids.txt', implode(',', $createdRegistrations));
    echo "\nSample registration IDs saved to sample_registration_ids.txt for cleanup\n";
    
    // ========== SEPTEMBER REGISTRATION TEST ==========
    echo "\nAdding 2 event registrations for September for analytics bar test...\n";
    $septemberEvent = \App\Models\Event::whereMonth('date', 9)->first();
    if ($septemberEvent) {
        $septemberEventId = $septemberEvent->id;
        $septTestRegs = [];
        $septDates = [
            Carbon::create(date('Y'), 9, 10, 13, 0, 0),
            Carbon::create(date('Y'), 9, 15, 15, 30, 0)
        ];
        for ($j=0; $j<2; $j++) {
            $reg = EventRegistration::create([
                'event_id' => $septemberEventId,
                'first_name' => 'SeptTest'.($j+1),
                'last_name' => 'Analytics',
                'email' => 'september-test'.($j+1).'@example.com',
                'phone' => '70000000'.($j+1),
                'address' => 'Test Address',
                'status' => 'approved',
                'registered_at' => $septDates[$j],
                'created_at' => $septDates[$j],
                'updated_at' => $septDates[$j],
            ]);
            $septTestRegs[] = $reg->id;
            echo "Created September registration #{$reg->id}: {$reg->first_name} {$reg->last_name} on ".$septDates[$j]->format('Y-m-d H:i:s')."\n";
        }
        file_put_contents('sample_september_ids.txt', implode(',', $septTestRegs));
        echo "September registration IDs: ".implode(', ',$septTestRegs)."\n";
    } else {
        echo "No event found for September - SKIPPING September test\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
