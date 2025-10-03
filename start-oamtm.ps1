# ===================================================================
# 🚀 OnAirMulTiMedia - Universal Start PowerShell Script
# ===================================================================
# Autor: Raymond Demitrio Dr. Tel (DD5BE)
# Version: 1.0.0
# Beschreibung: Erweiterte Start-Funktionen für OnAirMulTiMedia
# ===================================================================

param(
    [switch]$AutoStart,
    [switch]$MatrixFarm,
    [switch]$DashboardFarm,
    [switch]$AllServices,
    [switch]$Online,
    [switch]$Status,
    [switch]$Help
)

# Farben für PowerShell
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Cyan"
    White = "White"
    Magenta = "Magenta"
}

function Write-Header {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor $Colors.Blue
    Write-Host "║                🚀 OnAirMulTiMedia Starter 🚀                ║" -ForegroundColor $Colors.Blue
    Write-Host "╠══════════════════════════════════════════════════════════════╣" -ForegroundColor $Colors.Blue
    Write-Host "║                                                              ║" -ForegroundColor $Colors.Blue
    Write-Host "║  🌍 Universal Media Platform                                ║" -ForegroundColor $Colors.Blue
    Write-Host "║  📡 Matrix.org-Style Serverfarm                             ║" -ForegroundColor $Colors.Blue
    Write-Host "║  🔥 Echte Live-Daten - Keine Demo-Inhalte                   ║" -ForegroundColor $Colors.Blue
    Write-Host "║  📱 PWA + Desktop + Mobile Support                          ║" -ForegroundColor $Colors.Blue
    Write-Host "║                                                              ║" -ForegroundColor $Colors.Blue
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor $Colors.Blue
    Write-Host ""
}

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

function Test-Prerequisites {
    Write-Status "Prüfe System-Voraussetzungen..."
    
    # Prüfe package.json
    if (-not (Test-Path "package.json")) {
        Write-Error "package.json nicht gefunden! Bitte führe das Script aus dem OnAirMulTiMedia Hauptverzeichnis aus."
        exit 1
    }
    
    # Prüfe Node.js
    try {
        $NodeVersion = node --version
        Write-Success "Node.js gefunden: $NodeVersion"
    } catch {
        Write-Error "Node.js nicht gefunden! Bitte installiere Node.js von https://nodejs.org/"
        exit 1
    }
    
    # Prüfe Python
    try {
        $PythonVersion = python --version
        Write-Success "Python gefunden: $PythonVersion"
        $script:UsePython = $true
    } catch {
        Write-Warning "Python nicht gefunden - verwende Node.js Server"
        $script:UsePython = $false
    }
    
    # Prüfe Dependencies
    if (-not (Test-Path "node_modules")) {
        Write-Status "Installiere Dependencies..."
        try {
            npm install
            Write-Success "Dependencies installiert"
        } catch {
            Write-Error "Fehler beim Installieren der Dependencies!"
            exit 1
        }
    } else {
        Write-Success "Dependencies bereits installiert"
    }
}

function Start-LocalServer {
    param([int]$Port = 8000)
    
    Write-Status "Starte lokalen Server auf Port $Port..."
    
    if ($script:UsePython) {
        Write-Host "🌐 URL: http://localhost:$Port" -ForegroundColor $Colors.Yellow
        Write-Host "📋 Drücke Ctrl+C zum Beenden" -ForegroundColor $Colors.Yellow
        Write-Host ""
        python -m http.server $Port
    } else {
        Write-Host "🌐 URL: http://localhost:$Port" -ForegroundColor $Colors.Yellow
        Write-Host "📋 Drücke Ctrl+C zum Beenden" -ForegroundColor $Colors.Yellow
        Write-Host ""
        npx http-server -p $Port -c-1
    }
}

