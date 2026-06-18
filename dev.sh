#!/bin/bash

# Run Laravel development server
php artisan serve &

# Run queue listener
php artisan queue:listen --tries=1 &

# Run Vite development server
npm run dev &

# Wait for all background processes
wait 