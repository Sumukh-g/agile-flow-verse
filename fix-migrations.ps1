# Fix Migration Issues Script
Write-Host "🔧 Fixing Migration Issues..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Create extensions as superuser
Write-Host "Step 1: Creating PostgreSQL extensions (requires superuser)..." -ForegroundColor Yellow
Write-Host "You'll need to run this as postgres superuser:" -ForegroundColor Gray
Write-Host "  psql -U postgres -d agileflow_db -f setup-extensions.sql" -ForegroundColor Green
Write-Host ""

$createExtensions = Read-Host "Have you created the extensions? (y/n)"
if ($createExtensions -ne "y") {
    Write-Host "⚠️  Please create extensions first, then run this script again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To create extensions:" -ForegroundColor Cyan
    Write-Host "  1. Connect as postgres: psql -U postgres" -ForegroundColor Gray
    Write-Host "  2. Connect to database: \c agileflow_db" -ForegroundColor Gray
    Write-Host "  3. Run: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;" -ForegroundColor Gray
    Write-Host "  4. Run: CREATE EXTENSION IF NOT EXISTS vector;" -ForegroundColor Gray
    exit 1
}

# Step 2: Try to deploy migrations (doesn't use shadow database)
Write-Host ""
Write-Host "Step 2: Deploying migrations..." -ForegroundColor Yellow
Write-Host "Using 'migrate deploy' (doesn't require shadow database)..." -ForegroundColor Gray

npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migrations applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Step 3: Generating Prisma client..." -ForegroundColor Yellow
    npx prisma generate
    Write-Host ""
    Write-Host "✅ All done! Your database is ready." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Migration failed. Check the error above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: You can try running migrations manually:" -ForegroundColor Yellow
    Write-Host "  npx prisma migrate dev --skip-seed" -ForegroundColor Gray
}

