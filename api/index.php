<?php

/**
 * Vercel serverless entry point for Laravel.
 * Redirects writable storage to /tmp because Vercel's filesystem is read-only.
 */

define('LARAVEL_START', microtime(true));

$tmpStorage = '/tmp/laravel-storage';

foreach ([
    'framework/cache/data',
    'framework/sessions',
    'framework/views',
    'logs',
    'app/public',
    'app/private',
] as $dir) {
    $path = $tmpStorage.'/'.$dir;
    if (! is_dir($path)) {
        mkdir($path, 0755, true);
    }
}

if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

require __DIR__.'/../vendor/autoload.php';

/** @var \Illuminate\Foundation\Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->useStoragePath($tmpStorage);

$app->handleRequest(Illuminate\Http\Request::capture());