function Start-MatrixServerfarm {
    Write-Status "Starte Matrix.org-Style Serverfarm..."
    
    # Starte Server im Hintergrund
    if ($script:UsePython) {
        $ServerProcess = Start-Process python -ArgumentList "-m", "http.server", "8000" -PassThru -WindowStyle Hidden
    } else {
        $ServerProcess = Start-Process npx -ArgumentList "http-server", "-p", "8000", "-c-1" -PassThru -WindowStyle Hidden
    }
    
    # Warte kurz
    Start-Sleep -Seconds 2
    
    # Öffne Browser
    Write-Success "Öffne Matrix.org-Style Serverfarm..."
    Start-Process "http://localhost:8000/serverfarm-matrix.html"
    
    Write-Host ""
    Write-Host "🎯 Matrix.org-Style Serverfarm gestartet!" -ForegroundColor $Colors.Green
    Write-Host "🌐 URL: http://localhost:8000/serverfarm-matrix.html" -ForegroundColor $Colors.Blue
    Write-Host "📋 Drücke eine beliebige Taste zum Beenden" -ForegroundColor $Colors.Yellow
    
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    # Beende Server
    Stop-Process -Id $ServerProcess.Id -Force
    Write-Success "Server beendet"
}

function Start-DashboardServerfarm {
    Write-Status "Starte Dashboard Serverfarm..."
    
    # Starte Server im Hintergrund
    if ($script:UsePython) {
        $ServerProcess = Start-Process python -ArgumentList "-m", "http.server", "8000" -PassThru -WindowStyle Hidden
    } else {
        $ServerProcess = Start-Process npx -ArgumentList "http-server", "-p", "8000", "-c-1" -PassThru -WindowStyle Hidden
    }
    
    # Warte kurz
    Start-Sleep -Seconds 2
    
    # Öffne Browser
    Write-Success "Öffne Dashboard Serverfarm..."
    Start-Process "http://localhost:8000/serverfarm-dashboard.html"
    
    Write-Host ""
    Write-Host "🎯 Dashboard Serverfarm gestartet!" -ForegroundColor $Colors.Green
    Write-Host "🌐 URL: http://localhost:8000/serverfarm-dashboard.html" -ForegroundColor $Colors.Blue
    Write-Host "📋 Drücke eine beliebige Taste zum Beenden" -ForegroundColor $Colors.Yellow
    
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    # Beende Server
    Stop-Process -Id $ServerProcess.Id -Force
    Write-Success "Server beendet"
}

function Start-AllServices {
    Write-Status "Starte alle Services..."
    
    # Starte Server im Hintergrund
    if ($script:UsePython) {
        $ServerProcess = Start-Process python -ArgumentList "-m", "http.server", "8000" -PassThru -WindowStyle Hidden
    } else {
        $ServerProcess = Start-Process npx -ArgumentList "http-server", "-p", "8000", "-c-1" -PassThru -WindowStyle Hidden
    }
    
    # Warte kurz
    Start-Sleep -Seconds 2
    
    # Öffne alle wichtigen Seiten
    Write-Success "Öffne alle wichtigen Seiten..."
    Start-Process "http://localhost:8000/"
    Start-Process "http://localhost:8000/serverfarm-matrix.html"
    Start-Process "http://localhost:8000/serverfarm-dashboard.html"
    Start-Process "http://localhost:8000/info.html"
    Start-Process "http://localhost:8000/manifest.html"
    
    Write-Host ""
    Write-Host "🎯 Alle Services gestartet!" -ForegroundColor $Colors.Green
    Write-Host "🌐 Hauptseite: http://localhost:8000/" -ForegroundColor $Colors.Blue
    Write-Host "📊 Matrix Serverfarm: http://localhost:8000/serverfarm-matrix.html" -ForegroundColor $Colors.Blue
    Write-Host "📈 Dashboard Serverfarm: http://localhost:8000/serverfarm-dashboard.html" -ForegroundColor $Colors.Blue
    Write-Host "📋 Drücke eine beliebige Taste zum Beenden aller Services" -ForegroundColor $Colors.Yellow
    
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    # Beende Server
    Stop-Process -Id $ServerProcess.Id -Force
    Write-Success "Alle Services beendet"
}

