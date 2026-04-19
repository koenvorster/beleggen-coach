#!/usr/bin/env pwsh
# start-dev.ps1 — Start de volledige lokale ontwikkelomgeving

Write-Host "🚀 Beleggingsapp — lokale dev omgeving opstarten..." -ForegroundColor Cyan

# 1. Docker (PostgreSQL + Redis)
Write-Host "`n📦 Docker containers starten..." -ForegroundColor Yellow
docker compose up -d
Start-Sleep -Seconds 3

# 2. Check DB
Write-Host "`n🗄️  Database controleren..." -ForegroundColor Yellow
$pg = docker compose exec -T postgres pg_isready -U beleggingsapp 2>&1
if ($pg -match "accepting connections") {
    Write-Host "   ✅ PostgreSQL beschikbaar" -ForegroundColor Green
} else {
    Write-Host "   ⏳ Wachten op PostgreSQL..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# 3. FastAPI
Write-Host "`n⚡ FastAPI starten op http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\apps\api'; uv run fastapi dev src/main.py --port 8000" -WindowStyle Normal
Start-Sleep -Seconds 3

# 4. Next.js frontend
Write-Host "`n🌐 Next.js starten op http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\apps\web'; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 2

Write-Host "`n✅ Alles gestart!" -ForegroundColor Green
Write-Host "   🌐 Frontend:    http://localhost:3000" -ForegroundColor Cyan
Write-Host "   ⚡ API:         http://localhost:8000" -ForegroundColor Cyan
Write-Host "   📚 API docs:    http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "   🗄️  PostgreSQL:  localhost:5432" -ForegroundColor Cyan
Write-Host "`nDruk op een toets om dit venster te sluiten..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
