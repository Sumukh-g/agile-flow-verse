# Test Database Connection Script
Write-Host "Testing PostgreSQL Connection..." -ForegroundColor Cyan
Write-Host ""

# Read current DATABASE_URL from .env
$envFile = ".env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    $dbUrl = $envContent | Select-String "DATABASE_URL" | ForEach-Object { $_.Line -replace 'DATABASE_URL=', '' -replace '"', '' }
    Write-Host "Current DATABASE_URL: $dbUrl" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is running
Write-Host "Checking PostgreSQL service..." -ForegroundColor Cyan
$pgServices = Get-Service | Where-Object { $_.Name -like "*postgres*" }
if ($pgServices) {
    Write-Host "✅ Found PostgreSQL services:" -ForegroundColor Green
    $pgServices | Format-Table Name, Status -AutoSize
} else {
    Write-Host "⚠️  No PostgreSQL service found. PostgreSQL might be running on a different port or not installed as a service." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Testing connection options..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Try with postgres user (most common)
Write-Host "1. Testing with default 'postgres' user..." -ForegroundColor Yellow
Write-Host "   Try: psql -U postgres -h localhost -d postgres" -ForegroundColor Gray
Write-Host ""

# Test 2: Try with agileflow user
Write-Host "2. Testing with 'agileflow' user..." -ForegroundColor Yellow
Write-Host "   Try: psql -U agileflow -h localhost -d agileflow_db" -ForegroundColor Gray
Write-Host ""

Write-Host "---" -ForegroundColor Gray
Write-Host "Common Solutions:" -ForegroundColor Cyan
Write-Host ""
Write-Host "A) If you know your postgres password, update .env:" -ForegroundColor White
Write-Host '   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/agileflow_db"' -ForegroundColor Green
Write-Host ""
Write-Host "B) Create the agileflow user and database:" -ForegroundColor White
Write-Host "   psql -U postgres" -ForegroundColor Green
Write-Host "   CREATE USER agileflow WITH PASSWORD 'agileflow_password';" -ForegroundColor Green
Write-Host "   CREATE DATABASE agileflow_db;" -ForegroundColor Green
Write-Host "   GRANT ALL PRIVILEGES ON DATABASE agileflow_db TO agileflow;" -ForegroundColor Green
Write-Host ""
Write-Host "C) Check if PostgreSQL is running on port 5432:" -ForegroundColor White
Write-Host "   netstat -an | findstr 5432" -ForegroundColor Green
Write-Host ""

