<?php

namespace App\Exports;

use App\Models\ParishRecord;

class ParishRecordsExport
{
    protected $type;
    protected $filters;

    public function __construct($type = null, $filters = [])
    {
        $this->type = $type;
        $this->filters = $filters;
    }

    /**
     * Get the records collection
     */
    public function getRecords()
    {
        $query = ParishRecord::query();

        // Apply filters
        if ($this->type) {
            $query->byType($this->type);
        }

        if (isset($this->filters['status']) && $this->filters['status']) {
            $query->byStatus($this->filters['status']);
        }

        if (isset($this->filters['search']) && $this->filters['search']) {
            $query->search($this->filters['search']);
        }

        if (isset($this->filters['date_from']) && $this->filters['date_from']) {
            $query->where('date', '>=', $this->filters['date_from']);
        }

        if (isset($this->filters['date_to']) && $this->filters['date_to']) {
            $query->where('date', '<=', $this->filters['date_to']);
        }

        if (isset($this->filters['month']) && $this->filters['month']) {
            $query->whereYear('date', substr($this->filters['month'], 0, 4))
                  ->whereMonth('date', substr($this->filters['month'], 5, 2));
        }

        return $query->orderBy('date', 'desc')->get();
    }

    /**
     * Get CSV headers
     */
    public function getHeaders()
    {
        return [
            'ID',
            'Type',
            'Name',
            'Date',
            'Status',
            'Priest/Celebrant',
            'Location',
            'Notes',
            'Created At',
            'Updated At'
        ];
    }

    /**
     * Convert record to CSV row
     */
    public function mapRecord($record)
    {
        $details = is_string($record->details) ? json_decode($record->details, true) : $record->details;
        
        return [
            $record->id,
            ucfirst($record->type),
            $record->name,
            $record->date ? $record->date->format('Y-m-d') : '',
            ucfirst($record->status),
            $details['priest'] ?? $details['celebrant'] ?? '',
            $details['location'] ?? $details['church'] ?? 'San Vicente Ferrer Church',
            $record->notes ?? '',
            $record->created_at ? $record->created_at->format('Y-m-d H:i:s') : '',
            $record->updated_at ? $record->updated_at->format('Y-m-d H:i:s') : ''
        ];
    }

    /**
     * Generate CSV content
     */
    public function toCsv()
    {
        $records = $this->getRecords();
        $headers = $this->getHeaders();
        
        $csvContent = [];
        
        // Add headers
        $csvContent[] = $headers;
        
        // Add data rows
        foreach ($records as $record) {
            $csvContent[] = $this->mapRecord($record);
        }
        
        return $csvContent;
    }
}
