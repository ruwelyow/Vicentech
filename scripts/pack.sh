#!/usr/bin/env bash
# Run locally (Git Bash / WSL) after composer.json changes to refresh api/vendor.tar.gz.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "==> Installing production Composer dependencies..."
composer install \
  --no-dev \
  --no-interaction \
  --prefer-dist \
  --optimize-autoloader \
  --classmap-authoritative

mkdir -p api
echo "==> Packing vendor/ -> api/vendor.tar.gz ..."
tar -czf api/vendor.tar.gz \
  --exclude='vendor/*/tests' \
  --exclude='vendor/*/Tests' \
  --exclude='vendor/*/Test' \
  --exclude='vendor/*/*/tests' \
  --exclude='vendor/*/doc' \
  --exclude='vendor/*/docs' \
  --exclude='vendor/*/examples' \
  --exclude='vendor/*/.git' \
  vendor/

echo "==> Done: api/vendor.tar.gz ($(du -sh api/vendor.tar.gz | cut -f1))"
