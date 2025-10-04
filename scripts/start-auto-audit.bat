@echo off
echo 🚀 Starting Auto Audit Updater...
echo 📁 Watching for file changes...
echo 🔄 Auto-updating audit manifest on changes...
echo 🌐 Audit Manifest: https://viewunitysystem.github.io/OnAirMulTiMedia/docs/audit-manifest.html
echo.
echo Press Ctrl+C to stop
echo.

node scripts/auto-audit-updater.mjs

pause
