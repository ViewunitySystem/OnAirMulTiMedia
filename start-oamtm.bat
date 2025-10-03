@echo off
REM ===================================================================
REM 🚀 OnAirMulTiMedia - Universal Start Batch
REM ===================================================================
REM Autor: Raymond Demitrio Dr. Tel (DD5BE)
REM Version: 1.0.0
REM Beschreibung: Startet die komplette OnAirMulTiMedia Anwendung
REM ===================================================================

setlocal enabledelayedexpansion

REM Farben für Windows Console
for /f %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
set "GREEN=%ESC%[32m"
set "RED=%ESC%[31m"
set "YELLOW=%ESC%[33m"
set "BLUE=%ESC%[34m"
set "CYAN=%ESC%[36m"
set "WHITE=%ESC%[37m"
set "RESET=%ESC%[0m"

REM Header
echo.
echo %CYAN%╔══════════════════════════════════════════════════════════════╗%RESET%
echo %CYAN%║                🚀 OnAirMulTiMedia Starter 🚀                ║%RESET%
echo %CYAN%╠══════════════════════════════════════════════════════════════╣%RESET%
echo %CYAN%║                                                              ║%RESET%
echo %CYAN%║  🌍 Universal Media Platform                                ║%RESET%
echo %CYAN%║  📡 Matrix.org-Style Serverfarm                             ║%RESET%
echo %CYAN%║  🔥 Echte Live-Daten - Keine Demo-Inhalte                   ║%RESET%
echo %CYAN%║  📱 PWA + Desktop + Mobile Support                          ║%RESET%
echo %CYAN%║                                                              ║%RESET%
echo %CYAN%╚══════════════════════════════════════════════════════════════╝%RESET%
echo.

REM Prüfe ob wir im richtigen Verzeichnis sind
if not exist "package.json" (
    echo %RED%❌ FEHLER: package.json nicht gefunden!%RESET%
    echo %YELLOW%   Bitte führe diese Batch aus dem OnAirMulTiMedia Hauptverzeichnis aus.%RESET%
    echo.
    pause
    exit /b 1
)

REM Prüfe Node.js Installation
echo %BLUE%🔍 Prüfe Node.js Installation...%RESET%
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%❌ Node.js nicht gefunden!%RESET%
    echo %YELLOW%   Bitte installiere Node.js von https://nodejs.org/%RESET%
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo %GREEN%✅ Node.js gefunden: %NODE_VERSION%%RESET%

REM Prüfe Python für lokalen Server
echo %BLUE%🔍 Prüfe Python Installation...%RESET%
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%⚠️  Python nicht gefunden - verwende alternativen Server%RESET%
    set USE_PYTHON=false
) else (
    for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
    echo %GREEN%✅ Python gefunden: %PYTHON_VERSION%%RESET%
    set USE_PYTHON=true
)

REM Installiere Dependencies falls nötig
if not exist "node_modules" (
    echo %BLUE%📦 Installiere Dependencies...%RESET%
    npm install
    if %errorlevel% neq 0 (
        echo %RED%❌ Fehler beim Installieren der Dependencies!%RESET%
        pause
        exit /b 1
    )
    echo %GREEN%✅ Dependencies installiert%RESET%
) else (
    echo %GREEN%✅ Dependencies bereits installiert%RESET%
)

REM Zeige verfügbare Startoptionen
echo.
echo %WHITE%🎯 Verfügbare Startoptionen:%RESET%
echo %CYAN%╔══════════════════════════════════════════════════════════════╗%RESET%
echo %CYAN%║                                                              ║%RESET%
echo %CYAN%║  1. 🌐 Lokaler Web-Server (Port 8000)                       ║%RESET%
echo %CYAN%║  2. 📱 PWA Development Server                               ║%RESET%
echo %CYAN%║  3. 🖥️  Electron Desktop App                                ║%RESET%
echo %CYAN%║  4. 📊 Matrix.org-Style Serverfarm                          ║%RESET%
echo %CYAN%║  5. 📈 Dashboard Serverfarm                                 ║%RESET%
echo %CYAN%║  6. 🔧 Alle Services starten                                ║%RESET%
echo %CYAN%║  7. 🌍 Online Version öffnen                               ║%RESET%
echo %CYAN%║  8. 📋 System Status prüfen                                ║%RESET%
echo %CYAN%║                                                              ║%RESET%
echo %CYAN%╚══════════════════════════════════════════════════════════════╝%RESET%
echo.

