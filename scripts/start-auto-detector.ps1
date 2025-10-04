#!/usr/bin/env pwsh

Write-Host "🚀 Starting Auto Module Detector..." -ForegroundColor Green
Write-Host "📁 Watching for file changes..." -ForegroundColor Cyan
Write-Host "🔄 Auto-updating audit manifest on changes..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Red
Write-Host ""

try {
    node scripts/auto-module-detector.mjs
} catch {
    Write-Host "❌ Error starting auto detector: $($_.Exception.Message)" -ForegroundColor Red
}

Read-Host "Press Enter to exit"
