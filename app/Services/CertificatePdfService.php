<?php

namespace App\Services;

use App\Models\CertificateRelease;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

class CertificatePdfService
{
    /**
     * Generate PDF for certificate release
     */
    public function generatePdf(CertificateRelease $certificateRelease)
    {
        // Check if GD extension is loaded (required by DomPDF for image processing)
        if (!extension_loaded('gd')) {
            throw new \Exception('The PHP GD extension is required, but is not installed. Please install and enable the GD extension in your PHP configuration.');
        }
        
        $html = $this->generateHtml($certificateRelease);
        
        // Debug: Log HTML snippet if images are present (first 5000 chars)
        if (strpos($html, '<img') !== false) {
            \Log::info('PDF HTML contains images', [
                'html_length' => strlen($html),
                'image_count' => substr_count($html, '<img'),
                'has_base64' => strpos($html, 'data:image') !== false
            ]);
        }
        
        try {
            // Generate PDF using DomPDF
            $pdf = Pdf::loadHTML($html);
            // Use portrait orientation for A4 (baptism certificates are portrait)
            $pdf->setPaper('A4', 'portrait');
            
            // Enable remote file access for images (though we're using base64 now)
            $pdf->setOptions([
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
                'isPhpEnabled' => false,
            ]);
            
            // Store the PDF file
            $pdfPath = 'certificates/' . $certificateRelease->unique_reference . '.pdf';
            Storage::put($pdfPath, $pdf->output());
            
            return $pdfPath;
        } catch (\Exception $e) {
            // Check if the error is related to GD extension
            if (strpos($e->getMessage(), 'GD') !== false || strpos($e->getMessage(), 'gd') !== false) {
                throw new \Exception('The PHP GD extension is required, but is not installed. Please install and enable the GD extension in your PHP configuration.');
            }
            throw $e;
        }
    }
    
    /**
     * Generate HTML representation of the certificate
     */
    private function generateHtml(CertificateRelease $certificateRelease)
    {
        $certificateData = $certificateRelease->certificate_data;
        $templateElements = $certificateData['template_elements'] ?? [];
        $formData = $certificateData['form_data'] ?? [];
        
        // Get dimensions from template or use A4 default
        $template = $certificateRelease->certificateTemplate;
        $dimensions = $template->template_data['dimensions'] ?? ['width' => 794, 'height' => 1123];
        $width = $dimensions['width'] ?? 794;
        $height = $dimensions['height'] ?? 1123;
        
        // Get background color from template or use default
        $background = $template->template_data['background'] ?? '#F9F5F0';
        
        // Get watermark image path - convert to base64 for PDF compatibility
        $watermarkPath = public_path('images/COA-DIOCESAN-SHRINE-SVF-MAMATID-SOLO.svg');
        $watermarkBase64 = '';
        try {
            if (file_exists($watermarkPath)) {
                $watermarkContent = file_get_contents($watermarkPath);
                if ($watermarkContent !== false) {
                    $watermarkBase64 = 'data:image/svg+xml;base64,' . base64_encode($watermarkContent);
                }
            }
        } catch (\Exception $e) {
            // If watermark fails to load, continue without it
            \Log::warning('Failed to load watermark: ' . $e->getMessage());
        }
        
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Certificate - ' . $certificateRelease->unique_reference . '</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 0;
        }
        body {
            margin: 0;
            padding: 0;
            font-family: "Times New Roman", serif;
            background-color: ' . $background . ';
        }
        .certificate {
            position: relative;
            width: ' . $width . 'px;
            height: ' . $height . 'px;
            background-color: ' . $background . ';
            margin: 0 auto;
            padding: 0;
            box-sizing: border-box;
            /* Ensure A4 portrait dimensions */
            page-break-after: always;
        }';
        
        // Only add watermark CSS if we have a valid watermark
        if (!empty($watermarkBase64)) {
            $html .= '
        .watermark {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url("' . $watermarkBase64 . '");
            background-repeat: no-repeat;
            background-position: center;
            background-size: 60% auto;
            opacity: 0.1;
            pointer-events: none;
            z-index: 0;
        }';
        }
        
