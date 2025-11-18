# Fix DATABASE_URL to work with Docker networking
Write-Host "Fixing .env file..." -ForegroundColor Yellow

$envContent = Get-Content .env -Raw
$envContent = $envContent -replace 'DATABASE_URL="postgresql://[^"]*"', 'DATABASE_URL="postgresql://postgres@host.docker.internal:5432/agileflow_db"'
$envContent | Set-Content .env -NoNewline

Write-Host "✅ .env fixed!" -ForegroundColor Green
Write-Host ""
Write-Host "DATABASE_URL is now:" -ForegroundColor Cyan
Get-Content .env | Select-String "DATABASE_URL"
Write-Host ""

Write-Host "Starting backend..." -ForegroundColor Yellow
npm run api:start

