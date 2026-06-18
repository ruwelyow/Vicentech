<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SacramentType;

class SacramentTypeSeeder extends Seeder
{
    public function run()
    {
        SacramentType::insert([
            ['name' => 'Baptism', 'description' => 'The sacrament of initiation into the Christian faith'],
            ['name' => 'Confirmation', 'description' => 'The sacrament of receiving the Holy Spirit'],
            ['name' => 'First Holy Communion', 'description' => 'The sacrament of receiving the Body and Blood of Christ'],
            ['name' => 'Matrimony', 'description' => 'The sacrament of marriage'],
            ['name' => 'Confession', 'description' => 'The sacrament of reconciliation'],
            ['name' => 'Anointing of the Sick', 'description' => 'The sacrament of healing'],
        ]);
    }
}
