# Pack vendor for Vercel (run after composer.json changes)
# Requires: composer, tar (Git Bash or WSL on Windows)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --classmap-authoritative

New-Item -ItemType Directory -Force -Path api | Out-Null
if (Test-Path api/vendor.tar.gz) { Remove-Item api/vendor.tar.gz -Force }

tar -czf api/vendor.tar.gz -C . vendor

$mb = [math]::Round((Get-Item api/vendor.tar.gz).Length / 1MB, 2)
Write-Host "Created api/vendor.tar.gz ($mb MB)"
Write-Host "Commit: git add api/vendor.tar.gz && git commit -m 'chore: update vendor.tar.gz'"
