# GitHub Pages Deployment Script
# Erstellt von: Raymond Demitrio Dr. Tel
# Datum: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Write-Host "🚀 GitHub Pages Deployment Script gestartet..." -ForegroundColor Green

# Git Status prüfen
Write-Host "📊 Git Status prüfen..." -ForegroundColor Yellow
git status

# Alle Änderungen hinzufügen
Write-Host "➕ Alle Änderungen hinzufügen..." -ForegroundColor Yellow
git add .

# Commit mit Zeitstempel
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMessage = "🚀 GITHUB PAGES DEPLOYMENT: .nojekyll hinzugefügt - $timestamp"

Write-Host "💾 Commit erstellen: $commitMessage" -ForegroundColor Yellow
git commit -m $commitMessage

# Push zu beiden Branches
Write-Host "📤 Push zu mainzero Branch..." -ForegroundColor Yellow
git push origin mainzero

Write-Host "📤 Push zu gh-pages Branch..." -ForegroundColor Yellow
git push origin gh-pages

Write-Host "✅ Deployment abgeschlossen!" -ForegroundColor Green
Write-Host "⏳ Warten Sie 5-10 Minuten für GitHub Pages Build..." -ForegroundColor Cyan
Write-Host "🔗 Testen Sie: https://viewunitysystem.github.io/OnAirMulTiMedia-Fixed/" -ForegroundColor Blue

# Status-URLs anzeigen
Write-Host "`n📋 Status-URLs:" -ForegroundColor Magenta
Write-Host "• Hauptseite: https://viewunitysystem.github.io/OnAirMulTiMedia-Fixed/" -ForegroundColor White
Write-Host "• Info Dashboard: https://viewunitysystem.github.io/OnAirMulTiMedia-Fixed/info.html" -ForegroundColor White
Write-Host "• Investor Pack: https://viewunitysystem.github.io/OnAirMulTiMedia-Fixed/docs/investor-one-pager.html" -ForegroundColor White
Write-Host "• Commands Ref: https://viewunitysystem.github.io/OnAirMulTiMedia-Fixed/COMPLETE-COMMANDS-REFERENCE.md" -ForegroundColor White

Write-Host "`n🎯 GitHub Pages sollte jetzt funktionieren!" -ForegroundColor Green
