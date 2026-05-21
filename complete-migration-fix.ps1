# Complete Migration Fix Script
Write-Host "🔧 Complete Migration Fix" -ForegroundColor Cyan
Write-Host ""

# Step 1: Fix permissions and create extensions
Write-Host "Step 1: Setting up database permissions and extensions..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  You need to run this SQL script as postgres superuser:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  psql -U postgres -d agileflow_db -f fix-permissions-and-migrate.sql" -ForegroundColor Green
Write-Host ""
Write-Host "Or manually run in psql:" -ForegroundColor Cyan
Write-Host "  psql -U postgres" -ForegroundColor Gray
Write-Host "  \c agileflow_db" -ForegroundColor Gray
Write-Host "  GRANT ALL ON SCHEMA public TO agileflow;" -ForegroundColor Gray
Write-Host "  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO agileflow;" -ForegroundColor Gray
Write-Host "  CREATE EXTENSION IF NOT EXISTS pg_stat_statements;" -ForegroundColor Gray
Write-Host "  CREATE EXTENSION IF NOT EXISTS vector;" -ForegroundColor Gray
Write-Host ""

$permissionsFixed = Read-Host "Have you fixed permissions and created extensions? (y/n)"
if ($permissionsFixed -ne "y") {
    Write-Host "❌ Please fix permissions first, then run this script again." -ForegroundColor Red
    Write-Host ""
    Write-Host "Quick command:" -ForegroundColor Cyan
    Write-Host '  psql -U postgres -d agileflow_db -c "GRANT ALL ON SCHEMA public TO agileflow; CREATE EXTENSION IF NOT EXISTS pg_stat_statements; CREATE EXTENSION IF NOT EXISTS vector;"' -ForegroundColor Green
    exit 1
}

# Step 2: Deploy migrations
Write-Host ""
Write-Host "Step 2: Deploying migrations..." -ForegroundColor Yellow
npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migrations deployed successfully!" -ForegroundColor Green
    
    # Step 3: Generate Prisma Client
    Write-Host ""
    Write-Host "Step 3: Generating Prisma Client..." -ForegroundColor Yellow
    Write-Host "⚠️  Make sure backend server is stopped" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    
    npx prisma generate
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Prisma client generated!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Prisma generate had file lock issues - restart backend and run: npx prisma generate" -ForegroundColor Yellow
    }
    
    # Step 4: Verify
    Write-Host ""
    Write-Host "Step 4: Verifying..." -ForegroundColor Yellow
    npx prisma migrate status
    
    Write-Host ""
    Write-Host "✨ All done! Restart your backend server." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Migration failed. Check errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  1. Permissions not granted - run the SQL commands above" -ForegroundColor Gray
    Write-Host "  2. Extensions not created - run CREATE EXTENSION commands" -ForegroundColor Gray
    Write-Host "  3. Database connection issues - check DATABASE_URL in .env" -ForegroundColor Gray
}

