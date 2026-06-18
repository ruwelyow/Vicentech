<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use App\Models\Event;

class NoEventConflict implements ValidationRule
{
    protected $excludeEventId;
    protected $date;
    protected $time;

    public function __construct($excludeEventId = null, $date = null, $time = null)
    {
        $this->excludeEventId = $excludeEventId;
        $this->date = $date;
        $this->time = $time;
    }

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Get the request data to access date and time
        $request = request();
        $date = $this->date ?: $request->input('date');
        $time = $this->time ?: $request->input('time');
        
        // If we don't have both date and time, skip validation
        if (!$date || !$time) {
            return;
        }

        // Check for existing events with the same date and time
        $query = Event::where('date', $date)->where('time', $time);
        
        // Exclude current event if we're updating
        if ($this->excludeEventId) {
            $query->where('id', '!=', $this->excludeEventId);
        }

        $conflictingEvent = $query->first();

        if ($conflictingEvent) {
            $fail("An event '{$conflictingEvent->title}' already exists on {$date} at {$time}. Please choose a different date or time.");
        }
    }
}
