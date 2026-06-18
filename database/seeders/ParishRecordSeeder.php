<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ParishRecord;
use Carbon\Carbon;

class ParishRecordSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $records = [
            // Baptism Records
            [
                'type' => 'baptism',
                'name' => 'Juan Miguel Santos',
                'date' => Carbon::now()->subDays(15),
                'priest' => 'Fr. Antonio Cruz',
                'status' => 'completed',
                'details' => [
                    'parents' => 'Jose Santos & Maria Santos',
                    'godparents' => 'Miguel Rodriguez & Rosa Garcia',
                    'birth_date' => '2023-12-01',
                    'birth_place' => 'Manila, Philippines'
                ],
                'notes' => 'Beautiful ceremony with family present'
            ],
            [
                'type' => 'baptism',
                'name' => 'Ana Sofia Reyes',
                'date' => Carbon::now()->subDays(30),
                'priest' => 'Fr. Luis Martinez',
                'status' => 'completed',
                'details' => [
                    'parents' => 'Carlos Reyes & Sofia Mendoza',
                    'godparents' => 'Pedro Reyes & Carmen Santos',
                    'birth_date' => '2023-11-15',
                    'birth_place' => 'Quezon City, Philippines'
                ]
            ],

            // Confirmation Records
            [
                'type' => 'confirmation',
                'name' => 'Maria Elena Garcia',
                'date' => Carbon::now()->subDays(45),
                'priest' => 'Bishop Fernando Dela Cruz',
                'status' => 'completed',
                'details' => [
                    'sponsor' => 'Roberto Garcia',
                    'bishop' => 'Bishop Fernando Dela Cruz',
                    'confirmation_name' => 'Teresa',
                    'baptism_date' => '2010-03-15'
                ],
                'notes' => 'Confirmation during special ceremony'
            ],
            [
                'type' => 'confirmation',
                'name' => 'Carlos Antonio Lopez',
                'date' => Carbon::now()->subDays(60),
                'priest' => 'Bishop Fernando Dela Cruz',
                'status' => 'completed',
                'details' => [
                    'sponsor' => 'Antonio Lopez Sr.',
                    'bishop' => 'Bishop Fernando Dela Cruz',
                    'confirmation_name' => 'Francis',
                    'baptism_date' => '2009-08-20'
                ]
            ],

            // Marriage Records
            [
                'type' => 'marriage',
                'name' => 'Pedro Martinez & Carmen Rodriguez',
                'date' => Carbon::now()->subDays(20),
                'priest' => 'Fr. Antonio Cruz',
                'status' => 'completed',
                'details' => [
                    'spouse' => 'Carmen Rodriguez',
                    'witnesses' => 'Miguel Santos & Rosa Garcia',
                    'venue' => 'San Vicente Ferrer Church',
                    'marriage_license' => 'ML-2024-001234'
                ],
                'notes' => 'Beautiful wedding ceremony with 150 guests'
            ],
            [
                'type' => 'marriage',
                'name' => 'Roberto Silva & Ana Morales',
                'date' => Carbon::now()->subDays(90),
                'priest' => 'Fr. Luis Martinez',
                'status' => 'completed',
                'details' => [
                    'spouse' => 'Ana Morales',
                    'witnesses' => 'Carlos Silva & Maria Morales',
                    'venue' => 'San Vicente Ferrer Church',
                    'marriage_license' => 'ML-2023-005678'
                ]
            ],

            // Funeral Records
            [
                'type' => 'funeral',
                'name' => 'Esperanza Villanueva',
                'date' => Carbon::now()->subDays(10),
                'priest' => 'Fr. Antonio Cruz',
                'status' => 'completed',
                'details' => [
                    'deceased' => 'Esperanza Villanueva',
                    'date_of_death' => Carbon::now()->subDays(12)->toDateString(),
                    'cause_of_death' => 'Natural causes',
                    'burial_place' => 'Manila Memorial Park'
                ],
                'notes' => 'Peaceful service, well attended by family'
            ],

            // Mass Records
            [
                'type' => 'mass',
                'name' => 'Sunday Mass - First Sunday of Advent',
                'date' => Carbon::now()->subDays(7),
                'priest' => 'Fr. Luis Martinez',
                'status' => 'completed',
                'details' => [
                    'mass_type' => 'Sunday Mass',
                    'attendance' => '180',
                    'offerings' => '₱8,500',
                    'special_intention' => 'For the souls in purgatory'
                ],
                'notes' => 'High attendance due to special season'
            ],
            [
                'type' => 'mass',
                'name' => 'Wedding Mass - Martinez-Rodriguez',
                'date' => Carbon::now()->subDays(20),
                'priest' => 'Fr. Antonio Cruz',
                'status' => 'completed',
                'details' => [
                    'mass_type' => 'Wedding Mass',
                    'attendance' => '150',
                    'offerings' => '₱15,000',
                    'special_intention' => 'For the newly wed couple'
                ]
            ],

            // Recent/Pending Records
            [
                'type' => 'baptism',
                'name' => 'Isabella Marie Cruz',
                'date' => Carbon::now()->addDays(5),
                'priest' => 'Fr. Antonio Cruz',
                'status' => 'pending',
                'details' => [
                    'parents' => 'Antonio Cruz Jr. & Marie Santos',
                    'godparents' => 'TBD',
                    'birth_date' => '2024-01-01',
                    'birth_place' => 'Makati, Philippines'
                ],
                'notes' => 'Scheduled for next Sunday'
            ],
            [
                'type' => 'confirmation',
                'name' => 'Miguel Angel Torres',
                'date' => Carbon::now()->addDays(15),
                'priest' => 'Bishop Fernando Dela Cruz',
                'status' => 'pending',
                'details' => [
                    'sponsor' => 'Angel Torres Sr.',
                    'bishop' => 'Bishop Fernando Dela Cruz',
                    'confirmation_name' => 'Michael',
                    'baptism_date' => '2010-05-12'
                ]
            ]
        ];

        foreach ($records as $record) {
            $parishRecord = ParishRecord::create($record);
            // Generate certificate number for completed records
            if ($parishRecord->status === 'completed') {
                $parishRecord->generateCertificateNumber();
            }
        }
    }
}