        $html .= '
        /* Ensure all elements with border-bottom show the line */
        [class^="element-"] {
            box-sizing: border-box;
        }';
        
        foreach ($templateElements as $element) {
            $style = $element['style'] ?? [];
            $position = $element['position'] ?? ['x' => 0, 'y' => 0];
            
            $css = '';
            if (isset($style['fontSize'])) $css .= 'font-size: ' . $style['fontSize'] . 'px; ';
            if (isset($style['fontWeight'])) $css .= 'font-weight: ' . $style['fontWeight'] . '; ';
            if (isset($style['fontStyle'])) $css .= 'font-style: ' . $style['fontStyle'] . '; ';
            if (isset($style['fontFamily'])) $css .= 'font-family: ' . $style['fontFamily'] . '; ';
            if (isset($style['textAlign'])) $css .= 'text-align: ' . $style['textAlign'] . '; ';
            if (isset($style['color'])) $css .= 'color: ' . $style['color'] . '; ';
            if (isset($style['width'])) $css .= 'width: ' . $style['width'] . 'px; ';
            if (isset($style['height'])) $css .= 'height: ' . $style['height'] . 'px; ';
            if (isset($style['minWidth'])) $css .= 'min-width: ' . $style['minWidth'] . '; ';
            if (isset($style['display'])) $css .= 'display: ' . $style['display'] . '; ';
            if (isset($style['letterSpacing'])) $css .= 'letter-spacing: ' . $style['letterSpacing'] . '; ';
            if (isset($style['textTransform'])) $css .= 'text-transform: ' . $style['textTransform'] . '; ';
            
            // Always apply border-bottom if it exists in the style, and ensure it's visible
            if (isset($style['borderBottom'])) {
                $css .= 'border-bottom: ' . $style['borderBottom'] . ' !important; ';
                $css .= 'border-top: none !important; ';
                $css .= 'border-left: none !important; ';
                $css .= 'border-right: none !important; ';
                $css .= 'min-height: 20px !important; ';
                $css .= 'display: inline-block !important; ';
            }
            
            // Add z-index to ensure elements are above watermark
            $css .= 'z-index: 1; ';
            
            $html .= '
        .element-' . $element['id'] . ' {
            position: absolute;
            left: ' . $position['x'] . 'px;
            top: ' . $position['y'] . 'px;
            ' . $css . '
        }';
        }
        
        $html .= '
    </style>
</head>
<body>
    <div class="certificate">';
        
        // Only add watermark div if we have a valid watermark
        if (!empty($watermarkBase64)) {
            $html .= '
        <!-- Watermark - Coat of Arms -->
        <div class="watermark"></div>';
        }
        
