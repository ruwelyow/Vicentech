#!/usr/bin/env bash
# Run after composer.json changes: bash scripts/pack.sh
set -euo pipefail

cd "$(dirname "$0")/.."

composer install \
  --no-dev \
  --no-interaction \
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

echo "Created api/vendor.tar.gz ($(du -sh api/vendor.tar.gz | cut -f1))"
echo "Commit this file: git add api/vendor.tar.gz && git commit -m 'chore: update vendor.tar.gz'"
