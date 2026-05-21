# One-Command Fix and Run Migrations
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fix and Run Migrations" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we can connect
Write-Host "Checking database connection..." -ForegroundColor Yellow
$status = npx prisma migrate status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Cannot connect to database. Check your .env file." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "STEP 1: Fix Permissions (REQUIRED)" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "Run this command in a NEW terminal (as postgres superuser):" -ForegroundColor White
Write-Host ""
$fixCmd = 'psql -U postgres -d agileflow_db -c "GRANT ALL ON SCHEMA public TO agileflow; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO agileflow; CREATE EXTENSION IF NOT EXISTS pg_stat_statements; CREATE EXTENSION IF NOT EXISTS vector;"'
Write-Host $fixCmd -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter after you've run the command above..." -ForegroundColor Gray
Read-Host

# Deploy migrations
Write-Host ""
Write-Host "STEP 2: Deploying Migrations" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migrations deployed!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "STEP 3: Generating Prisma Client" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host "⚠️  Stop backend server first!" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    
    npx prisma generate
    
    Write-Host ""
    Write-Host "STEP 4: Verifying" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    npx prisma migrate status
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  ✅ ALL DONE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Restart your backend server now." -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure you:" -ForegroundColor Yellow
    Write-Host "  1. Ran the permission fix command" -ForegroundColor Gray
    Write-Host "  2. Entered correct postgres password" -ForegroundColor Gray
    Write-Host "  3. Database is running" -ForegroundColor Gray
}

