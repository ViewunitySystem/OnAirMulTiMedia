# =============================================
#  OnAirMulTiMedia – Startbatch (PowerShell)
#  Datei: start-oamtm.ps1
#  Ort : Repo-Root (OnAirMulTiMedia\)
#  Zweck: Komplett-Start der Hauptanwendung (Dev)
# =============================================

param(
    [string]$Port = "5173",
    [string]$FirebaseTarget = "dev",
    [string]$WebuiDir = "webui"
)

# ---- Basiseinstellungen ---------------------
$NODE_MIN_VER = 18

# ---- Überschreiben per .env.local (optional) ----
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            Set-Variable -Name $matches[1] -Value $matches[2] -Scope Script
        }
    }
}

# ---- Standort prüfen ------------------------
if (-not (Test-Path "package.json")) {
    Write-Error "[FEHLER] Bitte im Repo-Root ausführen (package.json fehlt)."
    exit 1
}

# ---- Node.js prüfen ------------------------
try {
    $nodeVersion = node -v
    if (-not $nodeVersion) {
        throw "Node.js nicht gefunden"
    }
    
    $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($nodeMajor -lt $NODE_MIN_VER) {
        throw "Node-Version zu niedrig: $nodeVersion (>= v$NODE_MIN_VER erforderlich)"
    }
    
    Write-Host "[OK] Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Error "[FEHLER] $($_.Exception.Message). Bitte Node >= v$NODE_MIN_VER installieren."
    exit 1
}

# ---- Paketmanager ermitteln -----------------
$pm = "npm"
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    $pm = "pnpm"
} elseif (Get-Command yarn -ErrorAction SilentlyContinue) {
    $pm = "yarn"
}

Write-Host "[INFO] Paketmanager: $pm" -ForegroundColor Cyan

# ---- Abhängigkeiten installieren -----------
Write-Host "[RUN] Installiere Abhängigkeiten..." -ForegroundColor Yellow
switch ($pm) {
    "npm" { npm ci }
    "pnpm" { pnpm install --frozen-lockfile }
    "yarn" { yarn install --frozen-lockfile }
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "[FEHLER] Abhängigkeiten konnten nicht installiert werden."
    exit 1
}

# ---- TypeScript/ts-node vorbereiten (Self-Heal) -----
try {
    & $pm exec -c "ts-node -v" | Out-Null
} catch {
    Write-Host "[INFO] ts-node fehlt, wird temporär installiert..." -ForegroundColor Yellow
    switch ($pm) {
        "npm" { npm i -D ts-node typescript @types/node }
        "pnpm" { pnpm add -D ts-node typescript @types/node }
        "yarn" { yarn add -D ts-node typescript @types/node }
    }
}

# ---- Self-Healing (optional, falls vorhanden) ------
if (Test-Path "scripts\selfheal.ts") {
    Write-Host "[RUN] Self-Healing ausführen..." -ForegroundColor Yellow
    try {
        node --loader ts-node/esm scripts/selfheal.ts
    } catch {
        Write-Warning "[WARN] Self-Healing meldete Fehler (weiter mit Start)"
    }
} else {
    Write-Host "[HINWEIS] Kein scripts\selfheal.ts gefunden – überspringe Self-Healing." -ForegroundColor Gray
}

# ---- Rust-Backend (optional) ----------------
if (Test-Path "Cargo.toml") {
    Write-Host "[RUN] Starte optionales Rust-Backend (Release, wenn vorhanden)..." -ForegroundColor Yellow
    if (Get-Command cargo -ErrorAction SilentlyContinue) {
        Start-Process -FilePath "cargo" -ArgumentList "run", "--release" -WindowStyle Normal
    } else {
        Write-Warning "[WARN] Cargo nicht gefunden – überspringe Rust-Backend."
    }
} else {
    Write-Host "[HINWEIS] Kein Cargo.toml – überspringe Rust-Backend." -ForegroundColor Gray
}

# ---- Firebase Emulator/Deploy (optional) -----
if (Test-Path "firebase.json") {
    if ($FirebaseTarget -eq "emulator") {
        Write-Host "[RUN] Starte Firebase Emulator Suite..." -ForegroundColor Yellow
        Start-Process -FilePath "npx" -ArgumentList "firebase", "emulators:start" -WindowStyle Normal
    } else {
        Write-Host "[HINWEIS] Firebase-Konfiguration erkannt. Dev-Target: $FirebaseTarget (kein Auto-Deploy im Dev-Start)" -ForegroundColor Gray
    }
}

# ---- WebUI Development-Server ---------------
$webuiPath = Join-Path $WebuiDir "package.json"
if ((Test-Path $WebuiDir) -and (Test-Path $webuiPath)) {
    Write-Host "[RUN] Starte WebUI Dev-Server (Vite)..." -ForegroundColor Yellow
    Push-Location $WebuiDir
    switch ($pm) {
        "npm" { Start-Process -FilePath "npm" -ArgumentList "run", "dev", "--", "--port", $Port -WindowStyle Normal }
        "pnpm" { Start-Process -FilePath "pnpm" -ArgumentList "dev", "--port", $Port -WindowStyle Normal }
        "yarn" { Start-Process -FilePath "yarn" -ArgumentList "dev", "--port", $Port -WindowStyle Normal }
    }
    Pop-Location
} else {
    Write-Host "[WARN] $WebuiDir nicht gefunden – versuche Root-Start." -ForegroundColor Yellow
    if (Test-Path "package.json") {
        Write-Host "[RUN] Starte Dev-Server im Root..." -ForegroundColor Yellow
        switch ($pm) {
            "npm" { Start-Process -FilePath "npm" -ArgumentList "run", "dev", "--", "--port", $Port -WindowStyle Normal }
            "pnpm" { Start-Process -FilePath "pnpm" -ArgumentList "dev", "--port", $Port -WindowStyle Normal }
            "yarn" { Start-Process -FilePath "yarn" -ArgumentList "dev", "--port", $Port -WindowStyle Normal }
        }
    } else {
        Write-Error "[FEHLER] Kein Startskript gefunden. Bitte prüfe package.json Scripts."
        exit 1
    }
}

# ---- Browser öffnen ------------------------
$url = "http://localhost:$Port"
Start-Process $url

Write-Host ""
Write-Host "[OK] OAMTM-Entwicklungsumgebung gestartet." -ForegroundColor Green
Write-Host "- WebUI : $url" -ForegroundColor Cyan
Write-Host "- Rust  : (Fenster 'OAMTM - Rust', falls vorhanden)" -ForegroundColor Cyan
Write-Host "- Firebase: (Fenster 'OAMTM - Firebase', falls Emulator)" -ForegroundColor Cyan

Write-Host ""
Write-Host "Drücke eine beliebige Taste zum Beenden..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
