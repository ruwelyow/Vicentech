<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CertificateTemplate;

class UpdateBaptismTemplate extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'template:update-baptism';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update the baptism certificate template with the new layout';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Updating baptism certificate template...');
        
        // Get the new template data from the model
        $newTemplateData = CertificateTemplate::createDefaultTemplate('baptism');
        
        // Find existing baptism templates
        $existingTemplates = CertificateTemplate::where('certificate_type', 'baptism')
            ->where('is_default', true)
            ->get();
        
        if ($existingTemplates->isEmpty()) {
            $this->info('No existing default baptism template found. Creating new one...');
            $newTemplateData->save();
            $this->info('New baptism template created successfully!');
            return 0;
        }
        
        // Update all existing default templates
        foreach ($existingTemplates as $template) {
            $this->info("Updating template ID: {$template->id} - {$template->name}");
            
            $template->update([
                'template_data' => $newTemplateData->template_data,
                'description' => 'Updated template matching the Certificate of Baptism format'
            ]);
        }
        
        // Delete the temporary template we created
        $newTemplateData->delete();
        
        $this->info('Baptism certificate template updated successfully!');
        $this->info('The new layout with italicized labels and proper positioning is now active.');
        
        return 0;
    }
}
