# TEL Portal System - Universal Console Monitor (UCM) Startup Script
# PowerShell Version für Windows

Write-Host "🖥️ TEL Portal System - Universal Console Monitor (UCM)" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Prüfe ob Node.js installiert ist
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js gefunden: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js nicht gefunden! Bitte installieren Sie Node.js" -ForegroundColor Red
    exit 1
}

# Prüfe ob UCM Config existiert
$configPath = "scripts/ucm-config.json"
if (-not (Test-Path $configPath)) {
    Write-Host "❌ UCM Config nicht gefunden: $configPath" -ForegroundColor Red
    exit 1
}

# Erstelle Audit-Verzeichnis
$auditDir = "audit/console"
if (-not (Test-Path $auditDir)) {
    New-Item -ItemType Directory -Path $auditDir -Force | Out-Null
    Write-Host "✅ Audit-Verzeichnis erstellt: $auditDir" -ForegroundColor Green
}

# Starte UCM Collector
Write-Host "🚀 Starte UCM Collector..." -ForegroundColor Yellow
Write-Host "📊 Endpoints:" -ForegroundColor Cyan
Write-Host "   - Local: http://localhost:3737/log" -ForegroundColor White
Write-Host "   - OnAirMulTiMedia: http://localhost:3737/OnAirMulTiMedia/log" -ForegroundColor White
Write-Host "   - Health: http://localhost:3737/health" -ForegroundColor White
Write-Host "   - Viewer: ./OnAirMulTiMedia/console-viewer.html" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tipp: Öffnen Sie console-viewer.html in Ihrem Browser für Live-Monitoring" -ForegroundColor Magenta
Write-Host "🛑 Drücken Sie Ctrl+C zum Beenden" -ForegroundColor Yellow
Write-Host ""

# Starte UCM mit Node.js
try {
    node scripts/ucm-run.mjs
} catch {
    Write-Host "❌ UCM Fehler: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
