# ============================================================================
# GitHub Info Dashboard - Automatische Installation für alle Repos
# © 2025 Raymond Demitrio Dr. Tel
# ============================================================================

param(
    [string]$GitHubUser = "ViewunitySystem",
    [string]$GitHubToken = $env:GITHUB_TOKEN,
    [string]$CloneDir = "D:\Repos",
    [switch]$DryRun = $false,
    [switch]$SkipPush = $false
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "GitHub Info Dashboard - Batch Setup" -ForegroundColor Cyan
Write-Host "User: $GitHubUser" -ForegroundColor Yellow
Write-Host "============================================`n" -ForegroundColor Cyan

# Template-Dateien
$TemplateDir = "$PSScriptRoot\public"
$InfoTemplate = "$TemplateDir\info.html"

if (-not (Test-Path $InfoTemplate)) {
    Write-Host "❌ ERROR: Template nicht gefunden: $InfoTemplate" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Template gefunden: $InfoTemplate`n" -ForegroundColor Green

# Erstelle Clone-Directory
if (-not (Test-Path $CloneDir)) {
    New-Item -ItemType Directory -Path $CloneDir -Force | Out-Null
    Write-Host "📁 Verzeichnis erstellt: $CloneDir`n" -ForegroundColor Green
}

# Hole alle Repos des Users
Write-Host "🔍 Fetching repositories for $GitHubUser..." -ForegroundColor Cyan

$headers = @{
    "Accept" = "application/vnd.github+json"
    "User-Agent" = "PowerShell-GitHubSetup"
}

if ($GitHubToken) {
    $headers["Authorization"] = "Bearer $GitHubToken"
    Write-Host "🔑 Using GitHub Token for authentication`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  No GitHub Token provided - Rate limits apply`n" -ForegroundColor Yellow
}

try {
    $repos = @()
    $page = 1
    do {
        $url = "https://api.github.com/users/$GitHubUser/repos?per_page=100&page=$page&sort=updated"
        $response = Invoke-RestMethod -Uri $url -Headers $headers
        $repos += $response
        $page++
    } while ($response.Count -eq 100)
    
    Write-Host "✅ Gefunden: $($repos.Count) Repositories`n" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Konnte Repos nicht abrufen: $_" -ForegroundColor Red
    exit 1
}

# Zusätzlich Repos von ViewunitySystemT
Write-Host "🔍 Fetching repositories for ViewunitySystemT..." -ForegroundColor Cyan
try {
    $page = 1
    do {
        $url = "https://api.github.com/users/ViewunitySystemT/repos?per_page=100&page=$page&sort=updated"
        $response = Invoke-RestMethod -Uri $url -Headers $headers
        $repos += $response
        $page++
    } while ($response.Count -eq 100)
    
    Write-Host "✅ Gesamt: $($repos.Count) Repositories (inkl. ViewunitySystemT)`n" -ForegroundColor Green
} catch {
    Write-Host "⚠️  ViewunitySystemT Repos konnten nicht abgerufen werden: $_" -ForegroundColor Yellow
}

# Statistiken
$successCount = 0
$skipCount = 0
$errorCount = 0

# Verarbeite jedes Repo
foreach ($repo in $repos) {
    $repoName = $repo.name
    $repoFullName = $repo.full_name
    $repoPath = Join-Path $CloneDir $repoName
    $defaultBranch = $repo.default_branch
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📦 Repository: $repoFullName" -ForegroundColor Cyan
    Write-Host "   Branch: $defaultBranch" -ForegroundColor Gray
    
    # Skip if archived or disabled
    if ($repo.archived) {
        Write-Host "   ⏭️  SKIPPED: Repository is archived" -ForegroundColor Yellow
        $skipCount++
        continue
    }
    
    if ($repo.disabled) {
        Write-Host "   ⏭️  SKIPPED: Repository is disabled" -ForegroundColor Yellow
        $skipCount++
        continue
    }
    
    if ($DryRun) {
        Write-Host "   🔍 DRY-RUN: Would install dashboard to $repoPath" -ForegroundColor Magenta
        $skipCount++
        continue
    }
    
    try {
        # Clone oder Update Repo
        if (Test-Path $repoPath) {
            Write-Host "   📥 Updating existing repo..." -ForegroundColor Yellow
            Push-Location $repoPath
            git fetch --all 2>&1 | Out-Null
            git checkout $defaultBranch 2>&1 | Out-Null
            git pull origin $defaultBranch 2>&1 | Out-Null
            Pop-Location
        } else {
            Write-Host "   📥 Cloning repo..." -ForegroundColor Yellow
            git clone "https://github.com/$repoFullName.git" $repoPath 2>&1 | Out-Null
            if (-not $?) {
                throw "Git clone failed"
            }
        }
        
        # Check if info.html already exists
        $infoHtmlPath = Join-Path $repoPath "info.html"
        if (Test-Path $infoHtmlPath) {
            Write-Host "   ℹ️  info.html exists - updating..." -ForegroundColor Yellow
        } else {
            Write-Host "   ➕ Creating new info.html..." -ForegroundColor Green
        }
        
        # Kopiere Template
        Copy-Item $InfoTemplate $infoHtmlPath -Force
        
        # Ersetze Repo-Namen in info.html
        $content = Get-Content $infoHtmlPath -Raw
        $content = $content -replace 'ViewunitySystem/OnAirMulTiMedia', $repoFullName
        $content = $content -replace 'OnAirMulTiMedia – Info & Monitoring', "$repoName – Info & Monitoring"
        Set-Content -Path $infoHtmlPath -Value $content -NoNewline
        
        Write-Host "   ✅ Template installed and configured" -ForegroundColor Green
        
        # Git Commit & Push
        Push-Location $repoPath
        
        git add info.html 2>&1 | Out-Null
        
        # Check if there are changes
        $status = git status --porcelain
        if ($status) {
            git commit -m "feat: Add GitHub Info Dashboard

⭐ Live GitHub-Statistiken (Stars, Forks, Watcher, Issues)
📦 Release-Downloads (Summe aller Assets)
💬 Community-Beiträge möglich
🔄 Auto-Refresh alle 10 Minuten
🔒 XSS-safe rendering
🎨 Responsive Dark Theme

Template von: https://github.com/ViewunitySystem/OnAirMulTiMedia/tree/mainzero/hackathon-bridge" 2>&1 | Out-Null
            
            if ($SkipPush) {
                Write-Host "   💾 Changes committed (push skipped)" -ForegroundColor Yellow
            } else {
                Write-Host "   📤 Pushing to GitHub..." -ForegroundColor Cyan
                git push origin $defaultBranch 2>&1 | Out-Null
                if ($?) {
                    Write-Host "   ✅ Successfully pushed to GitHub" -ForegroundColor Green
                } else {
                    throw "Git push failed"
                }
            }
            
            $successCount++
        } else {
            Write-Host "   ℹ️  No changes detected - already up to date" -ForegroundColor Cyan
            $skipCount++
        }
        
        Pop-Location
        
        # URL anzeigen
        if ($repo.has_pages) {
            Write-Host "   🌐 Dashboard URL: https://$($repo.owner.login).github.io/$repoName/info.html" -ForegroundColor Green
        } else {
            Write-Host "   💡 Tip: Enable GitHub Pages to access at https://$($repo.owner.login).github.io/$repoName/info.html" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "   ❌ ERROR: $_" -ForegroundColor Red
        $errorCount++
        if (Test-Path $repoPath) {
            Pop-Location -ErrorAction SilentlyContinue
        }
    }
}

# Zusammenfassung
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 ZUSAMMENFASSUNG" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Gesamt Repositories: $($repos.Count)" -ForegroundColor White
Write-Host "✅ Erfolgreich:      $successCount" -ForegroundColor Green
Write-Host "⏭️  Übersprungen:     $skipCount" -ForegroundColor Yellow
Write-Host "❌ Fehler:           $errorCount" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "🔍 DRY-RUN Modus - Keine Änderungen vorgenommen" -ForegroundColor Magenta
    Write-Host "Führe das Script ohne -DryRun aus um tatsächlich zu installieren`n" -ForegroundColor Gray
}

Write-Host "🎉 Setup abgeschlossen!`n" -ForegroundColor Green

# Liste aller URLs (wenn GitHub Pages aktiviert)
Write-Host "🌐 GitHub Pages URLs (falls aktiviert):" -ForegroundColor Cyan
foreach ($repo in $repos | Where-Object { $_.has_pages }) {
    Write-Host "   https://$($repo.owner.login).github.io/$($repo.name)/info.html" -ForegroundColor Blue
}

Write-Host "`n💡 Tipps:" -ForegroundColor Yellow
Write-Host "   • Aktiviere GitHub Pages in den Repo-Settings" -ForegroundColor Gray
Write-Host "   • Setze GITHUB_TOKEN environment variable für höhere Rate Limits" -ForegroundColor Gray
Write-Host "   • Setze ADMIN_KEY für Backend-Repos mit Community-Beiträgen" -ForegroundColor Gray
Write-Host ""

