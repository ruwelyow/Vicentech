<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriestCalendar extends Model
{
    protected $fillable = [
        'priest_id',
        'duty',
        'date',
        'time',
        'notes',
        'status'
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];

    /**
     * Get the priest that owns the calendar entry.
     */
    public function priest(): BelongsTo
    {
        return $this->belongsTo(User::class, 'priest_id');
    }

    /**
     * Scope a query to only include entries for a specific date.
     */
    public function scopeForDate($query, $date)
    {
        return $query->whereDate('date', $date);
    }

    /**
     * Scope a query to only include entries for a specific priest.
     */
    public function scopeForPriest($query, $priestId)
    {
        return $query->where('priest_id', $priestId);
    }

    /**
     * Scope a query to only include scheduled entries.
     */
    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    /**
     * Scope a query to only include entries within a date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }
}
