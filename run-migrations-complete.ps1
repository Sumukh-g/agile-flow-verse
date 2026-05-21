# Complete Migration Script
# This script will fix and run all migrations

Write-Host "🚀 Starting Complete Migration Process..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Check current status
Write-Host "Step 1: Checking migration status..." -ForegroundColor Yellow
npx prisma migrate status
Write-Host ""

# Step 2: Create extensions (requires manual step as superuser)
Write-Host "Step 2: Extensions Setup" -ForegroundColor Yellow
Write-Host "⚠️  You need to create extensions as postgres superuser first." -ForegroundColor Yellow
Write-Host ""
Write-Host "Run these commands in psql (as postgres user):" -ForegroundColor Cyan
Write-Host "  psql -U postgres" -ForegroundColor Green
Write-Host "  \c agileflow_db" -ForegroundColor Green
Write-Host "  CREATE EXTENSION IF NOT EXISTS pg_stat_statements;" -ForegroundColor Green
Write-Host "  CREATE EXTENSION IF NOT EXISTS vector;" -ForegroundColor Green
Write-Host "  \q" -ForegroundColor Green
Write-Host ""

$extensionsCreated = Read-Host "Have you created the extensions? (y/n)"
if ($extensionsCreated -ne "y") {
    Write-Host "❌ Please create extensions first, then run this script again." -ForegroundColor Red
    exit 1
}

# Step 3: Deploy migrations (doesn't use shadow database)
Write-Host ""
Write-Host "Step 3: Deploying migrations..." -ForegroundColor Yellow
Write-Host "Using 'migrate deploy' (doesn't require shadow database)..." -ForegroundColor Gray

$migrateResult = npx prisma migrate deploy 2>&1
$migrateOutput = $migrateResult | Out-String

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migrations deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Migration failed. Error:" -ForegroundColor Red
    Write-Host $migrateOutput -ForegroundColor Red
    
    # Try alternative: migrate dev with --skip-seed
    Write-Host ""
    Write-Host "Attempting alternative method..." -ForegroundColor Yellow
    Write-Host "Note: This may still fail on extensions in shadow database" -ForegroundColor Gray
    
    # Check if we can skip shadow database
    $env:PRISMA_MIGRATE_SKIP_GENERATE = "1"
    npx prisma migrate dev --skip-seed --create-only 2>&1 | Out-Null
    
    # If that worked, try to apply
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Trying to apply migrations..." -ForegroundColor Yellow
        npx prisma migrate deploy
    }
}

# Step 4: Generate Prisma Client
Write-Host ""
Write-Host "Step 4: Generating Prisma Client..." -ForegroundColor Yellow

# Stop backend if running to avoid file lock
Write-Host "⚠️  Make sure backend server is stopped to avoid file lock errors" -ForegroundColor Yellow
$continue = Read-Host "Continue with Prisma generate? (y/n)"
if ($continue -eq "y") {
    npx prisma generate
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Prisma client generated successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Prisma generate had issues (may be file lock - restart backend)" -ForegroundColor Yellow
    }
}

# Step 5: Verify
Write-Host ""
Write-Host "Step 5: Verifying database..." -ForegroundColor Yellow
npx prisma migrate status

Write-Host ""
Write-Host "✨ Migration process complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart your backend server" -ForegroundColor White
Write-Host "  2. Verify tables exist: npx prisma studio" -ForegroundColor White

