<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CertificateTemplate;

class UpdateConfirmationTemplate extends Command
{
    protected $signature = 'template:update-confirmation';
    protected $description = 'Updates the existing confirmation certificate template in the database to the latest default layout.';

    public function handle()
    {
        $this->info('Updating confirmation certificate template...');

        $defaultTemplateData = CertificateTemplate::createDefaultTemplate('confirmation')->template_data;

        $confirmationTemplates = CertificateTemplate::where('certificate_type', 'confirmation')->get();

        if ($confirmationTemplates->isEmpty()) {
            $this->info('No existing confirmation templates found. Creating a new default one.');
            CertificateTemplate::createDefaultTemplate('confirmation');
        } else {
            foreach ($confirmationTemplates as $template) {
                $this->info("Updating template ID: {$template->id} - {$template->name}");
                $template->update(['template_data' => $defaultTemplateData]);
            }
        }

        $this->info('Confirmation certificate template updated successfully!');
        $this->info('The new layout matching the image is now active.');
    }
}
