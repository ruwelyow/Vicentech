<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StaffSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Staff User',
            'email' => 'staff@church.com',
            'password' => Hash::make('staff123'),
            'is_staff' => true,
            'is_admin' => false,
        ]);
    }
} 