REM Benutzerauswahl
set /p choice="Wähle eine Option (1-8): "

if "%choice%"=="1" goto :local_server
if "%choice%"=="2" goto :pwa_dev
if "%choice%"=="3" goto :electron
if "%choice%"=="4" goto :matrix_serverfarm
if "%choice%"=="5" goto :dashboard_serverfarm
if "%choice%"=="6" goto :all_services
if "%choice%"=="7" goto :online_version
if "%choice%"=="8" goto :system_status
goto :invalid_choice

:local_server
echo.
echo %GREEN%🌐 Starte lokalen Web-Server...%RESET%
echo %YELLOW%   URL: http://localhost:8000%RESET%
echo %YELLOW%   Drücke Ctrl+C zum Beenden%RESET%
echo.
if "%USE_PYTHON%"=="true" (
    python -m http.server 8000
) else (
    echo %YELLOW%⚠️  Python nicht verfügbar - verwende Node.js Server%RESET%
    npx http-server -p 8000 -c-1
)
goto :end

:pwa_dev
echo.
echo %GREEN%📱 Starte PWA Development Server...%RESET%
echo %YELLOW%   URL: http://localhost:3000%RESET%
echo %YELLOW%   Drücke Ctrl+C zum Beenden%RESET%
echo.
if exist "vite.config.js" (
    npx vite --host --port 3000
) else (
    echo %YELLOW%⚠️  Vite nicht konfiguriert - verwende Standard-Server%RESET%
    npx http-server -p 3000 -c-1
)
goto :end

:electron
echo.
echo %GREEN%🖥️  Starte Electron Desktop App...%RESET%
echo %YELLOW%   Desktop-Anwendung wird gestartet%RESET%
echo.
if exist "electron/main.js" (
    npx electron .
) else (
    echo %RED%❌ Electron nicht konfiguriert!%RESET%
    echo %YELLOW%   Bitte führe 'npm run build:electron' aus%RESET%
    pause
    goto :end
)
goto :end

:matrix_serverfarm
echo.
echo %GREEN%📊 Öffne Matrix.org-Style Serverfarm...%RESET%
echo %YELLOW%   Starte lokalen Server und öffne Browser%RESET%
echo.
start "" "http://localhost:8000/serverfarm-matrix.html"
if "%USE_PYTHON%"=="true" (
    python -m http.server 8000
) else (
    npx http-server -p 8000 -c-1
)
goto :end

:dashboard_serverfarm
echo.
echo %GREEN%📈 Öffne Dashboard Serverfarm...%RESET%
echo %YELLOW%   Starte lokalen Server und öffne Browser%RESET%
echo.
start "" "http://localhost:8000/serverfarm-dashboard.html"
if "%USE_PYTHON%"=="true" (
    python -m http.server 8000
) else (
    npx http-server -p 8000 -c-1
)
goto :end

