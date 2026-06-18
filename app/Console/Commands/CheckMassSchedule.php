<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MassSchedule;

class CheckMassSchedule extends Command
{
    protected $signature = 'test:check-mass-schedule {id}';
    protected $description = 'Check if a mass schedule exists';

    public function handle()
    {
        $id = $this->argument('id');
        
        $schedule = MassSchedule::find($id);
        
        if ($schedule) {
            $this->info("✅ Mass schedule found:");
            $this->info("   • ID: {$schedule->id}");
            $this->info("   • Type: {$schedule->type}");
            $this->info("   • Day: {$schedule->day}");
            $this->info("   • Time: {$schedule->start_time} - {$schedule->end_time}");
            $this->info("   • Celebrant: {$schedule->celebrant}");
            $this->info("   • Active: " . ($schedule->is_active ? 'Yes' : 'No'));
        } else {
            $this->error("❌ Mass schedule with ID {$id} not found.");
            
            $this->info("Available mass schedules:");
            $schedules = MassSchedule::all();
            foreach ($schedules as $s) {
                $this->info("   • ID: {$s->id} - {$s->type} on {$s->day}");
            }
        }
        
        return 0;
    }
}