function Open-OnlineVersion {
    Write-Status "Öffne Online-Version..."
    
    Write-Success "Öffne GitHub Pages..."
    Start-Process "https://viewunitysystem.github.io/OnAirMulTiMedia/"
    Start-Process "https://viewunitysystem.github.io/OnAirMulTiMedia/serverfarm-matrix.html"
    Start-Process "https://viewunitysystem.github.io/OnAirMulTiMedia/serverfarm-dashboard.html"
    
    Write-Host ""
    Write-Host "🌍 Online-Version geöffnet!" -ForegroundColor $Colors.Green
    Write-Host "🔗 GitHub Pages: https://viewunitysystem.github.io/OnAirMulTiMedia/" -ForegroundColor $Colors.Blue
}

function Show-SystemStatus {
    Write-Status "System Status Check..."
    
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor $Colors.Blue
    Write-Host "║                        SYSTEM STATUS                        ║" -ForegroundColor $Colors.Blue
    Write-Host "╠══════════════════════════════════════════════════════════════╣" -ForegroundColor $Colors.Blue
    
    # Node.js Status
    try {
        $NodeVersion = node --version
        Write-Host "║ Node.js: $NodeVersion" -ForegroundColor $Colors.Blue
    } catch {
        Write-Host "║ Node.js: Nicht gefunden" -ForegroundColor $Colors.Red
    }
    
    # Python Status
    if ($script:UsePython) {
        try {
            $PythonVersion = python --version
            Write-Host "║ Python: $PythonVersion" -ForegroundColor $Colors.Blue
        } catch {
            Write-Host "║ Python: Nicht gefunden" -ForegroundColor $Colors.Red
        }
    } else {
        Write-Host "║ Python: Nicht installiert" -ForegroundColor $Colors.Yellow
    }
    
    # Dependencies Status
    if (Test-Path "node_modules") {
        Write-Host "║ Dependencies: Installiert" -ForegroundColor $Colors.Green
    } else {
        Write-Host "║ Dependencies: Nicht installiert" -ForegroundColor $Colors.Red
    }
    
    # Git Status
    try {
        $CurrentBranch = git branch --show-current
        Write-Host "║ Git Branch: $CurrentBranch" -ForegroundColor $Colors.Green
    } catch {
        Write-Host "║ Git: Nicht verfügbar" -ForegroundColor $Colors.Yellow
    }
    
    # Dateien Status
    $Files = @(
        @{Name="Matrix Serverfarm"; Path="serverfarm-matrix.html"},
        @{Name="Dashboard Serverfarm"; Path="serverfarm-dashboard.html"},
        @{Name="API Stub"; Path="api-stub.js"},
        @{Name="Main Index"; Path="index.html"},
        @{Name="Info Page"; Path="info.html"}
    )
    
    foreach ($File in $Files) {
        if (Test-Path $File.Path) {
            Write-Host "║ $($File.Name): Verfügbar" -ForegroundColor $Colors.Green
        } else {
            Write-Host "║ $($File.Name): Nicht gefunden" -ForegroundColor $Colors.Red
        }
    }
    
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor $Colors.Blue
    Write-Host ""
    Write-Success "System Status Check abgeschlossen"
}

