<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CertificateTemplate;

class UpdateDeathTemplate extends Command
{
    protected $signature = 'template:update-death';
    protected $description = 'Updates the existing death certificate template in the database to the latest default layout.';

    public function handle()
    {
        $this->info('Updating death certificate template...');

        $defaultTemplateData = CertificateTemplate::createDefaultTemplate('death')->template_data;

        $deathTemplates = CertificateTemplate::where('certificate_type', 'death')->get();

        if ($deathTemplates->isEmpty()) {
            $this->info('No existing death templates found. Creating a new default one.');
            CertificateTemplate::createDefaultTemplate('death');
        } else {
            foreach ($deathTemplates as $template) {
                $this->info("Updating template ID: {$template->id} - {$template->name}");
                $template->update(['template_data' => $defaultTemplateData]);
            }
        }

        $this->info('Death certificate template updated successfully!');
        $this->info('The new layout matching the image is now active.');
    }
}
