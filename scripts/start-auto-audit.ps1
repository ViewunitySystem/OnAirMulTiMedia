#!/usr/bin/env pwsh

Write-Host "🚀 Starting Auto Audit Updater..." -ForegroundColor Green
Write-Host "📁 Watching for file changes..." -ForegroundColor Cyan
Write-Host "🔄 Auto-updating audit manifest on changes..." -ForegroundColor Yellow
Write-Host "🌐 Audit Manifest: https://viewunitysystem.github.io/OnAirMulTiMedia/docs/audit-manifest.html" -ForegroundColor Blue
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Red
Write-Host ""

try {
    node scripts/auto-audit-updater.mjs
} catch {
    Write-Host "❌ Error starting auto audit updater: $($_.Exception.Message)" -ForegroundColor Red
}

Read-Host "Press Enter to exit"
