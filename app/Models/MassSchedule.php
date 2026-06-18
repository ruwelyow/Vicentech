<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MassSchedule extends Model
{
    protected $fillable = [
        'day',
        'time',
        'start_time',
        'end_time',
        'type',
        'celebrant',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    // Define the order of days for sorting
    public static function getDayOrder()
    {
        return [
            'Sunday' => 0,
            'Monday' => 1,
            'Tuesday' => 2,
            'Wednesday' => 3,
            'Thursday' => 4,
            'Friday' => 5,
            'Saturday' => 6
        ];
    }

    // Scope to get active schedules
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Scope to order by day and time
    public function scopeOrdered($query)
    {
        $dayOrder = self::getDayOrder();
        return $query->orderByRaw("FIELD(day, '" . implode("','", array_keys($dayOrder)) . "')")
                    ->orderBy('time');
    }
}
