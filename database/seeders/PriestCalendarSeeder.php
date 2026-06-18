<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\PriestCalendar;
use Carbon\Carbon;

class PriestCalendarSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // First, create some priest users if they don't exist
        $priest1 = User::firstOrCreate(
            ['email' => 'fr.gomer@church.com'],
            [
                'name' => 'Fr. Gomer Torres',
                'password' => bcrypt('password'),
                'is_priest' => true,
                'phone' => '09123456789',
                'gender' => 'Male',
                'birthdate' => '1980-05-15',
                'address' => 'Church Rectory',
                'age' => 44
            ]
        );

        $priest2 = User::firstOrCreate(
            ['email' => 'fr.jeric@church.com'],
            [
                'name' => 'Fr. Jeric Advincula',
                'password' => bcrypt('password'),
                'is_priest' => true,
                'phone' => '09123456790',
                'gender' => 'Male',
                'birthdate' => '1975-08-20',
                'address' => 'Church Rectory',
                'age' => 49
            ]
        );

        // Create sample calendar entries
        $entries = [
            // Fr. Gomer Torres schedule
            [
                'priest_id' => $priest1->id,
                'duty' => 'Sunday Mass',
                'date' => Carbon::now()->addDays(1)->format('Y-m-d'),
                'time' => '06:00',
                'notes' => 'Early morning mass',
                'status' => 'scheduled'
            ],
            [
                'priest_id' => $priest1->id,
                'duty' => 'Sunday Mass',
                'date' => Carbon::now()->addDays(1)->format('Y-m-d'),
                'time' => '08:00',
                'notes' => 'Main Sunday service',
                'status' => 'scheduled'
            ],
            [
                'priest_id' => $priest1->id,
                'duty' => 'Weekday Mass',
                'date' => Carbon::now()->addDays(2)->format('Y-m-d'),
                'time' => '06:00',
                'notes' => 'Regular weekday mass',
                'status' => 'scheduled'
            ],
            [
                'priest_id' => $priest1->id,
                'duty' => 'Confession',
                'date' => Carbon::now()->addDays(3)->format('Y-m-d'),
                'time' => '16:00',
                'notes' => 'Afternoon confession',
                'status' => 'scheduled'
            ],
            [
                'priest_id' => $priest1->id,
                'duty' => 'Wedding Ceremony',
                'date' => Carbon::now()->addDays(7)->format('Y-m-d'),
                'time' => '14:00',
                'notes' => 'Wedding ceremony for the Santos family',
                'status' => 'scheduled'
            ],

            // Fr. Jeric Advincula schedule
            [
                'priest_id' => $priest2->id,
                'duty' => 'Evening Mass',
                'date' => Carbon::now()->addDays(1)->format('Y-m-d'),
                'time' => '17:00',
                'notes' => 'Sunday evening service',
                'status' => 'scheduled'
            ],
            [
                'priest_id' => $priest2->id,
                'duty' => 'Confession',
                'date' => Carbon::now()->addDays(2)->format('Y-m-d'),
                'time' => '17:00',
                'notes' => 'Evening confession',
                'status' => 'scheduled'
            ],
            [
                'priest_id' => $priest2->id,
                'duty' => 'Baptism',
                'date' => Carbon::now()->addDays(4)->format('Y-m-d'),
                'time' => '10:00',
                'notes' => 'Baptism ceremony',
                'status' => 'scheduled'
            ],
            [
                'priest_id' => $priest2->id,
                'duty' => 'Weekday Mass',
                'date' => Carbon::now()->addDays(5)->format('Y-m-d'),
                'time' => '06:00',
                'notes' => 'Regular weekday mass',
                'status' => 'scheduled'
            ],
            [
                'priest_id' => $priest2->id,
                'duty' => 'First Communion',
                'date' => Carbon::now()->addDays(8)->format('Y-m-d'),
                'time' => '09:00',
                'notes' => 'First communion ceremony for children',
                'status' => 'scheduled'
            ],
        ];

        foreach ($entries as $entry) {
            PriestCalendar::firstOrCreate(
                [
                    'priest_id' => $entry['priest_id'],
                    'date' => $entry['date'],
                    'time' => $entry['time']
                ],
                $entry
            );
        }

        $this->command->info('Priest calendar entries seeded successfully!');
    }
}
