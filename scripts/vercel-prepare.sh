#!/usr/bin/env bash
# Vercel build — slim api/laravel copy, then DELETE all root bloat before packaging.
set -euo pipefail

if [ ! -f "api/vendor.tar.gz" ]; then
  echo "ERROR: api/vendor.tar.gz missing. Run: powershell -File scripts/pack.ps1"
  exit 1
fi

echo "==> vendor.tar.gz in repo: $(du -sh api/vendor.tar.gz | cut -f1) (downloaded at runtime, NOT bundled)"

echo "==> Building slim Laravel into api/laravel/..."
rm -rf api/laravel api/php-fpm-bin api/vendor.tar.gz
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

echo "    api/laravel: $(du -sh api/laravel | cut -f1)"

echo "==> NUCLEAR CLEANUP — remove folders Vercel incorrectly bundles into the function..."
rm -rf \
  node_modules \
  vendor \
  app \
  bootstrap \
  config \
  routes \
  database \
  resources \
  storage \
  tests \
  artisan

echo "==> Function bundle (api/ only, no vendor.tar.gz):"
du -sh api api/laravel api/main.go 2>/dev/null || true
ls -la api/
echo "==> Done. vendor loads from jsDelivr at runtime using VERCEL_GIT_REPO_* env vars."
