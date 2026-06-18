<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\CertificateTemplate;

class CertificateTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            [
                'name' => 'Elegant Baptismal Certificate',
                'certificate_type' => 'baptism',
                'description' => 'Elegant template for baptismal certificates with decorative borders',
                'template_data' => [
                    'elements' => [
                        [
                            'id' => 'border_top',
                            'type' => 'decoration',
                            'content' => 'border',
                            'position' => ['x' => 0, 'y' => 0],
                            'style' => [
                                'width' => '100%',
                                'height' => '60px',
                                'background' => 'linear-gradient(90deg, #CD8B3E 0%, #F4E4BC 50%, #CD8B3E 100%)',
                                'borderRadius' => '0 0 20px 20px'
                            ]
                        ],
                        [
                            'id' => 'church_logo',
                            'type' => 'image',
                            'content' => '/images/church-logo.png',
                            'position' => ['x' => 350, 'y' => 20],
                            'style' => [
                                'width' => '100px',
                                'height' => '100px',
                                'borderRadius' => '50%',
                                'border' => '3px solid #CD8B3E',
                                'objectFit' => 'cover'
                            ]
                        ],
                        [
                            'id' => 'title',
                            'type' => 'text',
                            'content' => 'BAPTISMAL CERTIFICATE',
                            'position' => ['x' => 50, 'y' => 140],
                            'style' => [
                                'fontSize' => 28,
                                'fontWeight' => 'bold',
                                'textAlign' => 'center',
                                'color' => '#CD8B3E',
                                'textShadow' => '2px 2px 4px rgba(0,0,0,0.1)',
                                'letterSpacing' => '2px'
                            ]
                        ],
                        [
                            'id' => 'subtitle',
                            'type' => 'text',
                            'content' => 'Certificate of Holy Baptism',
                            'position' => ['x' => 50, 'y' => 180],
                            'style' => [
                                'fontSize' => 16,
                                'fontStyle' => 'italic',
                                'textAlign' => 'center',
                                'color' => '#8B4513',
                                'fontFamily' => 'serif'
                            ]
                        ],
                        [
                            'id' => 'name_label',
                            'type' => 'text',
                            'content' => 'This certifies that',
                            'position' => ['x' => 50, 'y' => 220],
                            'style' => [
                                'fontSize' => 14,
                                'textAlign' => 'center',
                                'color' => '#5C4B38',
                                'fontStyle' => 'italic'
                            ]
                        ],
                        [
                            'id' => 'name',
                            'type' => 'text',
                            'content' => '{{recipient_name}}',
                            'position' => ['x' => 50, 'y' => 250],
                            'style' => [
                                'fontSize' => 24,
                                'fontWeight' => 'bold',
                                'textAlign' => 'center',
                                'color' => '#3F2E1E',
                                'textDecoration' => 'underline',
                                'textDecorationColor' => '#CD8B3E',
                                'textDecorationThickness' => '2px'
                            ]
                        ],
                        [
                            'id' => 'baptism_text',
                            'type' => 'text',
                            'content' => 'was baptized in the name of the Father, and of the Son, and of the Holy Spirit',
                            'position' => ['x' => 50, 'y' => 290],
                            'style' => [
                                'fontSize' => 14,
                                'textAlign' => 'center',
                                'color' => '#5C4B38',
                                'fontStyle' => 'italic',
                                'lineHeight' => '1.4'
                            ]
                        ],
                        [
                            'id' => 'date_label',
                            'type' => 'text',
                            'content' => 'on the',
                            'position' => ['x' => 50, 'y' => 330],
                            'style' => [
                                'fontSize' => 14,
                                'textAlign' => 'center',
                                'color' => '#5C4B38'
                            ]
                        ],
                        [
                            'id' => 'date',
                            'type' => 'text',
                            'content' => '{{certificate_date}}',
                            'position' => ['x' => 50, 'y' => 360],
                            'style' => [
                                'fontSize' => 18,
                                'fontWeight' => 'bold',
                                'textAlign' => 'center',
                                'color' => '#3F2E1E',
                                'backgroundColor' => '#F4E4BC',
                                'padding' => '8px 16px',
                                'borderRadius' => '8px',
                                'border' => '2px solid #CD8B3E'
                            ]
                        ],
                        [
                            'id' => 'priest_signature',
                            'type' => 'signature',
                            'content' => '{{priest_signature}}',
                            'position' => ['x' => 200, 'y' => 420],
                            'style' => [
                                'width' => 200,
                                'height' => 80,
                                'border' => '2px dashed #CD8B3E',
                                'borderRadius' => '8px',
                                'backgroundColor' => '#FDF8F2'
                            ]
                        ],
                        [
                            'id' => 'priest_name',
                            'type' => 'text',
                            'content' => 'Rev. {{priest_name}}',
                            'position' => ['x' => 200, 'y' => 510],
                            'style' => [
                                'fontSize' => 14,
                                'textAlign' => 'center',
                                'color' => '#5C4B38',
                                'fontWeight' => 'bold'
                            ]
                        ],
                        [
                            'id' => 'reference',
                            'type' => 'text',
                            'content' => 'Certificate Reference: {{unique_reference}}',
                            'position' => ['x' => 50, 'y' => 550],
                            'style' => [
                                'fontSize' => 12,
                                'textAlign' => 'center',
                                'color' => '#8B7355',
                                'fontFamily' => 'monospace',
                                'backgroundColor' => '#F4E4BC',
                                'padding' => '4px 8px',
                                'borderRadius' => '4px'
                            ]
                        ],
                        [
                            'id' => 'border_bottom',
                            'type' => 'decoration',
                            'content' => 'border',
                            'position' => ['x' => 0, 'y' => 580],
                            'style' => [
                                'width' => '100%',
                                'height' => '20px',
                                'background' => 'linear-gradient(90deg, #CD8B3E 0%, #F4E4BC 50%, #CD8B3E 100%)',
                                'borderRadius' => '20px 20px 0 0'
                            ]
                        ]
                    ],
                    'background' => '#FDF8F2',
                    'dimensions' => ['width' => 800, 'height' => 600],
                    'border' => '3px solid #CD8B3E',
                    'borderRadius' => '15px',
                    'boxShadow' => '0 8px 32px rgba(205, 139, 62, 0.3)'
                ],
                'default_data' => [],
                'is_active' => true,
                'is_default' => true
            ],
            [
                'name' => 'Classic Marriage Certificate',
                'certificate_type' => 'marriage',
                'description' => 'Classic template for marriage certificates with elegant design',
                'template_data' => [
                    'elements' => [
                        [
                            'id' => 'header_decoration',
                            'type' => 'decoration',
                            'content' => 'ornament',
                            'position' => ['x' => 0, 'y' => 0],
                            'style' => [
                                'width' => '100%',
                                'height' => '80px',
                                'background' => 'linear-gradient(135deg, #8B4513 0%, #CD8B3E 50%, #8B4513 100%)',
                                'borderRadius' => '0 0 25px 25px',
                                'position' => 'relative'
                            ]
                        ],
                        [
                            'id' => 'heart_icon',
                            'type' => 'image',
                            'content' => '/images/heart-icon.png',
                            'position' => ['x' => 375, 'y' => 25],
                            'style' => [
                                'width' => '50px',
                                'height' => '50px',
                                'filter' => 'brightness(0) invert(1)'
                            ]
                        ],
                        [
                            'id' => 'title',
                            'type' => 'text',
                            'content' => 'MARRIAGE CERTIFICATE',
                            'position' => ['x' => 50, 'y' => 100],
                            'style' => [
                                'fontSize' => 32,
                                'fontWeight' => 'bold',
                                'textAlign' => 'center',
                                'color' => '#8B4513',
                                'textShadow' => '2px 2px 4px rgba(0,0,0,0.1)',
                                'letterSpacing' => '3px',
                                'fontFamily' => 'serif'
                            ]
                        ],
                        [
                            'id' => 'subtitle',
                            'type' => 'text',
                            'content' => 'Certificate of Holy Matrimony',
                            'position' => ['x' => 50, 'y' => 140],
                            'style' => [
                                'fontSize' => 16,
                                'fontStyle' => 'italic',
                                'textAlign' => 'center',
                                'color' => '#CD8B3E',
                                'fontFamily' => 'serif'
                            ]
                        ],
                        [
                            'id' => 'couple_photo',
                            'type' => 'image',
                            'content' => '/images/default-couple.png',
                            'position' => ['x' => 350, 'y' => 180],
                            'style' => [
                                'width' => '100px',
                                'height' => '100px',
                                'borderRadius' => '50%',
                                'border' => '4px solid #CD8B3E',
                                'objectFit' => 'cover',
                                'boxShadow' => '0 4px 12px rgba(0,0,0,0.2)'
                            ]
                        ],
                        [
                            'id' => 'marriage_text',
                            'type' => 'text',
                            'content' => 'This certifies that the marriage between',
                            'position' => ['x' => 50, 'y' => 200],
                            'style' => [
                                'fontSize' => 14,
                                'textAlign' => 'center',
                                'color' => '#5C4B38',
                                'fontStyle' => 'italic'
                            ]
                        ],
                        [
                            'id' => 'groom_name',
                            'type' => 'text',
                            'content' => '{{groom_name}}',
                            'position' => ['x' => 50, 'y' => 230],
                            'style' => [
                                'fontSize' => 20,
                                'fontWeight' => 'bold',
                                'textAlign' => 'center',
                                'color' => '#3F2E1E',
                                'textDecoration' => 'underline',
                                'textDecorationColor' => '#CD8B3E'
                            ]
                        ],
                        [
                            'id' => 'and_text',
                            'type' => 'text',
                            'content' => 'and',
                            'position' => ['x' => 50, 'y' => 260],
                            'style' => [
                                'fontSize' => 16,
                                'textAlign' => 'center',
                                'color' => '#8B4513',
                                'fontStyle' => 'italic',
                                'fontWeight' => 'bold'
                            ]
                        ],
                        [
                            'id' => 'bride_name',
                            'type' => 'text',
                            'content' => '{{bride_name}}',
                            'position' => ['x' => 50, 'y' => 290],
                            'style' => [
                                'fontSize' => 20,
                                'fontWeight' => 'bold',
                                'textAlign' => 'center',
                                'color' => '#3F2E1E',
                                'textDecoration' => 'underline',
                                'textDecorationColor' => '#CD8B3E'
                            ]
                        ],
                        [
                            'id' => 'date_label',
                            'type' => 'text',
                            'content' => 'was solemnized on',
                            'position' => ['x' => 50, 'y' => 330],
                            'style' => [
                                'fontSize' => 14,
                                'textAlign' => 'center',
                                'color' => '#5C4B38',
                                'fontStyle' => 'italic'
                            ]
                        ],
                        [
                            'id' => 'date',
                            'type' => 'text',
                            'content' => '{{certificate_date}}',
                            'position' => ['x' => 50, 'y' => 360],
                            'style' => [
                                'fontSize' => 18,
                                'fontWeight' => 'bold',
                                'textAlign' => 'center',
                                'color' => '#3F2E1E',
                                'backgroundColor' => '#F4E4BC',
                                'padding' => '10px 20px',
                                'borderRadius' => '10px',
                                'border' => '3px solid #CD8B3E',
                                'boxShadow' => '0 2px 8px rgba(0,0,0,0.1)'
                            ]
                        ],
                        [
                            'id' => 'priest_signature',
                            'type' => 'signature',
                            'content' => '{{priest_signature}}',
                            'position' => ['x' => 200, 'y' => 420],
                            'style' => [
                                'width' => 200,
                                'height' => 80,
                                'border' => '2px dashed #CD8B3E',
                                'borderRadius' => '8px',
                                'backgroundColor' => '#FDF8F2'
                            ]
                        ],
                        [
                            'id' => 'priest_name',
                            'type' => 'text',
                            'content' => 'Rev. {{priest_name}}',
                            'position' => ['x' => 200, 'y' => 510],
                            'style' => [
                                'fontSize' => 14,
                                'textAlign' => 'center',
                                'color' => '#5C4B38',
                                'fontWeight' => 'bold'
                            ]
                        ],
                        [
                            'id' => 'reference',
                            'type' => 'text',
                            'content' => 'Certificate Reference: {{unique_reference}}',
                            'position' => ['x' => 50, 'y' => 550],
                            'style' => [
                                'fontSize' => 12,
                                'textAlign' => 'center',
                                'color' => '#8B7355',
                                'fontFamily' => 'monospace',
                                'backgroundColor' => '#F4E4BC',
                                'padding' => '4px 8px',
                                'borderRadius' => '4px'
                            ]
                        ]
                    ],
                    'background' => '#FDF8F2',
                    'dimensions' => ['width' => 800, 'height' => 600],
                    'border' => '4px solid #8B4513',
                    'borderRadius' => '20px',
                    'boxShadow' => '0 12px 40px rgba(139, 69, 19, 0.3)'
                ],
                'default_data' => [],
                'is_active' => true,
                'is_default' => true
            ],
            [
                'name' => 'Modern Confirmation Certificate',
                'certificate_type' => 'confirmation',
                'description' => 'Modern template for confirmation certificates with contemporary design',
                'template_data' => [
                    'elements' => [
                        [
                            'id' => 'header_banner',
                            'type' => 'decoration',
                            'content' => 'banner',
                            'position' => ['x' => 0, 'y' => 0],
                            'style' => [
                                'width' => '100%',
                                'height' => '100px',
                                'background' => 'linear-gradient(45deg, #4A90E2 0%, #7ED321 50%, #4A90E2 100%)',
                                'borderRadius' => '0 0 30px 30px'
                            ]
                        ],
                        [
                            'id' => 'cross_icon',
                            'type' => 'image',
                            'content' => '/images/cross-icon.png',
                            'position' => ['x' => 375, 'y' => 35],
                            'style' => [
                                'width' => '30px',
                                'height' => '30px',
                                'filter' => 'brightness(0) invert(1)'
                            ]
                        ],
                        [
                            'id' => 'title',
                            'type' => 'text',
                            'content' => 'CONFIRMATION CERTIFICATE',
                            'position' => ['x' => 50, 'y' => 120],
                            'style' => [
                                'fontSize' => 30,
                                'fontWeight' => 'bold',
                                'textAlign' => 'center',
                                'color' => '#2C3E50',
                                'textShadow' => '1px 1px 3px rgba(0,0,0,0.1)',
                                'letterSpacing' => '2px'
                            ]
                        ],
                        [
                            'id' => 'subtitle',
                            'type' => 'text',
                            'content' => 'Certificate of Confirmation in the Holy Spirit',
                            'position' => ['x' => 50, 'y' => 160],
                            'style' => [
                                'fontSize' => 16,
                                'fontStyle' => 'italic',
                                'textAlign' => 'center',
                                'color' => '#7F8C8D',
                                'fontFamily' => 'serif'
                            ]
                        ],
                        [
                            'id' => 'confirmation_photo',
                            'type' => 'image',
                            'content' => '/images/default-confirmation.png',
                            'position' => ['x' => 350, 'y' => 200],
                            'style' => [
                                'width' => '100px',
                                'height' => '100px',
                                'borderRadius' => '50%',
                                'border' => '4px solid #4A90E2',
                                'objectFit' => 'cover',
                                'boxShadow' => '0 6px 20px rgba(74, 144, 226, 0.3)'
                            ]
                        ],
                        [
                            'id' => 'confirmation_text',
                            'type' => 'text',
                            'content' => 'This certifies that',
                            'position' => ['x' => 50, 'y' => 220],
                            'style' => [
                                'fontSize' => 14,
                                'textAlign' => 'center',
                                'color' => '#5C4B38',
                                'fontStyle' => 'italic'
                            ]
                        ],
                        [
                            'id' => 'name',
                            'type' => 'text',
                            'content' => '{{recipient_name}}',
                            'position' => ['x' => 50, 'y' => 250],
                            'style' => [
                                'fontSize' => 24,
                                'fontWeight' => 'bold',
                                'textAlign' => 'center',
                                'color' => '#2C3E50',
                                'textDecoration' => 'underline',
                                'textDecorationColor' => '#4A90E2',
                                'textDecorationThickness' => '2px'
                            ]
                        ],
                        [
                            'id' => 'confirmation_desc',
                            'type' => 'text',
                            'content' => 'has received the Sacrament of Confirmation',
                            'position' => ['x' => 50, 'y' => 290],
                            'style' => [
                                'fontSize' => 14,
                                'textAlign' => 'center',
                                'color' => '#5C4B38',
                                'fontStyle' => 'italic',
                                'lineHeight' => '1.4'
                            ]
                        ],
                        [
                            'id' => 'date_label',
                            'type' => 'text',
                            'content' => 'on the',
                            'position' => ['x' => 50, 'y' => 330],
                            'style' => [
                                'fontSize' => 14,
                                'textAlign' => 'center',
                                'color' => '#5C4B38'
                            ]
                        ],
                        [
                            'id' => 'date',
                            'type' => 'text',
                            'content' => '{{certificate_date}}',
                            'position' => ['x' => 50, 'y' => 360],
                            'style' => [
                                'fontSize' => 18,
                                'fontWeight' => 'bold',
                                'textAlign' => 'center',
                                'color' => '#2C3E50',
                                'backgroundColor' => '#E8F4FD',
                                'padding' => '10px 20px',
                                'borderRadius' => '10px',
                                'border' => '3px solid #4A90E2',
                                'boxShadow' => '0 2px 8px rgba(74, 144, 226, 0.2)'
                            ]
                        ],
                        [
                            'id' => 'priest_signature',
                            'type' => 'signature',
                            'content' => '{{priest_signature}}',
                            'position' => ['x' => 200, 'y' => 420],
                            'style' => [
                                'width' => 200,
                                'height' => 80,
                                'border' => '2px dashed #4A90E2',
                                'borderRadius' => '8px',
                                'backgroundColor' => '#F8FCFE'
                            ]
                        ],
                        [
                            'id' => 'priest_name',
                            'type' => 'text',
                            'content' => 'Rev. {{priest_name}}',
                            'position' => ['x' => 200, 'y' => 510],
                            'style' => [
                                'fontSize' => 14,
                                'textAlign' => 'center',
                                'color' => '#5C4B38',
                                'fontWeight' => 'bold'
                            ]
                        ],
                        [
                            'id' => 'reference',
                            'type' => 'text',
                            'content' => 'Certificate Reference: {{unique_reference}}',
                            'position' => ['x' => 50, 'y' => 550],
                            'style' => [
                                'fontSize' => 12,
                                'textAlign' => 'center',
                                'color' => '#7F8C8D',
                                'fontFamily' => 'monospace',
                                'backgroundColor' => '#E8F4FD',
                                'padding' => '4px 8px',
                                'borderRadius' => '4px'
                            ]
                        ]
                    ],
                    'background' => '#F8FCFE',
                    'dimensions' => ['width' => 800, 'height' => 600],
                    'border' => '3px solid #4A90E2',
                    'borderRadius' => '15px',
                    'boxShadow' => '0 8px 32px rgba(74, 144, 226, 0.2)'
                ],
                'default_data' => [],
                'is_active' => true,
                'is_default' => true
            ]
        ];

        foreach ($templates as $template) {
            CertificateTemplate::create($template);
        }
    }
}
