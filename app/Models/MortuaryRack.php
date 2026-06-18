<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MortuaryRack extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'status',
        'occupant',
        'date_of_birth',
        'date_of_death',
        'date_occupied',
        'duration_years',
        'position_row',
        'position_col',
        'notes'
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'date_of_death' => 'date',
        'date_occupied' => 'date',
        'duration_years' => 'integer',
        'position_row' => 'integer',
        'position_col' => 'integer',
    ];

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    /**
     * Get the mortuary layout configuration
     */
    public static function getLayout()
    {
        return [
            'rows' => 10, // Increased from 5 to 10
            'cols' => 10  // Increased from 5 to 10
        ];
    }

    /**
     * Get statistics for the mortuary
     */
    public static function getStatistics()
    {
        $total = self::count();
        $available = self::where('status', 'available')->count();
        $occupied = self::where('status', 'occupied')->count();
        $reserved = self::where('status', 'reserved')->count();

        return [
            'total' => $total,
            'available' => $available,
            'occupied' => $occupied,
            'reserved' => $reserved
        ];
    }

    /**
     * Get all racks formatted for frontend
     */
    public static function getAllRacksFormatted()
    {
        $racks = self::orderBy('position_row')->orderBy('position_col')->get();
        
        return [
            'rows' => self::getLayout()['rows'],
            'cols' => self::getLayout()['cols'],
            'racks' => $racks->map(function ($rack) {
                return [
                    'id' => $rack->id,
                    'status' => $rack->status,
                    'occupant' => $rack->occupant,
                    'dateOfBirth' => $rack->date_of_birth ? $rack->date_of_birth->format('Y-m-d') : null,
                    'dateOfDeath' => $rack->date_of_death ? $rack->date_of_death->format('Y-m-d') : null,
                    'dateOccupied' => $rack->date_occupied ? $rack->date_occupied->format('Y-m-d') : null,
                    'durationYears' => $rack->duration_years ?? 5,
                    'position' => [$rack->position_row, $rack->position_col],
                    'notes' => $rack->notes
                ];
            })->toArray()
        ];
    }

    /**
     * Initialize default mortuary layout
     */
    public static function initializeDefaultLayout()
    {
        // Check if racks already exist
        if (self::count() > 0) {
            return;
        }

        $layout = self::getLayout();
        $racks = [];

        // Generate rack IDs and positions
        for ($row = 0; $row < $layout['rows']; $row++) {
            for ($col = 0; $col < $layout['cols']; $col++) {
                $rackId = chr(65 + $row) . ($col + 1); // A1, A2, B1, B2, etc.
                
                $racks[] = [
                    'id' => $rackId,
                    'status' => 'available',
                    'occupant' => null,
                    'date_occupied' => null,
                    'duration_years' => 5,
                    'position_row' => $row,
                    'position_col' => $col,
                    'notes' => null,
                    'created_at' => now(),
                    'updated_at' => now()
                ];
            }
        }

        self::insert($racks);
    }
}
