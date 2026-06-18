<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CertificateTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'certificate_type',
        'description',
        'template_data',
        'default_data',
        'is_active',
        'is_default'
    ];

    protected $casts = [
        'template_data' => 'array',
        'default_data' => 'array',
        'is_active' => 'boolean',
        'is_default' => 'boolean'
    ];

    // Relationships
    public function certificateReleases()
    {
        return $this->hasMany(CertificateRelease::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('certificate_type', $type);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    // Methods
    public static function getDefaultTemplateForType($type)
    {
        return static::where('certificate_type', $type)
                   ->where('is_default', true)
                   ->where('is_active', true)
                   ->first();
    }

    public static function createDefaultTemplate($type)
    {
        $defaultTemplate = [
            'baptism' => [
                'elements' => [
                    [
                        'id' => 'issues_this',
                        'type' => 'text',
                        'content' => 'issues this',
                        'position' => ['x' => 0, 'y' => 100],
                        'style' => [
                            'fontSize' => 12,
                            'fontStyle' => 'normal',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'title',
                        'type' => 'text',
                        'content' => 'Certificate of Baptism',
                        'position' => ['x' => 0, 'y' => 130],
                        'style' => [
                            'fontSize' => 32,
                            'fontWeight' => 'bold',
                            'fontFamily' => '"Uncial Antiqua", "MedievalSharp", "Monotype Old English Text Std", "Old English Text MT", serif',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'letterSpacing' => '2px',
                            'textTransform' => 'uppercase',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'acknowledge',
                        'type' => 'text',
                        'content' => 'to officially acknowledge that',
                        'position' => ['x' => 0, 'y' => 190],
                        'style' => [
                            'fontSize' => 12,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'child_of',
                        'type' => 'text',
                        'content' => 'child of',
                        'position' => ['x' => 97, 'y' => 250],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'child_name',
                        'type' => 'text',
                        'content' => '{{mother_name}}',
                        'position' => ['x' => 180, 'y' => 250],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '500px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'and_parent',
                        'type' => 'text',
                        'content' => 'and',
                        'position' => ['x' => 97, 'y' => 290],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'parent_name',
                        'type' => 'text',
                        'content' => '{{father_name}}',
                        'position' => ['x' => 140, 'y' => 290],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '540px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'born_on',
                        'type' => 'text',
                        'content' => 'born on the',
                        'position' => ['x' => 97, 'y' => 330],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'birth_day',
                        'type' => 'text',
                        'content' => '{{birth_day}}',
                        'position' => ['x' => 190, 'y' => 330],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '40px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'day_of',
                        'type' => 'text',
                        'content' => 'day of',
                        'position' => ['x' => 240, 'y' => 330],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'birth_month',
                        'type' => 'text',
                        'content' => '{{birth_month}}',
                        'position' => ['x' => 310, 'y' => 330],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '120px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'birth_year',
                        'type' => 'text',
                        'content' => '{{birth_year}}',
                        'position' => ['x' => 440, 'y' => 330],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '80px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'in',
                        'type' => 'text',
                        'content' => 'in',
                        'position' => ['x' => 97, 'y' => 370],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'birth_place',
                        'type' => 'text',
                        'content' => '{{birth_place}}',
                        'position' => ['x' => 125, 'y' => 370],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '555px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'baptized_text',
                        'type' => 'text',
                        'content' => 'was solemnly baptized according to the Rite of the Roman Catholic Church',
                        'position' => ['x' => 0, 'y' => 420],
                        'style' => [
                            'fontSize' => 13,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'baptized_on',
                        'type' => 'text',
                        'content' => 'on the',
                        'position' => ['x' => 97, 'y' => 470],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'baptism_day',
                        'type' => 'text',
                        'content' => '{{baptism_day}}',
                        'position' => ['x' => 170, 'y' => 470],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '40px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'baptism_day_of',
                        'type' => 'text',
                        'content' => 'day of',
                        'position' => ['x' => 220, 'y' => 470],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'baptism_month',
                        'type' => 'text',
                        'content' => '{{baptism_month}}',
                        'position' => ['x' => 290, 'y' => 470],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '120px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'baptism_year',
                        'type' => 'text',
                        'content' => '{{baptism_year}}',
                        'position' => ['x' => 420, 'y' => 470],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '80px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'by_rev',
                        'type' => 'text',
                        'content' => 'by the Rev.',
                        'position' => ['x' => 97, 'y' => 510],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'priest_name',
                        'type' => 'text',
                        'content' => '{{priest_name}}',
                        'position' => ['x' => 195, 'y' => 510],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '485px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'sponsors_being',
                        'type' => 'text',
                        'content' => 'the sponsors being',
                        'position' => ['x' => 97, 'y' => 550],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'sponsor1',
                        'type' => 'text',
                        'content' => '{{sponsor1}}',
                        'position' => ['x' => 240, 'y' => 550],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '440px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'and_sponsor',
                        'type' => 'text',
                        'content' => 'and',
                        'position' => ['x' => 97, 'y' => 590],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'sponsor2',
                        'type' => 'text',
                        'content' => '{{sponsor2}}',
                        'position' => ['x' => 140, 'y' => 590],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '540px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'liber_baptismorum',
                        'type' => 'text',
                        'content' => 'as it appears on our Liber Baptismorum',
                        'position' => ['x' => 0, 'y' => 640],
                        'style' => [
                            'fontSize' => 12,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'no_label',
                        'type' => 'text',
                        'content' => 'No.',
                        'position' => ['x' => 97, 'y' => 690],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'record_number',
                        'type' => 'text',
                        'content' => '{{record_number}}',
                        'position' => ['x' => 135, 'y' => 690],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '180px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'page_label',
                        'type' => 'text',
                        'content' => 'Page',
                        'position' => ['x' => 350, 'y' => 690],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'page_number',
                        'type' => 'text',
                        'content' => '{{page_number}}',
                        'position' => ['x' => 400, 'y' => 690],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '80px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'line_label',
                        'type' => 'text',
                        'content' => 'Line',
                        'position' => ['x' => 500, 'y' => 690],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'line_number',
                        'type' => 'text',
                        'content' => '{{line_number}}',
                        'position' => ['x' => 540, 'y' => 690],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '80px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'date_issued_label',
                        'type' => 'text',
                        'content' => 'Date Issued:',
                        'position' => ['x' => 97, 'y' => 730],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'date_issued',
                        'type' => 'text',
                        'content' => '{{date_issued}}',
                        'position' => ['x' => 195, 'y' => 730],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '180px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'purpose_label',
                        'type' => 'text',
                        'content' => 'Purpose:',
                        'position' => ['x' => 400, 'y' => 730],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'purpose',
                        'type' => 'text',
                        'content' => '{{purpose}}',
                        'position' => ['x' => 470, 'y' => 730],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '210px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'priest_name_rev',
                        'type' => 'text',
                        'content' => 'Rev. {{priest_name}}',
                        'position' => ['x' => 520, 'y' => 960],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 200
                        ]
                    ],
                    [
                        'id' => 'priest_name_line',
                        'type' => 'text',
                        'content' => '_______________________',
                        'position' => ['x' => 520, 'y' => 980],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 200
                        ]
                    ],
                    [
                        'id' => 'priest_name_label',
                        'type' => 'text',
                        'content' => 'Priest Name',
                        'position' => ['x' => 520, 'y' => 1000],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 200
                        ]
                    ]
                ],
                'background' => '#ffffff',
                'dimensions' => ['width' => 794, 'height' => 1123]
            ],
            'confirmation' => [
                'elements' => [
                    [
                        'id' => 'issues_this',
                        'type' => 'text',
                        'content' => 'issues this',
                        'position' => ['x' => 0, 'y' => 50],
                        'style' => [
                            'fontSize' => 11,
                            'fontStyle' => 'normal',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'title',
                        'type' => 'text',
                        'content' => 'Certificate of Confirmation',
                        'position' => ['x' => 0, 'y' => 80],
                        'style' => [
                            'fontSize' => 32,
                            'fontWeight' => 'bold',
                            'fontFamily' => '"Uncial Antiqua", "MedievalSharp", "Monotype Old English Text Std", "Old English Text MT", "Old English", "Blackletter", "Fraktur", "Gothic", serif',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'letterSpacing' => '3px',
                            'textTransform' => 'uppercase',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'acknowledge',
                        'type' => 'text',
                        'content' => 'to officially acknowledge that',
                        'position' => ['x' => 0, 'y' => 130],
                        'style' => [
                            'fontSize' => 12,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'child_of_label',
                        'type' => 'text',
                        'content' => 'child of',
                        'position' => ['x' => 100, 'y' => 180],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'recipient_name',
                        'type' => 'text',
                        'content' => '{{recipient_name}}',
                        'position' => ['x' => 200, 'y' => 180],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '480px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'and_parent',
                        'type' => 'text',
                        'content' => 'and',
                        'position' => ['x' => 100, 'y' => 220],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'parent_name',
                        'type' => 'text',
                        'content' => '{{parent_name}}',
                        'position' => ['x' => 150, 'y' => 220],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '530px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'baptized_on',
                        'type' => 'text',
                        'content' => 'was baptized on the',
                        'position' => ['x' => 100, 'y' => 260],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'baptism_day',
                        'type' => 'text',
                        'content' => '{{baptism_day}}',
                        'position' => ['x' => 250, 'y' => 260],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '100px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'of_month',
                        'type' => 'text',
                        'content' => 'of',
                        'position' => ['x' => 360, 'y' => 260],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'baptism_month',
                        'type' => 'text',
                        'content' => '{{baptism_month}}',
                        'position' => ['x' => 390, 'y' => 260],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '180px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'baptism_year',
                        'type' => 'text',
                        'content' => '{{baptism_year}}',
                        'position' => ['x' => 580, 'y' => 260],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '100px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'at_label',
                        'type' => 'text',
                        'content' => 'at',
                        'position' => ['x' => 100, 'y' => 300],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'baptism_place',
                        'type' => 'text',
                        'content' => '{{birth_place}}',
                        'position' => ['x' => 130, 'y' => 300],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '550px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'confirmation_statement_line1',
                        'type' => 'text',
                        'content' => 'has been sealed with the Gift of the Holy Spirit, through',
                        'position' => ['x' => 0, 'y' => 360],
                        'style' => [
                            'fontSize' => 12,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'confirmation_statement_line2',
                        'type' => 'text',
                        'content' => 'the laying on of the hand and anointing of chrism, in the',
                        'position' => ['x' => 0, 'y' => 380],
                        'style' => [
                            'fontSize' => 12,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'confirmation_statement_line3',
                        'type' => 'text',
                        'content' => 'Holy Sacrament of Confirmation',
                        'position' => ['x' => 0, 'y' => 400],
                        'style' => [
                            'fontSize' => 12,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'on_the',
                        'type' => 'text',
                        'content' => 'on the',
                        'position' => ['x' => 100, 'y' => 420],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'confirmation_day',
                        'type' => 'text',
                        'content' => '{{baptism_day}}',
                        'position' => ['x' => 180, 'y' => 420],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '80px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'day_of',
                        'type' => 'text',
                        'content' => 'day of',
                        'position' => ['x' => 280, 'y' => 420],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'confirmation_month',
                        'type' => 'text',
                        'content' => '{{baptism_month}}',
                        'position' => ['x' => 360, 'y' => 420],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '180px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'confirmation_year',
                        'type' => 'text',
                        'content' => '{{baptism_year}}',
                        'position' => ['x' => 550, 'y' => 420],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '100px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'according_to_rite',
                        'type' => 'text',
                        'content' => 'according to the Rite of the Roman Catholic Church',
                        'position' => ['x' => 0, 'y' => 460],
                        'style' => [
                            'fontSize' => 12,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => '"Uncial Antiqua", "MedievalSharp", "Monotype Old English Text Std", "Old English Text MT", "Old English", "Blackletter", "Fraktur", "Gothic", serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'by_the',
                        'type' => 'text',
                        'content' => 'by the',
                        'position' => ['x' => 100, 'y' => 500],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'priest_name_confirmation',
                        'type' => 'text',
                        'content' => '{{priest_name}}',
                        'position' => ['x' => 150, 'y' => 500],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '530px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'sponsors_being',
                        'type' => 'text',
                        'content' => 'the sponsors being',
                        'position' => ['x' => 100, 'y' => 540],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'sponsor1',
                        'type' => 'text',
                        'content' => '{{sponsor1}}',
                        'position' => ['x' => 250, 'y' => 540],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '430px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'and_sponsor',
                        'type' => 'text',
                        'content' => 'and',
                        'position' => ['x' => 100, 'y' => 580],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'sponsor2',
                        'type' => 'text',
                        'content' => '{{sponsor2}}',
                        'position' => ['x' => 150, 'y' => 580],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '530px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'liber_confirmatorum',
                        'type' => 'text',
                        'content' => 'as it appears on our Liber Confirmatorum',
                        'position' => ['x' => 0, 'y' => 630],
                        'style' => [
                            'fontSize' => 12,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => '"Uncial Antiqua", "MedievalSharp", "Monotype Old English Text Std", "Old English Text MT", "Old English", "Blackletter", "Fraktur", "Gothic", serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'no_label',
                        'type' => 'text',
                        'content' => 'No.',
                        'position' => ['x' => 100, 'y' => 680],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'record_number',
                        'type' => 'text',
                        'content' => '{{record_number}}',
                        'position' => ['x' => 140, 'y' => 680],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '200px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'date_issued_label',
                        'type' => 'text',
                        'content' => 'Date Issued:',
                        'position' => ['x' => 100, 'y' => 720],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'date_issued',
                        'type' => 'text',
                        'content' => '{{date_issued}}',
                        'position' => ['x' => 200, 'y' => 720],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '200px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'page_label',
                        'type' => 'text',
                        'content' => 'Page',
                        'position' => ['x' => 400, 'y' => 680],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'page_number',
                        'type' => 'text',
                        'content' => '{{page_number}}',
                        'position' => ['x' => 450, 'y' => 680],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '120px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'line_label',
                        'type' => 'text',
                        'content' => 'Line',
                        'position' => ['x' => 580, 'y' => 680],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'line_number',
                        'type' => 'text',
                        'content' => '{{line_number}}',
                        'position' => ['x' => 630, 'y' => 680],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '50px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'purpose_label',
                        'type' => 'text',
                        'content' => 'Purpose:',
                        'position' => ['x' => 400, 'y' => 720],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'purpose',
                        'type' => 'text',
                        'content' => '{{purpose}}',
                        'position' => ['x' => 480, 'y' => 720],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '200px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'priest_name_rev',
                        'type' => 'text',
                        'content' => 'Rev. {{priest_name}}',
                        'position' => ['x' => 520, 'y' => 960],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 200
                        ]
                    ],
                    [
                        'id' => 'priest_name_line',
                        'type' => 'text',
                        'content' => '_______________________',
                        'position' => ['x' => 520, 'y' => 980],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 200
                        ]
                    ],
                    [
                        'id' => 'priest_name_label',
                        'type' => 'text',
                        'content' => 'Priest Name',
                        'position' => ['x' => 520, 'y' => 1000],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 200
                        ]
                    ]
                ],
                'background' => '#ffffff',
                'dimensions' => ['width' => 794, 'height' => 1123]
            ],
            'marriage' => [
                'elements' => [
                    [
                        'id' => 'issues_this',
                        'type' => 'text',
                        'content' => 'issues this',
                        'position' => ['x' => 0, 'y' => 50],
                        'style' => [
                            'fontSize' => 11,
                            'fontStyle' => 'normal',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'title',
                        'type' => 'text',
                        'content' => 'Certificate of Marriage',
                        'position' => ['x' => 0, 'y' => 80],
                        'style' => [
                            'fontSize' => 32,
                            'fontWeight' => 'bold',
                            'fontFamily' => '"Uncial Antiqua", "MedievalSharp", "Monotype Old English Text Std", "Old English Text MT", "Old English", "Blackletter", "Fraktur", "Gothic", serif',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'letterSpacing' => '3px',
                            'textTransform' => 'uppercase',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'acknowledge',
                        'type' => 'text',
                        'content' => 'to officially acknowledge that',
                        'position' => ['x' => 0, 'y' => 130],
                        'style' => [
                            'fontSize' => 12,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    // Groom Section
                    [
                        'id' => 'groom_of_label',
                        'type' => 'text',
                        'content' => 'of',
                        'position' => ['x' => 100, 'y' => 180],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'groom_name',
                        'type' => 'text',
                        'content' => '{{groom_name}}',
                        'position' => ['x' => 130, 'y' => 180],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '550px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'groom_status_label',
                        'type' => 'text',
                        'content' => 'status',
                        'position' => ['x' => 100, 'y' => 220],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'groom_status',
                        'type' => 'text',
                        'content' => '{{groom_status}}',
                        'position' => ['x' => 160, 'y' => 220],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '520px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'aged_label',
                        'type' => 'text',
                        'content' => ', aged',
                        'position' => ['x' => 370, 'y' => 220],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'groom_age',
                        'type' => 'text',
                        'content' => '{{groom_age}}',
                        'position' => ['x' => 430, 'y' => 220],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '100px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'son_of',
                        'type' => 'text',
                        'content' => 'son of',
                        'position' => ['x' => 100, 'y' => 260],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'groom_father',
                        'type' => 'text',
                        'content' => '{{groom_father}}',
                        'position' => ['x' => 170, 'y' => 260],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '190px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'and_groom',
                        'type' => 'text',
                        'content' => 'and',
                        'position' => ['x' => 370, 'y' => 260],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'groom_mother',
                        'type' => 'text',
                        'content' => '{{groom_mother}}',
                        'position' => ['x' => 410, 'y' => 260],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '270px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'ampersand',
                        'type' => 'text',
                        'content' => '&',
                        'position' => ['x' => 0, 'y' => 300],
                        'style' => [
                            'fontSize' => 24,
                            'fontWeight' => 'bold',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    // Bride Section
                    [
                        'id' => 'bride_of_label',
                        'type' => 'text',
                        'content' => 'of',
                        'position' => ['x' => 100, 'y' => 340],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'bride_name',
                        'type' => 'text',
                        'content' => '{{bride_name}}',
                        'position' => ['x' => 130, 'y' => 340],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '550px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'bride_status_label',
                        'type' => 'text',
                        'content' => 'status',
                        'position' => ['x' => 100, 'y' => 380],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'bride_status',
                        'type' => 'text',
                        'content' => '{{bride_status}}',
                        'position' => ['x' => 160, 'y' => 380],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '520px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'aged_bride_label',
                        'type' => 'text',
                        'content' => ', aged',
                        'position' => ['x' => 370, 'y' => 380],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'bride_age',
                        'type' => 'text',
                        'content' => '{{bride_age}}',
                        'position' => ['x' => 430, 'y' => 380],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '100px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'daughter_of',
                        'type' => 'text',
                        'content' => 'daughter of',
                        'position' => ['x' => 100, 'y' => 420],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'bride_father',
                        'type' => 'text',
                        'content' => '{{bride_father}}',
                        'position' => ['x' => 200, 'y' => 420],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '160px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'and_bride',
                        'type' => 'text',
                        'content' => 'and',
                        'position' => ['x' => 370, 'y' => 420],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'bride_mother',
                        'type' => 'text',
                        'content' => '{{bride_mother}}',
                        'position' => ['x' => 410, 'y' => 420],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '270px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    // Marriage Declaration
                    [
                        'id' => 'marriage_declaration_line1',
                        'type' => 'text',
                        'content' => 'called by God to an intimate communion of life and love,',
                        'position' => ['x' => 0, 'y' => 480],
                        'style' => [
                            'fontSize' => 12,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'marriage_declaration_line2',
                        'type' => 'text',
                        'content' => 'have established between themselves a partnership of their whole life',
                        'position' => ['x' => 0, 'y' => 500],
                        'style' => [
                            'fontSize' => 12,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'marriage_declaration_line3',
                        'type' => 'text',
                        'content' => 'in the Holy Sacrament of Marriage',
                        'position' => ['x' => 0, 'y' => 520],
                        'style' => [
                            'fontSize' => 12,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    // Marriage Date
                    [
                        'id' => 'on_the',
                        'type' => 'text',
                        'content' => 'on the',
                        'position' => ['x' => 100, 'y' => 560],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'marriage_day',
                        'type' => 'text',
                        'content' => '{{marriage_day}}',
                        'position' => ['x' => 180, 'y' => 560],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '80px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'day_of_marriage',
                        'type' => 'text',
                        'content' => 'day of',
                        'position' => ['x' => 280, 'y' => 560],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'marriage_month',
                        'type' => 'text',
                        'content' => '{{marriage_month}}',
                        'position' => ['x' => 360, 'y' => 560],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '180px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'marriage_year',
                        'type' => 'text',
                        'content' => '{{marriage_year}}',
                        'position' => ['x' => 550, 'y' => 560],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '100px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'according_to_rite',
                        'type' => 'text',
                        'content' => 'according to the Rite of the Roman Catholic Church',
                        'position' => ['x' => 0, 'y' => 600],
                        'style' => [
                            'fontSize' => 12,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => '"Uncial Antiqua", "MedievalSharp", "Monotype Old English Text Std", "Old English Text MT", "Old English", "Blackletter", "Fraktur", "Gothic", serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'liber_matrimoniorum',
                        'type' => 'text',
                        'content' => 'as it appears on our Liber Matrimoniorum',
                        'position' => ['x' => 0, 'y' => 630],
                        'style' => [
                            'fontSize' => 12,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'solemnized_by',
                        'type' => 'text',
                        'content' => 'solemnized by',
                        'position' => ['x' => 100, 'y' => 640],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'priest_name',
                        'type' => 'text',
                        'content' => '{{priest_name}}',
                        'position' => ['x' => 220, 'y' => 640],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '460px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'sponsors_being',
                        'type' => 'text',
                        'content' => 'the sponsors being',
                        'position' => ['x' => 100, 'y' => 680],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'sponsor1',
                        'type' => 'text',
                        'content' => '{{sponsor1}}',
                        'position' => ['x' => 250, 'y' => 680],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '430px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'and_sponsor',
                        'type' => 'text',
                        'content' => 'and',
                        'position' => ['x' => 100, 'y' => 720],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'sponsor2',
                        'type' => 'text',
                        'content' => '{{sponsor2}}',
                        'position' => ['x' => 150, 'y' => 720],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '530px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'no_label',
                        'type' => 'text',
                        'content' => 'No.',
                        'position' => ['x' => 200, 'y' => 810],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'record_number',
                        'type' => 'text',
                        'content' => '{{record_number}}',
                        'position' => ['x' => 240, 'y' => 810],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '150px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'page_label',
                        'type' => 'text',
                        'content' => 'Page',
                        'position' => ['x' => 450, 'y' => 810],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'page_number',
                        'type' => 'text',
                        'content' => '{{page_number}}',
                        'position' => ['x' => 500, 'y' => 810],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '150px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'line_label',
                        'type' => 'text',
                        'content' => 'Line',
                        'position' => ['x' => 450, 'y' => 850],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'line_number',
                        'type' => 'text',
                        'content' => '{{line_number}}',
                        'position' => ['x' => 500, 'y' => 850],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '150px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'date_issued_label',
                        'type' => 'text',
                        'content' => 'Date Issued:',
                        'position' => ['x' => 200, 'y' => 850],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'date_issued',
                        'type' => 'text',
                        'content' => '{{date_issued}}',
                        'position' => ['x' => 300, 'y' => 850],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '200px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'purpose_label',
                        'type' => 'text',
                        'content' => 'Purpose:',
                        'position' => ['x' => 100, 'y' => 890],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'purpose',
                        'type' => 'text',
                        'content' => '{{purpose}}',
                        'position' => ['x' => 180, 'y' => 890],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '500px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'priest_name_rev',
                        'type' => 'text',
                        'content' => 'Rev. {{priest_name}}',
                        'position' => ['x' => 520, 'y' => 960],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 200
                        ]
                    ],
                    [
                        'id' => 'priest_name_line',
                        'type' => 'text',
                        'content' => '_______________________',
                        'position' => ['x' => 520, 'y' => 980],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 200
                        ]
                    ],
                    [
                        'id' => 'priest_name_label',
                        'type' => 'text',
                        'content' => 'Priest Name',
                        'position' => ['x' => 520, 'y' => 1000],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 200
                        ]
                    ]
                ],
                'background' => '#ffffff',
                'dimensions' => ['width' => 794, 'height' => 1123]
            ],
            'death' => [
                'elements' => [
                    [
                        'id' => 'issues_this',
                        'type' => 'text',
                        'content' => 'issues this',
                        'position' => ['x' => 0, 'y' => 50],
                        'style' => [
                            'fontSize' => 11,
                            'fontStyle' => 'normal',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'title',
                        'type' => 'text',
                        'content' => 'Certificate of Death',
                        'position' => ['x' => 0, 'y' => 80],
                        'style' => [
                            'fontSize' => 32,
                            'fontWeight' => 'bold',
                            'fontFamily' => '"Monotype Old English Text Std", "Old English Text MT", serif',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'letterSpacing' => '3px',
                            'textTransform' => 'uppercase',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'acknowledge',
                        'type' => 'text',
                        'content' => 'to officially acknowledge that',
                        'position' => ['x' => 0, 'y' => 130],
                        'style' => [
                            'fontSize' => 12,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'died_on',
                        'type' => 'text',
                        'content' => 'died on the',
                        'position' => ['x' => 100, 'y' => 180],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'death_day',
                        'type' => 'text',
                        'content' => '{{baptism_day}}',
                        'position' => ['x' => 200, 'y' => 180],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '80px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'day_of_death',
                        'type' => 'text',
                        'content' => 'day of',
                        'position' => ['x' => 300, 'y' => 180],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'death_month',
                        'type' => 'text',
                        'content' => '{{baptism_month}}',
                        'position' => ['x' => 380, 'y' => 180],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '180px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'death_year',
                        'type' => 'text',
                        'content' => '{{baptism_year}}',
                        'position' => ['x' => 580, 'y' => 180],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '100px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'laid_to_rest',
                        'type' => 'text',
                        'content' => 'and was laid to rest according to the',
                        'position' => ['x' => 0, 'y' => 220],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'order_of_funerals',
                        'type' => 'text',
                        'content' => 'Order of Christian Funerals of the Roman Catholic Church',
                        'position' => ['x' => 0, 'y' => 250],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'burial_on',
                        'type' => 'text',
                        'content' => 'on the',
                        'position' => ['x' => 100, 'y' => 290],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'burial_day',
                        'type' => 'text',
                        'content' => '{{baptism_day}}',
                        'position' => ['x' => 180, 'y' => 290],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '80px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'day_of_burial',
                        'type' => 'text',
                        'content' => 'day of',
                        'position' => ['x' => 280, 'y' => 290],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'burial_month',
                        'type' => 'text',
                        'content' => '{{baptism_month}}',
                        'position' => ['x' => 360, 'y' => 290],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '180px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'burial_year',
                        'type' => 'text',
                        'content' => '{{baptism_year}}',
                        'position' => ['x' => 560, 'y' => 290],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '100px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'at_time_of_death',
                        'type' => 'text',
                        'content' => 'At the time of death, the deceased was aged',
                        'position' => ['x' => 100, 'y' => 340],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'deceased_age',
                        'type' => 'text',
                        'content' => '{{groom_age}}',
                        'position' => ['x' => 430, 'y' => 340],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '80px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'status_comma',
                        'type' => 'text',
                        'content' => ', status',
                        'position' => ['x' => 530, 'y' => 340],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'deceased_status',
                        'type' => 'text',
                        'content' => '{{groom_status}}',
                        'position' => ['x' => 600, 'y' => 340],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '80px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'requested_by',
                        'type' => 'text',
                        'content' => 'Requested by',
                        'position' => ['x' => 100, 'y' => 380],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'requested_by_name',
                        'type' => 'text',
                        'content' => '{{recipient_name}}',
                        'position' => ['x' => 200, 'y' => 380],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '480px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'sacraments_statement',
                        'type' => 'text',
                        'content' => 'The departed did / did not receive the Sacraments of Penance, Anointing',
                        'position' => ['x' => 0, 'y' => 420],
                        'style' => [
                            'fontSize' => 11,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'sacraments_continuation',
                        'type' => 'text',
                        'content' => 'of the sick, and the Eucharist in the form of viaticum prior death.',
                        'position' => ['x' => 0, 'y' => 440],
                        'style' => [
                            'fontSize' => 11,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'died_due_to',
                        'type' => 'text',
                        'content' => 'The deceased died due to',
                        'position' => ['x' => 100, 'y' => 480],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'cause_of_death',
                        'type' => 'text',
                        'content' => '{{purpose}}',
                        'position' => ['x' => 280, 'y' => 480],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '400px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'buried_in',
                        'type' => 'text',
                        'content' => 'and was buried in the',
                        'position' => ['x' => 100, 'y' => 520],
                        'style' => [
                            'fontSize' => 14,
                            'fontStyle' => 'italic',
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'burial_location',
                        'type' => 'text',
                        'content' => '{{birth_place}}',
                        'position' => ['x' => 250, 'y' => 520],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '430px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'after_funeral',
                        'type' => 'text',
                        'content' => 'after receiving a befitting Funeral',
                        'position' => ['x' => 0, 'y' => 560],
                        'style' => [
                            'fontSize' => 11,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'liber_defunctorum',
                        'type' => 'text',
                        'content' => 'as it appears on our Liber Defunctorum',
                        'position' => ['x' => 0, 'y' => 590],
                        'style' => [
                            'fontSize' => 12,
                            'fontStyle' => 'italic',
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 794,
                            'left' => 0
                        ]
                    ],
                    [
                        'id' => 'no_label',
                        'type' => 'text',
                        'content' => 'No.',
                        'position' => ['x' => 100, 'y' => 640],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'record_number',
                        'type' => 'text',
                        'content' => '{{record_number}}',
                        'position' => ['x' => 140, 'y' => 640],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '200px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'date_issued_label',
                        'type' => 'text',
                        'content' => 'Date Issued:',
                        'position' => ['x' => 100, 'y' => 680],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'date_issued',
                        'type' => 'text',
                        'content' => '{{date_issued}}',
                        'position' => ['x' => 200, 'y' => 680],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '140px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'page_label',
                        'type' => 'text',
                        'content' => 'Page',
                        'position' => ['x' => 400, 'y' => 640],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'page_number',
                        'type' => 'text',
                        'content' => '{{page_number}}',
                        'position' => ['x' => 450, 'y' => 640],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '100px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'line_label',
                        'type' => 'text',
                        'content' => 'Line',
                        'position' => ['x' => 400, 'y' => 680],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'line_number',
                        'type' => 'text',
                        'content' => '{{line_number}}',
                        'position' => ['x' => 450, 'y' => 680],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '100px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'purpose_label',
                        'type' => 'text',
                        'content' => 'Purpose:',
                        'position' => ['x' => 400, 'y' => 720],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'purpose',
                        'type' => 'text',
                        'content' => '{{purpose}}',
                        'position' => ['x' => 470, 'y' => 720],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'left',
                            'color' => '#000000',
                            'borderBottom' => '1px solid #000000',
                            'minWidth' => '200px',
                            'display' => 'inline-block',
                            'height' => '20px',
                            'fontFamily' => 'serif'
                        ]
                    ],
                    [
                        'id' => 'priest_name_rev',
                        'type' => 'text',
                        'content' => 'Rev. {{priest_name}}',
                        'position' => ['x' => 520, 'y' => 960],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 200
                        ]
                    ],
                    [
                        'id' => 'priest_name_line',
                        'type' => 'text',
                        'content' => '_______________________',
                        'position' => ['x' => 520, 'y' => 980],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 200
                        ]
                    ],
                    [
                        'id' => 'priest_name_label',
                        'type' => 'text',
                        'content' => 'Priest Name',
                        'position' => ['x' => 520, 'y' => 1000],
                        'style' => [
                            'fontSize' => 14,
                            'textAlign' => 'center',
                            'color' => '#000000',
                            'fontFamily' => 'serif',
                            'width' => 200
                        ]
                    ]
                ],
                'background' => '#ffffff',
                'dimensions' => ['width' => 794, 'height' => 1123]
            ]
        ];

        $templateData = $defaultTemplate[$type] ?? $defaultTemplate['baptism'];
        
        return static::create([
            'name' => ucfirst($type) . ' Certificate Template',
            'certificate_type' => $type,
            'description' => 'Default template for ' . $type . ' certificates',
            'template_data' => $templateData,
            'default_data' => [],
            'is_active' => true,
            'is_default' => true
        ]);
    }
}
