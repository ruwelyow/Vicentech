<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MassScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $schedules = [
            [
                'day' => 'Sunday',
                'time' => '06:00',
                'start_time' => '06:00',
                'end_time' => '07:00',
                'type' => 'Regular Mass',
                'celebrant' => 'Rev. Fr. John Doe',
                'is_active' => true
            ],
            [
                'day' => 'Sunday',
                'time' => '08:00',
                'start_time' => '08:00',
                'end_time' => '09:00',
                'type' => 'Regular Mass',
                'celebrant' => 'Rev. Fr. John Doe',
                'is_active' => true
            ],
            [
                'day' => 'Sunday',
                'time' => '10:00',
                'start_time' => '10:00',
                'end_time' => '11:00',
                'type' => 'Regular Mass',
                'celebrant' => 'Rev. Fr. John Doe',
                'is_active' => true
            ],
            [
                'day' => 'Monday',
                'time' => '06:00',
                'start_time' => '06:00',
                'end_time' => '07:00',
                'type' => 'Regular Mass',
                'celebrant' => 'Rev. Fr. John Doe',
                'is_active' => true
            ],
            [
                'day' => 'Saturday',
                'time' => '17:00',
                'start_time' => '17:00',
                'end_time' => '18:00',
                'type' => 'Anticipated Mass',
                'celebrant' => 'Rev. Fr. John Doe',
                'is_active' => true
            ]
        ];

        foreach ($schedules as $schedule) {
            \App\Models\MassSchedule::create($schedule);
        }
    }
}
