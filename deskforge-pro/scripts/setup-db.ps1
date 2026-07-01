<#
  DeskForge Pro — One-click real database setup.

  Usage (from the deskforge-pro folder):
      ./scripts/setup-db.ps1 -DatabaseUrl "postgresql://user:pass@host/db?sslmode=require"

  What it does:
    1. Writes a production .env (real DB, secure NEXTAUTH_SECRET, demo mode OFF)
    2. Generates the Prisma client
    3. Creates the database schema (migrate)
    4. Seeds demo users, tickets, SLA policy, KB and canned responses
#>
param(
  [Parameter(Mandatory = $true)]
  [string]$DatabaseUrl
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "==> Generating a secure NEXTAUTH_SECRET..." -ForegroundColor Cyan
$secret = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

Write-Host "==> Writing .env..." -ForegroundColor Cyan
@"
# DeskForge Pro — production database configuration
LOCAL_DEMO_NO_DB="false"
DATABASE_URL="$DatabaseUrl"
NEXTAUTH_SECRET="$secret"
NEXTAUTH_URL="http://localhost:3000"
TENANT_MODE="single"
EMAIL_FROM="DeskForge Pro <support@example.com>"
"@ | Set-Content -Path ".env" -Encoding UTF8

Write-Host "==> Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate

Write-Host "==> Applying database schema (migrate)..." -ForegroundColor Cyan
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
  Write-Host "   migrate deploy found no migrations — creating initial migration..." -ForegroundColor Yellow
  npx prisma migrate dev --name init
}

Write-Host "==> Seeding demo data (users, tickets, SLA, KB)..." -ForegroundColor Cyan
npx prisma db seed

Write-Host ""
Write-Host "Done. DeskForge is now connected to your real database." -ForegroundColor Green
Write-Host "Start the app with:  npm run dev" -ForegroundColor Green
Write-Host "Login:  admin / admin123" -ForegroundColor Green
