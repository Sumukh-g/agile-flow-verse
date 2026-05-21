# Auto Fix and Run Migrations
# This script will guide you through fixing and running all migrations

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Complete Migration Fix and Run" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Instructions for fixing permissions
Write-Host "STEP 1: Fix Database Permissions" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "You need to run this command as postgres superuser:" -ForegroundColor White
Write-Host ""
$fixCommand = 'psql -U postgres -d agileflow_db -c "GRANT ALL ON SCHEMA public TO agileflow; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO agileflow; CREATE EXTENSION IF NOT EXISTS pg_stat_statements; CREATE EXTENSION IF NOT EXISTS vector;"'
Write-Host $fixCommand -ForegroundColor Green
Write-Host ""
Write-Host "Copy the command above, run it in a new terminal, enter postgres password when prompted." -ForegroundColor Gray
Write-Host ""

$continue = Read-Host "Have you run the command above and it succeeded? (y/n)"
if ($continue -ne "y") {
    Write-Host ""
    Write-Host "Please run the command first, then run this script again." -ForegroundColor Red
    Write-Host ""
    Write-Host "The command is:" -ForegroundColor Yellow
    Write-Host $fixCommand -ForegroundColor Green
    exit 1
}

# Step 2: Deploy migrations
Write-Host ""
Write-Host "STEP 2: Deploying Migrations" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

try {
    npx prisma migrate deploy
    if ($LASTEXITCODE -ne 0) {
        throw "Migration failed with exit code $LASTEXITCODE"
    }
    Write-Host ""
    Write-Host "✅ Migrations deployed successfully!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ Migration failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "  1. You ran Step 1 successfully" -ForegroundColor Gray
    Write-Host "  2. Database is running" -ForegroundColor Gray
    Write-Host "  3. DATABASE_URL in .env is correct" -ForegroundColor Gray
    exit 1
}

# Step 3: Generate Prisma Client
Write-Host ""
Write-Host "STEP 3: Generating Prisma Client" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Make sure your backend server is STOPPED to avoid file lock errors" -ForegroundColor Yellow
Write-Host ""

$continue = Read-Host "Is backend server stopped? (y/n)"
if ($continue -ne "y") {
    Write-Host ""
    Write-Host "Please stop the backend server first, then run:" -ForegroundColor Yellow
    Write-Host "  npx prisma generate" -ForegroundColor Green
    exit 0
}

Write-Host "Generating Prisma client..." -ForegroundColor Gray
try {
    npx prisma generate
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "⚠️  Prisma generate had issues (may be file lock)" -ForegroundColor Yellow
        Write-Host "   Try stopping backend and running: npx prisma generate" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "✅ Prisma client generated!" -ForegroundColor Green
    }
} catch {
    Write-Host ""
    Write-Host "⚠️  Prisma generate error: $_" -ForegroundColor Yellow
    Write-Host "   This is usually a file lock - stop backend and run: npx prisma generate" -ForegroundColor Gray
}

# Step 4: Verify
Write-Host ""
Write-Host "STEP 4: Verifying Migrations" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

npx prisma migrate status

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Migration Process Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Restart your backend server" -ForegroundColor White
Write-Host "  2. All tables (users, outbox, etc.) should now exist" -ForegroundColor White
Write-Host "  3. Verify with: npx prisma studio" -ForegroundColor White
Write-Host ""

