<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Event;
use App\Models\EventRegistration;

class EventRegistrationSeeder extends Seeder
{
    public function run()
    {
        $events = Event::all();
        
        if ($events->count() > 0) {
            // Clear existing test registrations first
            EventRegistration::where('email', 'like', 'test%@example.com')->delete();
            
            // Create 120 test registrations distributed across all 12 months of current year
            $totalRegistrations = 120;
            $monthlyDistribution = [
                1 => 8,   // January
                2 => 6,   // February  
                3 => 12,  // March
                4 => 15,  // April
                5 => 18,  // May
                6 => 10,  // June
                7 => 14,  // July
                8 => 9,   // August
                9 => 11,  // September
                10 => 7,  // October
                11 => 5,  // November
                12 => 5   // December
            ];
            
            $registrationId = 1;
            
            foreach ($monthlyDistribution as $month => $count) {
                for ($i = 0; $i < $count; $i++) {
                    $event = $events->random(); // Pick a random event
                    $registrationDate = \Carbon\Carbon::create(now()->year, $month, rand(1, 28));
                    
                    EventRegistration::create([
                        'event_id' => $event->id,
                        'first_name' => $this->getRandomFirstName(),
                        'last_name' => $this->getRandomLastName(),
                        'email' => 'test' . str_pad($registrationId, 4, '0', STR_PAD_LEFT) . '@example.com',
                        'phone' => '091' . rand(10000000, 99999999),
                        'age' => rand(18, 65),
                        'gender' => rand(0, 1) ? 'Male' : 'Female',
                        'address' => $this->getRandomAddress(),
                        'emergency_contact_name' => $this->getRandomFirstName() . ' ' . $this->getRandomLastName(),
                        'emergency_contact_phone' => '091' . rand(10000000, 99999999),
                        'status' => 'approved',
                        'registered_at' => $registrationDate
                    ]);
                    
                    $registrationId++;
                }
            }
            
            echo "Created {$totalRegistrations} test event registrations distributed across all 12 months of " . now()->year . ".\n";
        } else {
            echo "No events found. Please run EventSeeder first.\n";
        }
    }
    
    private function getRandomFirstName()
    {
        $names = ['Maria', 'Juan', 'Ana', 'Jose', 'Carmen', 'Antonio', 'Luz', 'Francisco', 'Rosa', 'Manuel'];
        return $names[array_rand($names)];
    }
    
    private function getRandomLastName()
    {
        $names = ['Santos', 'Cruz', 'Reyes', 'Garcia', 'Gonzalez', 'Rodriguez', 'Fernandez', 'Lopez', 'Martinez', 'Perez'];
        return $names[array_rand($names)];
    }
    
    private function getRandomAddress()
    {
        $addresses = [
            'Manila, Philippines',
            'Quezon City, Philippines', 
            'Makati, Philippines',
            'Pasig, Philippines',
            'Taguig, Philippines',
            'Mandaluyong, Philippines'
        ];
        return $addresses[array_rand($addresses)];
    }
}