function Show-Help {
    Write-Host ""
    Write-Host "🚀 OnAirMulTiMedia Starter - Hilfe" -ForegroundColor $Colors.White
    Write-Host "====================================" -ForegroundColor $Colors.White
    Write-Host ""
    Write-Host "Verwendung:" -ForegroundColor $Colors.Blue
    Write-Host "  .\start-oamtm.ps1 [Optionen]" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Host "Optionen:" -ForegroundColor $Colors.Blue
    Write-Host "  -AutoStart        Startet automatisch den lokalen Server" -ForegroundColor $Colors.Yellow
    Write-Host "  -MatrixFarm       Startet Matrix.org-Style Serverfarm" -ForegroundColor $Colors.Yellow
    Write-Host "  -DashboardFarm    Startet Dashboard Serverfarm" -ForegroundColor $Colors.Yellow
    Write-Host "  -AllServices      Startet alle Services gleichzeitig" -ForegroundColor $Colors.Yellow
    Write-Host "  -Online           Öffnet Online-Version (GitHub Pages)" -ForegroundColor $Colors.Yellow
    Write-Host "  -Status           Zeigt System Status" -ForegroundColor $Colors.Yellow
    Write-Host "  -Help             Zeigt diese Hilfe" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Host "Beispiele:" -ForegroundColor $Colors.Blue
    Write-Host "  .\start-oamtm.ps1 -MatrixFarm" -ForegroundColor $Colors.Yellow
    Write-Host "  .\start-oamtm.ps1 -AllServices" -ForegroundColor $Colors.Yellow
    Write-Host "  .\start-oamtm.ps1 -Status" -ForegroundColor $Colors.Yellow
    Write-Host ""
}

# Hauptlogik
Write-Header

# Prüfe Parameter
if ($Help) {
    Show-Help
    exit 0
}

# Prüfe Voraussetzungen
Test-Prerequisites

# Führe gewünschte Aktion aus
if ($AutoStart) {
    Start-LocalServer
} elseif ($MatrixFarm) {
    Start-MatrixServerfarm
} elseif ($DashboardFarm) {
    Start-DashboardServerfarm
} elseif ($AllServices) {
    Start-AllServices
} elseif ($Online) {
    Open-OnlineVersion
} elseif ($Status) {
    Show-SystemStatus
} else {
    # Interaktiver Modus
    Write-Host "🎯 Verfügbare Startoptionen:" -ForegroundColor $Colors.White
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor $Colors.Blue
    Write-Host "║                                                              ║" -ForegroundColor $Colors.Blue
    Write-Host "║  1. 🌐 Lokaler Web-Server (Port 8000)                       ║" -ForegroundColor $Colors.Blue
    Write-Host "║  2. 📱 PWA Development Server                               ║" -ForegroundColor $Colors.Blue
    Write-Host "║  3. 🖥️  Electron Desktop App                                ║" -ForegroundColor $Colors.Blue
    Write-Host "║  4. 📊 Matrix.org-Style Serverfarm                          ║" -ForegroundColor $Colors.Blue
    Write-Host "║  5. 📈 Dashboard Serverfarm                                 ║" -ForegroundColor $Colors.Blue
    Write-Host "║  6. 🔧 Alle Services starten                                ║" -ForegroundColor $Colors.Blue
    Write-Host "║  7. 🌍 Online Version öffnen                               ║" -ForegroundColor $Colors.Blue
    Write-Host "║  8. 📋 System Status prüfen                                ║" -ForegroundColor $Colors.Blue
    Write-Host "║                                                              ║" -ForegroundColor $Colors.Blue
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor $Colors.Blue
    Write-Host ""
    
    $choice = Read-Host "Wähle eine Option (1-8)"
    
    switch ($choice) {
        "1" { Start-LocalServer }
        "2" { 
            Write-Status "Starte PWA Development Server..."
            if (Test-Path "vite.config.js") {
                npx vite --host --port 3000
            } else {
                npx http-server -p 3000 -c-1
            }
        }
        "3" { 
            Write-Status "Starte Electron Desktop App..."
            if (Test-Path "electron/main.js") {
                npx electron .
            } else {
                Write-Error "Electron nicht konfiguriert! Bitte führe 'npm run build:electron' aus"
            }
        }
        "4" { Start-MatrixServerfarm }
        "5" { Start-DashboardServerfarm }
        "6" { Start-AllServices }
        "7" { Open-OnlineVersion }
        "8" { Show-SystemStatus }
        default { 
            Write-Error "Ungültige Auswahl! Bitte wähle eine Option zwischen 1 und 8"
        }
    }
}

Write-Host ""
Write-Host "🎉 OnAirMulTiMedia Starter beendet" -ForegroundColor $Colors.Green
Write-Host "   Danke für die Nutzung!" -ForegroundColor $Colors.White
Write-Host ""
