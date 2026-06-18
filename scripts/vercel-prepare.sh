#!/usr/bin/env bash
# Vercel build — uses pre-committed api/vendor.tar.gz, copies slim Laravel, deletes bloat.
set -euo pipefail

PROJECT_ROOT="$(pwd)"

if [ ! -f "api/vendor.tar.gz" ]; then
  echo "ERROR: api/vendor.tar.gz is missing."
  echo "Run: bash scripts/pack.sh"
  echo "Then commit api/vendor.tar.gz before deploying."
  exit 1
fi

echo "==> vendor.tar.gz: $(du -sh api/vendor.tar.gz | cut -f1)"

echo "==> Copying slim Laravel bundle into api/laravel/..."
rm -rf api/laravel api/php-fpm-bin
mkdir -p api/laravel

for d in app bootstrap config routes; do
  cp -r "$d" api/laravel/
done

mkdir -p api/laravel/database
cp -r database/migrations api/laravel/database/
[ -d database/seeders ] && cp -r database/seeders api/laravel/database/ || true
[ -d database/factories ] && cp -r database/factories api/laravel/database/ || true

mkdir -p api/laravel/resources
cp -r resources/views api/laravel/resources/
[ -d resources/lang ] && cp -r resources/lang api/laravel/resources/ || true

mkdir -p api/laravel/public
cp public/index.php api/laravel/public/
[ -f public/.htaccess ] && cp public/.htaccess api/laravel/public/ || true

mkdir -p api/laravel/storage/framework/cache/data
mkdir -p api/laravel/storage/framework/sessions
mkdir -p api/laravel/storage/framework/views
[ -f storage/framework/maintenance.php ] && cp storage/framework/maintenance.php api/laravel/storage/framework/ || true

for f in artisan composer.json composer.lock; do
  [ -f "$f" ] && cp "$f" api/laravel/ || true
done

echo "    laravel bundle: $(du -sh api/laravel | cut -f1)"

echo "==> Removing node_modules and vendor (prevents 250 MB error)..."
rm -rf node_modules vendor

echo "==> Final api/ footprint:"
du -sh api api/vendor.tar.gz api/laravel 2>/dev/null || true
echo "==> Vercel prepare complete."
