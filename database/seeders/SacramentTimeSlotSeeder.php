<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SacramentTimeSlot;

class SacramentTimeSlotSeeder extends Seeder
{
    public function run()
    {
        $date = now()->addDay()->toDateString(); // tomorrow
        SacramentTimeSlot::insert([
            ['date' => $date, 'time' => '08:30 am - 10:00 am', 'status' => 'available'],
            ['date' => $date, 'time' => '10:00 am - 11:30 am', 'status' => 'available'],
            ['date' => $date, 'time' => '11:30 am - 01:00 pm', 'status' => 'available'],
            ['date' => $date, 'time' => '01:30 pm - 03:00 pm', 'status' => 'available'],
            ['date' => $date, 'time' => '03:00 pm - 04:30 pm', 'status' => 'available'],
            ['date' => $date, 'time' => '04:30 pm - 06:00 pm', 'status' => 'available'],
            ['date' => $date, 'time' => '06:00 pm - 07:30 pm', 'status' => 'available'],
        ]);
    }
}
