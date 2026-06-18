<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CertificateTemplate;

class UpdateMarriageTemplate extends Command
{
    protected $signature = 'template:update-marriage';
    protected $description = 'Updates the existing marriage certificate template in the database to the latest default layout.';

    public function handle()
    {
        $this->info('Updating marriage certificate template...');

        $defaultTemplateData = CertificateTemplate::createDefaultTemplate('marriage')->template_data;

        $marriageTemplates = CertificateTemplate::where('certificate_type', 'marriage')->get();

        if ($marriageTemplates->isEmpty()) {
            $this->info('No existing marriage templates found. Creating a new default one.');
            CertificateTemplate::createDefaultTemplate('marriage');
        } else {
            foreach ($marriageTemplates as $template) {
                $this->info("Updating template ID: {$template->id} - {$template->name}");
                $template->update(['template_data' => $defaultTemplateData]);
            }
        }

        $this->info('Marriage certificate template updated successfully!');
        $this->info('The new layout matching the image is now active.');
    }
}
