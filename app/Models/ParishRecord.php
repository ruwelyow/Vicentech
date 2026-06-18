<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ParishRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'name',
        'date',
        'priest',
        'status',
        'details',
        'notes',
        'certificate_number',
        'user_id'
    ];

    protected $casts = [
        'date' => 'date',
        'details' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Scopes for filtering
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    public function scopeByMonth($query, $month, $year = null)
    {
        $year = $year ?? Carbon::now()->year;
        return $query->whereMonth('date', $month)->whereYear('date', $year);
    }

    public function scopeByYear($query, $year)
    {
        return $query->whereYear('date', $year);
    }

    public function scopeSearch($query, $searchTerm)
    {
        return $query->where(function ($q) use ($searchTerm) {
            $q->where('name', 'like', "%{$searchTerm}%")
              ->orWhere('priest', 'like', "%{$searchTerm}%")
              ->orWhere('certificate_number', 'like', "%{$searchTerm}%");
        });
    }

    // Accessors
    public function getFormattedDateAttribute()
    {
        return $this->date->format('F j, Y');
    }

    public function getTypeDisplayAttribute()
    {
        return ucfirst($this->type);
    }

    /**
     * Get the user associated with this record
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Generate certificate number if not exists
    public function generateCertificateNumber()
    {
        if (!$this->certificate_number) {
            // Ensure date exists and is a Carbon instance
            if (!$this->date) {
                // If no date, use current year
                $year = Carbon::now()->year;
            } else {
                $date = $this->date instanceof Carbon ? $this->date : Carbon::parse($this->date);
                $year = $date->year;
            }
            
            $typeCode = strtoupper(substr($this->type, 0, 3));
            
            // Get the highest sequence number for this type and year that already has a certificate_number
            $maxSequence = static::where('type', $this->type)
                                ->whereYear('date', $year)
                                ->whereNotNull('certificate_number')
                                ->where('certificate_number', 'like', $typeCode . '-' . $year . '-%')
                                ->get()
                                ->map(function($record) use ($year) {
                                    // Extract sequence from certificate_number (e.g., "CON-2025-0011" -> 11)
                                    if (preg_match('/-' . preg_quote($year, '/') . '-(\d+)$/', $record->certificate_number, $matches)) {
                                        return (int)$matches[1];
                                    }
                                    return 0;
                                })
                                ->max() ?? 0;
            
            // Next sequence number
            $sequence = $maxSequence + 1;
            
            $this->certificate_number = sprintf('%s-%d-%04d', $typeCode, $year, $sequence);
            $this->save();
        }
        
        return $this->certificate_number;
    }

    // Get default details structure based on type
    public static function getDefaultDetails($type)
    {
        switch ($type) {
            case 'baptism':
                return [
                    'father_name' => '',
                    'mother_name' => '',
                    'godparents' => '',
                    'birth_date' => '',
                    'birth_place' => ''
                ];
            case 'confirmation':
                return [
                    'sponsor' => '',
                    'bishop' => '',
                    'confirmation_name' => '',
                    'baptism_date' => ''
                ];
            case 'marriage':
                return [
                    'spouse' => '',
                    'sponsors' => ''
                ];
            case 'funeral':
                return [
                    'deceased' => '',
                    'date_of_death' => '',
                    'cause_of_death' => '',
                    'burial_place' => ''
                ];
            case 'mass':
                return [
                    'mass_type' => '',
                    'attendance' => '',
                    'offerings' => '',
                    'special_intention' => ''
                ];
            default:
                return [];
        }
    }
}