:all_services
echo.
echo %GREEN%🔧 Starte alle Services...%RESET%
echo %YELLOW%   Starte lokalen Server im Hintergrund%RESET%
echo.
if "%USE_PYTHON%"=="true" (
    start /B python -m http.server 8000
) else (
    start /B npx http-server -p 8000 -c-1
)
timeout /t 2 /nobreak >nul
echo %GREEN%✅ Lokaler Server gestartet%RESET%
echo.
echo %WHITE%🌐 Öffne alle wichtigen Seiten:%RESET%
start "" "http://localhost:8000/"
start "" "http://localhost:8000/serverfarm-matrix.html"
start "" "http://localhost:8000/serverfarm-dashboard.html"
start "" "http://localhost:8000/info.html"
start "" "http://localhost:8000/manifest.html"
echo.
echo %GREEN%✅ Alle Services gestartet!%RESET%
echo %YELLOW%   Drücke eine beliebige Taste zum Beenden aller Services%RESET%
pause >nul
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
goto :end

:online_version
echo.
echo %GREEN%🌍 Öffne Online-Version...%RESET%
echo %YELLOW%   GitHub Pages: https://viewunitysystem.github.io/OnAirMulTiMedia/%RESET%
echo.
start "" "https://viewunitysystem.github.io/OnAirMulTiMedia/"
start "" "https://viewunitysystem.github.io/OnAirMulTiMedia/serverfarm-matrix.html"
start "" "https://viewunitysystem.github.io/OnAirMulTiMedia/serverfarm-dashboard.html"
echo %GREEN%✅ Online-Version geöffnet%RESET%
goto :end

:system_status
echo.
echo %GREEN%📋 System Status Check...%RESET%
echo %CYAN%╔══════════════════════════════════════════════════════════════╗%RESET%
echo %CYAN%║                        SYSTEM STATUS                        ║%RESET%
echo %CYAN%╠══════════════════════════════════════════════════════════════╣%RESET%

REM Node.js Status
echo %CYAN%║ Node.js: %NODE_VERSION%                                      ║%RESET%

REM Python Status
if "%USE_PYTHON%"=="true" (
    echo %CYAN%║ Python: %PYTHON_VERSION%                                  ║%RESET%
) else (
    echo %CYAN%║ Python: Nicht installiert                               ║%RESET%
)

REM Dependencies Status
if exist "node_modules" (
    echo %CYAN%║ Dependencies: Installiert                                ║%RESET%
) else (
    echo %CYAN%║ Dependencies: Nicht installiert                          ║%RESET%
)

REM Git Status
git status --porcelain >nul 2>&1
if %errorlevel% equ 0 (
    echo %CYAN%║ Git: Verfügbar                                           ║%RESET%
    for /f "tokens=*" %%i in ('git branch --show-current 2^>nul') do set CURRENT_BRANCH=%%i
    echo %CYAN%║ Branch: %CURRENT_BRANCH%                                  ║%RESET%
) else (
    echo %CYAN%║ Git: Nicht verfügbar                                     ║%RESET%
)

REM Dateien Status
if exist "serverfarm-matrix.html" (
    echo %CYAN%║ Matrix Serverfarm: Verfügbar                             ║%RESET%
) else (
    echo %CYAN%║ Matrix Serverfarm: Nicht gefunden                       ║%RESET%
)

if exist "serverfarm-dashboard.html" (
    echo %CYAN%║ Dashboard Serverfarm: Verfügbar                         ║%RESET%
) else (
    echo %CYAN%║ Dashboard Serverfarm: Nicht gefunden                     ║%RESET%
)

if exist "api-stub.js" (
    echo %CYAN%║ API Stub: Verfügbar                                       ║%RESET%
) else (
    echo %CYAN%║ API Stub: Nicht gefunden                                 ║%RESET%
)

echo %CYAN%╚══════════════════════════════════════════════════════════════╝%RESET%
echo.
echo %GREEN%✅ System Status Check abgeschlossen%RESET%
pause
goto :end

:invalid_choice
echo.
echo %RED%❌ Ungültige Auswahl!%RESET%
echo %YELLOW%   Bitte wähle eine Option zwischen 1 und 8%RESET%
echo.
pause
goto :end

:end
echo.
echo %GREEN%🎉 OnAirMulTiMedia Starter beendet%RESET%
echo %WHITE%   Danke für die Nutzung!%RESET%
echo.
pause