        foreach ($templateElements as $element) {
            if ($element['type'] === 'text') {
                $content = $element['content'] ?? '';
                // Replace all placeholders with actual data
                $replacements = [
                    '{{recipient_name}}' => $formData['recipient_name'] ?? '',
                    '{{child_name_line1}}' => $formData['recipient_name'] ?? '',
                    '{{child_name_line2}}' => '',
                    '{{groom_name}}' => $formData['groom_name'] ?? '',
                    '{{bride_name}}' => $formData['bride_name'] ?? '',
                    '{{groom_status}}' => $formData['groom_status'] ?? '',
                    '{{groom_age}}' => $formData['groom_age'] ?? '',
                    '{{groom_father}}' => $formData['groom_father'] ?? '',
                    '{{groom_mother}}' => $formData['groom_mother'] ?? '',
                    '{{bride_status}}' => $formData['bride_status'] ?? '',
                    '{{bride_age}}' => $formData['bride_age'] ?? '',
                    '{{bride_father}}' => $formData['bride_father'] ?? '',
                    '{{bride_mother}}' => $formData['bride_mother'] ?? '',
                    '{{marriage_day}}' => $formData['marriage_day'] ?? '',
                    '{{marriage_month}}' => $formData['marriage_month'] ?? '',
                    '{{marriage_year}}' => $formData['marriage_year'] ?? '',
                    '{{certificate_date}}' => $formData['certificate_date'] ?? '',
                    '{{priest_name}}' => $formData['priest_name'] ?? $certificateRelease->priest_name ?? '',
                    '{{parent_name}}' => $formData['parent_name'] ?? '',
                    '{{mother_name}}' => $formData['mother_name'] ?? '',
                    '{{father_name}}' => $formData['father_name'] ?? '',
                    '{{birth_day}}' => $formData['birth_day'] ?? '',
                    '{{birth_month}}' => $formData['birth_month'] ?? '',
                    '{{birth_year}}' => $formData['birth_year'] ?? '',
                    '{{birth_place}}' => $formData['birth_place'] ?? '',
                    '{{baptism_day}}' => $formData['baptism_day'] ?? '',
                    '{{baptism_month}}' => $formData['baptism_month'] ?? '',
                    '{{baptism_year}}' => $formData['baptism_year'] ?? '',
                    '{{sponsor1}}' => $formData['sponsor1'] ?? '',
                    '{{sponsor2}}' => $formData['sponsor2'] ?? '',
                    '{{record_number}}' => $formData['record_number'] ?? '',
                    '{{page_number}}' => $formData['page_number'] ?? '',
                    '{{line_number}}' => $formData['line_number'] ?? '',
                    '{{date_issued}}' => !empty($formData['date_issued']) ? date('F j, Y', strtotime($formData['date_issued'])) : date('F j, Y'),
                    '{{purpose}}' => $formData['purpose'] ?? '',
                    '{{unique_reference}}' => $certificateRelease->unique_reference ?? '',
                ];
                
                foreach ($replacements as $placeholder => $value) {
                    $content = str_replace($placeholder, $value, $content);
                }
                
                // For elements with border-bottom (blank lines), ensure they always show the line even if empty
                $displayContent = $content;
                if (isset($style['borderBottom'])) {
                    if (empty(trim($content))) {
                        // Show a non-breaking space to maintain the border line
                        $displayContent = '&nbsp;';
                    }
                    // Ensure border-bottom is always applied
                    if (!isset($style['borderBottom']) || empty($style['borderBottom'])) {
                        $css .= 'border-bottom: 1px solid #000000; ';
                    }
                    // Ensure minimum height for visibility
                    $css .= 'min-height: 20px; display: inline-block; ';
                }
                
                $html .= '<div class="element-' . $element['id'] . '">' . ($displayContent === '&nbsp;' ? $displayContent : htmlspecialchars($displayContent)) . '</div>';
            } elseif ($element['type'] === 'image') {
                $imageSrc = $element['content'] ?? '';
                if ($imageSrc) {
                    $imageBase64 = $this->convertImageToBase64($imageSrc);
                    if ($imageBase64) {
                        // Log for debugging
                        \Log::info('Converting image for PDF', [
                            'element_id' => $element['id'],
                            'original_src' => substr($imageSrc, 0, 100),
                            'base64_length' => strlen($imageBase64)
                        ]);
                        
                        // Use the base64 directly without htmlspecialchars to preserve the data URI
                        $html .= '<div class="element-' . $element['id'] . '">
                            <img src="' . $imageBase64 . '" alt="Certificate Image" style="max-width: 100%; max-height: 100%; object-fit: contain; display: block;" width="auto" height="auto" />
                        </div>';
                    } else {
                        \Log::warning('Failed to convert image to base64', [
                            'element_id' => $element['id'],
                            'image_src' => substr($imageSrc, 0, 100)
                        ]);
                    }
                }
            } elseif ($element['type'] === 'signature') {
                $signaturePath = $certificateRelease->priest_signature_path ?? '';
                if ($signaturePath && Storage::exists($signaturePath)) {
                    $signatureBase64 = $this->convertImageToBase64($signaturePath, true);
                    if ($signatureBase64) {
                        $html .= '<div class="element-' . $element['id'] . '">
                            <img src="' . htmlspecialchars($signatureBase64) . '" alt="Priest Signature" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                        </div>';
                    }
                }
            }
        }
        
