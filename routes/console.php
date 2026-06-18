<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule automatic membership status updates
Schedule::command('membership:update-status')
    ->daily()
    ->at('02:00')
    ->description('Update membership statuses based on user activity');
