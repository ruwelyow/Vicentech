#!/usr/bin/env bash
# Runs on Vercel (Linux) during build — packs vendor, bundles PHP-FPM, copies slim Laravel source.
set -euo pipefail

PHP_VERSION="8.4.18"
BASE_URL="https://dl.static-php.dev/static-php-cli/bulk"

echo "==> [1/3] Packing vendor.tar.gz..."
curl -fsSL "$BASE_URL/php-${PHP_VERSION}-cli-linux-x86_64.tar.gz" | tar -xz -C /tmp
chmod +x /tmp/php
curl -fsSL https://getcomposer.org/installer | /tmp/php -- --install-dir=/tmp --filename=composer
/tmp/php /tmp/composer install \
  --no-dev \
  --no-interaction \
  --no-scripts \
  --prefer-dist \
  --optimize-autoloader \
  --classmap-authoritative

mkdir -p api
tar -czf api/vendor.tar.gz \
  --exclude='vendor/*/tests' \
  --exclude='vendor/*/Tests' \
  --exclude='vendor/*/Test' \
  --exclude='vendor/*/doc' \
  --exclude='vendor/*/docs' \
  --exclude='vendor/*/examples' \
  --exclude='vendor/*/.git' \
  vendor/

echo "    vendor.tar.gz: $(du -sh api/vendor.tar.gz | cut -f1)"

echo "==> [2/3] Bundling PHP-FPM binary..."
PHP_FPM_DEST="api/php-fpm-bin"
PHP_FPM_URL="${PHP_FPM_URL:-$BASE_URL/php-${PHP_VERSION}-fpm-linux-x86_64.tar.gz}"
TMP_TAR=$(mktemp /tmp/php-fpm-XXXXXX.tar.gz)
curl -fsSL "$PHP_FPM_URL" -o "$TMP_TAR"
tar -xzf "$TMP_TAR" -C /tmp php-fpm
mv /tmp/php-fpm "$PHP_FPM_DEST"
chmod +x "$PHP_FPM_DEST"
rm -f "$TMP_TAR"
echo "    php-fpm-bin: $(du -sh "$PHP_FPM_DEST" | cut -f1)"

echo "==> [3/3] Copying slim Laravel bundle (no images/node_modules)..."
rm -rf api/laravel
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
echo "==> Vercel prepare complete."
