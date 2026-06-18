<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Donation;
use App\Models\MassAttendance;
use App\Models\MassSchedule;
use App\Models\User;
use App\Models\Family;
use App\Models\DonationPurpose;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ThreeYearDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Starting 3-year historical data generation...');
        
        $startDate = Carbon::now()->subYears(3)->startOfMonth();
        $endDate = Carbon::now();
        
        // Get or create donation purposes
        $donationPurposes = $this->getDonationPurposes();
        
        // Get or create mass schedules
        $massSchedules = MassSchedule::all();
        if ($massSchedules->isEmpty()) {
            $this->command->warn('No mass schedules found. Creating sample mass schedules...');
            $massSchedules = $this->createMassSchedules();
        }
        
        // Generate data for each month over 3 years
        $currentDate = $startDate->copy();
        $monthCount = 0;
        
        while ($currentDate->lte($endDate)) {
            $monthCount++;
            $this->command->info("Processing month: {$currentDate->format('Y-m')} ({$monthCount}/36)");
            
            // Create events for this month
            $events = $this->createEventsForMonth($currentDate);
            
            // Create event registrations
            $this->createEventRegistrations($events, $currentDate);
            
            // Create donations
            $this->createDonations($currentDate, $donationPurposes);
            
            // Create mass attendance
            $this->createMassAttendance($currentDate, $massSchedules);
            
            // Create new users/parishioners (some months)
            if ($monthCount % 3 == 0) { // Every 3 months
                $this->createParishioners($currentDate);
            }
            
            // Create families (some months)
            if ($monthCount % 4 == 0) { // Every 4 months
                $this->createFamilies($currentDate);
            }
            
            $currentDate->addMonth();
        }
        
        $this->command->info('✅ 3-year historical data generation completed!');
        $this->command->info("Total events created: " . Event::count());
        $this->command->info("Total registrations created: " . EventRegistration::count());
        $this->command->info("Total donations created: " . Donation::where('verified', true)->count());
        $this->command->info("Total mass attendance created: " . MassAttendance::count());
        $this->command->info("Total parishioners created: " . User::where('is_admin', 0)->where('is_staff', 0)->where('is_priest', 0)->count());
        $this->command->info("Total families created: " . Family::count());
    }
    
    private function getDonationPurposes()
    {
        $purposes = DonationPurpose::all();
        if ($purposes->isEmpty()) {
            // Create default purposes
            $defaultPurposes = [
                'General Fund',
                'Building Maintenance',
                'Church Renovation',
                'Charity Fund',
                'Youth Ministry',
                'Music Ministry',
                'Parish Activities'
            ];
            
            foreach ($defaultPurposes as $purposeName) {
                DonationPurpose::create(['name' => $purposeName]);
            }
            $purposes = DonationPurpose::all();
        }
        return $purposes;
    }
    
    private function createMassSchedules()
    {
        $schedules = [];
        $days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        $times = ['06:00', '08:00', '10:00', '18:00'];
        
        foreach ($days as $day) {
            foreach ($times as $time) {
                if (($day === 'Sunday' && in_array($time, ['08:00', '10:00', '18:00'])) ||
                    ($day !== 'Sunday' && $time === '18:00')) {
                    $schedules[] = MassSchedule::create([
                        'day' => $day,
                        'time' => $time,
                        'type' => $day === 'Sunday' ? 'Sunday Mass' : 'Weekday Mass',
                        'location' => 'Main Church'
                    ]);
                }
            }
        }
        
        return collect($schedules);
    }
    
    private function createEventsForMonth($date)
    {
        $events = [];
        $eventTitles = [
            'Parish Feast Day Celebration',
            'Youth Gathering',
            'Bible Study Session',
            'Charity Event',
            'Community Outreach',
            'Prayer Meeting',
            'Choir Practice',
            'Volunteer Meeting',
            'Easter Celebration',
            'Christmas Party',
            'Lenten Retreat',
            'Advent Reflection'
        ];
        
        // Create 2-4 events per month
        $eventCount = rand(2, 4);
        $selectedTitles = array_rand($eventTitles, min($eventCount, count($eventTitles)));
        if (!is_array($selectedTitles)) {
            $selectedTitles = [$selectedTitles];
        }
        
        foreach ($selectedTitles as $index) {
            $eventDate = $date->copy()->addDays(rand(1, 28));
            $events[] = Event::create([
                'title' => $eventTitles[$index] . ' ' . $eventDate->format('Y'),
                'date' => $eventDate,
                'time' => rand(8, 18) . ':00',
                'location' => 'Parish Hall',
                'description' => 'Join us for this special event!'
            ]);
        }
        
        return $events;
    }
    
    private function createEventRegistrations($events, $date)
    {
        $firstNames = ['Maria', 'Juan', 'Anna', 'Jose', 'Carmen', 'Miguel', 'Rosa', 'Pedro', 'Luz', 'Ricardo', 
                      'Elena', 'Carlos', 'Isabel', 'Fernando', 'Patricia', 'Roberto', 'Sofia', 'Antonio', 'Laura', 'Manuel'];
        $lastNames = ['Santos', 'Dela Cruz', 'Garcia', 'Rodriguez', 'Flores', 'Torres', 'Morales', 'Ramos', 
                     'Villanueva', 'Mendoza', 'Cruz', 'Reyes', 'Bautista', 'Fernandez', 'Lopez', 'Martinez', 
                     'Gonzalez', 'Perez', 'Sanchez', 'Rivera'];
        
        foreach ($events as $event) {
            // Create 10-50 registrations per event
            $registrationCount = rand(10, 50);
            
            for ($i = 0; $i < $registrationCount; $i++) {
                $firstName = $firstNames[array_rand($firstNames)];
                $lastName = $lastNames[array_rand($lastNames)];
                $email = strtolower($firstName . '.' . $lastName . rand(1, 999) . '@example.com');
                
                // Registration date should be before event date
                $registrationDate = $event->date->copy()->subDays(rand(1, 30));
                
                EventRegistration::create([
                    'event_id' => $event->id,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $email,
                    'phone' => '09' . rand(100000000, 999999999),
                    'address' => $this->getRandomAddress(),
                    'status' => rand(0, 10) > 1 ? 'approved' : 'pending', // 90% approved
                    'created_at' => $registrationDate,
                    'updated_at' => $registrationDate
                ]);
            }
        }
    }
    
    private function createDonations($date, $donationPurposes)
    {
        $donorNames = ['Maria Santos', 'Juan Dela Cruz', 'Anna Garcia', 'Jose Rodriguez', 'Carmen Flores',
                      'Miguel Torres', 'Rosa Morales', 'Pedro Ramos', 'Luz Villanueva', 'Ricardo Mendoza',
                      'Elena Cruz', 'Carlos Reyes', 'Isabel Bautista', 'Fernando Fernandez', 'Patricia Lopez'];
        
        // Create 15-40 donations per month
        $donationCount = rand(15, 40);
        
        for ($i = 0; $i < $donationCount; $i++) {
            $donationDate = $date->copy()->addDays(rand(1, 28));
            $amount = rand(100, 10000); // Random amount between 100 and 10,000
            $purpose = $donationPurposes->random();
            $donorName = $donorNames[array_rand($donorNames)];
            $email = strtolower(str_replace(' ', '.', $donorName)) . rand(1, 999) . '@example.com';
            
            // 85% verified, 15% pending
            $verified = rand(0, 100) < 85;
            
            Donation::create([
                'name' => $donorName,
                'email' => $email,
                'amount' => $amount,
                'reference' => 'REF' . rand(100000, 999999),
                'category' => $purpose->id,
                'purpose_name' => $purpose->name,
                'verified' => $verified,
                'is_physical' => rand(0, 100) < 30, // 30% physical donations
                'created_at' => $donationDate,
                'updated_at' => $donationDate
            ]);
        }
    }
    
    private function createMassAttendance($date, $massSchedules)
    {
        // Get existing users or create some
        $users = User::where('is_admin', 0)->where('is_staff', 0)->where('is_priest', 0)->get();
        
        if ($users->isEmpty()) {
            // Create some users first
            $users = $this->createParishioners($date);
        }
        
        // Create 20-60 mass attendance records per month
        $attendanceCount = rand(20, 60);
        
        for ($i = 0; $i < $attendanceCount; $i++) {
            $attendanceDate = $date->copy()->addDays(rand(1, 28));
            $schedule = $massSchedules->random();
            $user = $users->random();
            
            MassAttendance::create([
                'mass_schedule_id' => $schedule->id,
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'address' => $user->address ?? $this->getRandomAddress(),
                'phone' => $user->phone ?? '09' . rand(100000000, 999999999),
                'number_of_people' => rand(1, 5),
                'is_confirmed' => rand(0, 10) > 1, // 90% confirmed
                'attendance_date' => $attendanceDate,
                'created_at' => $attendanceDate,
                'updated_at' => $attendanceDate
            ]);
        }
    }
    
    private function createParishioners($date)
    {
        $firstNames = ['Maria', 'Juan', 'Anna', 'Jose', 'Carmen', 'Miguel', 'Rosa', 'Pedro', 'Luz', 'Ricardo',
                      'Elena', 'Carlos', 'Isabel', 'Fernando', 'Patricia', 'Roberto', 'Sofia', 'Antonio', 'Laura', 'Manuel'];
        $lastNames = ['Santos', 'Dela Cruz', 'Garcia', 'Rodriguez', 'Flores', 'Torres', 'Morales', 'Ramos',
                     'Villanueva', 'Mendoza', 'Cruz', 'Reyes', 'Bautista', 'Fernandez', 'Lopez', 'Martinez',
                     'Gonzalez', 'Perez', 'Sanchez', 'Rivera'];
        
        $users = [];
        $userCount = rand(3, 8); // 3-8 new users per period
        
        for ($i = 0; $i < $userCount; $i++) {
            $firstName = $firstNames[array_rand($firstNames)];
            $lastName = $lastNames[array_rand($lastNames)];
            $name = $firstName . ' ' . $lastName;
            $email = strtolower($firstName . '.' . $lastName . rand(1, 9999) . '@example.com');
            $createdDate = $date->copy()->addDays(rand(1, 28));
            
            $users[] = User::create([
                'name' => $name,
                'email' => $email,
                'password' => bcrypt('password'),
                'phone' => '09' . rand(100000000, 999999999),
                'address' => $this->getRandomAddress(),
                'gender' => rand(0, 1) ? 'Male' : 'Female',
                'birthdate' => Carbon::now()->subYears(rand(18, 80))->format('Y-m-d'),
                'membership_status' => ['active', 'inactive', 'new_member', 'visitor'][rand(0, 3)],
                'is_admin' => 0,
                'is_staff' => 0,
                'is_priest' => 0,
                'created_at' => $createdDate,
                'updated_at' => $createdDate
            ]);
        }
        
        return collect($users);
    }
    
    private function createFamilies($date)
    {
        $users = User::where('is_admin', 0)
                    ->where('is_staff', 0)
                    ->where('is_priest', 0)
                    ->whereNull('family_id')
                    ->get();
        
        if ($users->count() < 2) {
            return;
        }
        
        $familyCount = rand(2, 5); // 2-5 new families per period
        
        for ($i = 0; $i < $familyCount && $users->count() >= 2; $i++) {
            $familyMembers = $users->random(min(rand(2, 5), $users->count()));
            
            $family = Family::create([
                'family_name' => $familyMembers->first()->last_name . ' Family',
                'family_status' => 'active',
                'created_at' => $date->copy()->addDays(rand(1, 28)),
                'updated_at' => $date->copy()->addDays(rand(1, 28))
            ]);
            
            // Assign first member as head
            $head = $familyMembers->first();
            $head->update([
                'family_id' => $family->id,
                'is_family_head' => true,
                'family_role' => 'Head'
            ]);
            
            // Assign other members
            foreach ($familyMembers->skip(1) as $member) {
                $member->update([
                    'family_id' => $family->id,
                    'is_family_head' => false,
                    'family_role' => ['Spouse', 'Child', 'Parent'][rand(0, 2)]
                ]);
            }
            
            // Remove assigned users from pool
            $users = $users->diff($familyMembers);
        }
    }
    
    private function getRandomAddress()
    {
        $streets = ['Main Street', 'Church Avenue', 'Parish Road', 'Sanctuary Lane', 'Faith Boulevard'];
        $cities = ['Quezon City', 'Manila', 'Makati', 'Pasig', 'Mandaluyong'];
        
        return rand(1, 999) . ' ' . $streets[array_rand($streets)] . ', ' . $cities[array_rand($cities)] . ', Metro Manila';
    }
}

