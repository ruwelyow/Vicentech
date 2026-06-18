<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ServerType;

class ServerTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            'Altar Server',
            'Lector/Reader',
            'Choir Member',
            'Collector',
            'Usher',
        ];
        foreach ($types as $type) {
            ServerType::firstOrCreate(['name' => $type]);
        }
    }
} 