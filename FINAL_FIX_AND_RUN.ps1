# Final Complete Migration Fix
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Final Migration Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 1: Fix Permissions (REQUIRED)" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "Run this command as postgres superuser:" -ForegroundColor White
Write-Host ""
$fixCmd = 'psql -U postgres -d agileflow_db -c "ALTER DATABASE agileflow_db OWNER TO agileflow; GRANT ALL ON SCHEMA public TO agileflow; GRANT CREATE ON SCHEMA public TO agileflow; CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"'
Write-Host $fixCmd -ForegroundColor Green
Write-Host ""
Write-Host "OR use the SQL file:" -ForegroundColor Gray
Write-Host "  psql -U postgres -d agileflow_db -f FIX_PERMISSIONS_COMPLETE.sql" -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter after running the command..." -ForegroundColor Gray
Read-Host

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
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Did you run the permission fix command?" -ForegroundColor Gray
    Write-Host "  2. Did you enter the correct postgres password?" -ForegroundColor Gray
    Write-Host "  3. Is PostgreSQL running?" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Try running the permission fix again:" -ForegroundColor Yellow
    Write-Host $fixCmd -ForegroundColor Green
}

