#!/usr/bin/env pwsh
# setup.ps1 — Eerste keer installatie van alle dependencies

Write-Host "🔧 Beleggingsapp — dependencies installeren..." -ForegroundColor Cyan

$base = $PSScriptRoot

# Check tools
$tools = @("docker", "node", "npm", "uv")
foreach ($tool in $tools) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "   ❌ '$tool' niet gevonden. Installeer het eerst." -ForegroundColor Red
        exit 1
    }
}
Write-Host "   ✅ Alle tools gevonden" -ForegroundColor Green

# Frontend dependencies
Write-Host "`n📦 Frontend (Next.js) dependencies installeren..." -ForegroundColor Yellow
Set-Location "$base\apps\web"
npm install
Write-Host "   ✅ Frontend dependencies klaar" -ForegroundColor Green

# Backend API dependencies
Write-Host "`n🐍 Backend (FastAPI) dependencies installeren..." -ForegroundColor Yellow
Set-Location "$base\apps\api"
uv sync
Write-Host "   ✅ Backend dependencies klaar" -ForegroundColor Green

# MCP servers
Write-Host "`n🔌 MCP server dependencies installeren..." -ForegroundColor Yellow
$mcpServers = @("investor-profile-mcp", "etf-data-mcp", "behavior-coach-mcp", "portfolio-plan-mcp", "market-data-mcp", "learning-content-mcp")
foreach ($srv in $mcpServers) {
    $path = "$base\mcp\$srv"
    if (Test-Path "$path\pyproject.toml") {
        Set-Location $path
        uv sync
        Write-Host "   ✅ $srv" -ForegroundColor Green
    }
}

# .env
if (-not (Test-Path "$base\.env")) {
    Copy-Item "$base\.env.example" "$base\.env"
    Write-Host "`n📝 .env aangemaakt vanuit .env.example" -ForegroundColor Yellow
    Write-Host "   Pas de waarden aan als nodig." -ForegroundColor Gray
}

Set-Location $base
Write-Host "`n✅ Setup klaar! Voer .\start-dev.ps1 uit om alles te starten." -ForegroundColor Green
