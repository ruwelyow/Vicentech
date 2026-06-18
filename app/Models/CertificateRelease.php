<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class CertificateRelease extends Model
{
    use HasFactory;

    protected $fillable = [
        'certificate_request_id',
        'certificate_template_id',
        'unique_reference',
        'certificate_type',
        'recipient_name',
        'recipient_email',
        'certificate_date',
        'priest_name',
        'priest_signature_path',
        'certificate_data',
        'pdf_path',
        'status',
        'printed_at',
        'emailed_at',
        'notes'
    ];

    protected $casts = [
        'certificate_data' => 'array',
        'certificate_date' => 'date',
        'printed_at' => 'datetime',
        'emailed_at' => 'datetime'
    ];

    // Relationships
    public function certificateRequest()
    {
        return $this->belongsTo(CertificateRequest::class);
    }

    public function certificateTemplate()
    {
        return $this->belongsTo(CertificateTemplate::class);
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('certificate_type', $type);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('certificate_date', [$startDate, $endDate]);
    }

    // Methods
    public function generateUniqueReference()
    {
        if (!$this->unique_reference) {
            $year = date('Y');
            $typeCode = strtoupper(substr($this->certificate_type, 0, 3));
            $randomString = Str::random(6);
            
            $this->unique_reference = sprintf('%s-%d-%s', $typeCode, $year, $randomString);
            $this->save();
        }
        
        return $this->unique_reference;
    }

    public function markAsPrinted()
    {
        $this->status = 'printed';
        $this->printed_at = now();
        $this->save();
    }

    public function markAsEmailed()
    {
        $this->status = 'emailed';
        $this->emailed_at = now();
        $this->save();
    }

    public function markAsCompleted()
    {
        $this->status = 'completed';
        $this->save();
    }

    public function getStatusColor()
    {
        return match($this->status) {
            'draft' => 'bg-gray-100 text-gray-800',
            'generated' => 'bg-blue-100 text-blue-800',
            'printed' => 'bg-yellow-100 text-yellow-800',
            'emailed' => 'bg-green-100 text-green-800',
            'completed' => 'bg-green-100 text-green-800',
            default => 'bg-gray-100 text-gray-800'
        };
    }

    public function getStatusLabel()
    {
        return match($this->status) {
            'draft' => 'Draft',
            'generated' => 'Generated',
            'printed' => 'Printed',
            'emailed' => 'Emailed',
            'completed' => 'Completed',
            default => 'Unknown'
        };
    }
}
