<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Call individual seeders
        $this->call([
            // Add other seeders here as needed
            // MembershipStatusSeeder::class, // Uncomment to seed membership statuses
            ThreeYearDataSeeder::class, // Generate 3 years of historical data
        ]);
    }
}