        $html .= '
    </div>
</body>
</html>';
        
        return $html;
    }
    
    /**
     * Convert image to base64 data URI for PDF compatibility
     */
    private function convertImageToBase64($imageSrc, $isStoragePath = false)
    {
        try {
            $imageContent = null;
            $mimeType = 'image/png'; // default
            
            if ($isStoragePath) {
                // Handle storage path
                if (Storage::exists($imageSrc)) {
                    $imageContent = Storage::get($imageSrc);
                    $extension = pathinfo($imageSrc, PATHINFO_EXTENSION);
                    $mimeType = $this->getMimeTypeFromExtension($extension);
                }
            } elseif (filter_var($imageSrc, FILTER_VALIDATE_URL)) {
                // Handle full URL (http/https)
                $imageContent = @file_get_contents($imageSrc);
                if ($imageContent !== false) {
                    $headers = @get_headers($imageSrc, 1);
                    if (isset($headers['Content-Type'])) {
                        $mimeType = is_array($headers['Content-Type']) ? end($headers['Content-Type']) : $headers['Content-Type'];
                        $mimeType = explode(';', $mimeType)[0]; // Remove charset if present
                    }
                }
            } elseif (strpos($imageSrc, 'storage/') === 0 || strpos($imageSrc, '/storage/') === 0) {
                // Handle storage URL path
                $path = str_replace(['/storage/', 'storage/'], '', $imageSrc);
                $fullPath = storage_path('app/public/' . $path);
                if (file_exists($fullPath)) {
                    $imageContent = file_get_contents($fullPath);
                    $extension = pathinfo($fullPath, PATHINFO_EXTENSION);
                    $mimeType = $this->getMimeTypeFromExtension($extension);
                }
            } elseif (strpos($imageSrc, 'data:image') === 0) {
                // Already a data URI, but ensure it's properly formatted for DomPDF
                // DomPDF sometimes has issues with very long data URIs, but should work
                // Remove any whitespace that might cause issues
                $imageSrc = trim($imageSrc);
                // Ensure proper format
                if (preg_match('/^data:image\/[^;]+;base64,/', $imageSrc)) {
                    return $imageSrc;
                } else {
                    // Try to fix malformed data URI
                    if (strpos($imageSrc, 'base64,') !== false) {
                        return $imageSrc;
                    }
                }
            } else {
                // Handle relative/absolute file paths
                $fullPath = public_path($imageSrc);
                if (!file_exists($fullPath)) {
                    $fullPath = $imageSrc; // Try as absolute path
                }
                if (file_exists($fullPath)) {
                    $imageContent = file_get_contents($fullPath);
                    $extension = pathinfo($fullPath, PATHINFO_EXTENSION);
                    $mimeType = $this->getMimeTypeFromExtension($extension);
                }
            }
            
            if ($imageContent !== false && $imageContent !== null) {
                $base64 = base64_encode($imageContent);
                return 'data:' . $mimeType . ';base64,' . $base64;
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to convert image to base64: ' . $e->getMessage() . ' - Image: ' . $imageSrc);
        }
        
        return null;
    }
    
    /**
     * Get MIME type from file extension
     */
    private function getMimeTypeFromExtension($extension)
    {
        $mimeTypes = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'webp' => 'image/webp',
            'bmp' => 'image/bmp',
        ];
        
        $ext = strtolower($extension);
        return $mimeTypes[$ext] ?? 'image/png';
    }
    
    /**
     * Get certificate PDF URL
     */
    public function getPdfUrl(CertificateRelease $certificateRelease)
    {
        if (!$certificateRelease->pdf_path) {
            return null;
        }
        
        return Storage::url($certificateRelease->pdf_path);
    }
    
    /**
     * Download certificate PDF
     */
    public function downloadPdf(CertificateRelease $certificateRelease)
    {
        if (!$certificateRelease->pdf_path || !Storage::exists($certificateRelease->pdf_path)) {
            throw new \Exception('PDF file not found');
        }
        
        return Storage::download($certificateRelease->pdf_path, $certificateRelease->unique_reference . '.pdf');
    }
}
