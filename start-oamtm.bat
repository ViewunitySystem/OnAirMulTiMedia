@echo off
setlocal ENABLEDELAYEDEXPANSION

REM =============================================
REM  OnAirMulTiMedia – Startbatch (Windows)
REM  Datei: start-oamtm.bat
REM  Ort : Repo-Root (OnAirMulTiMedia\)
REM  Zweck: Komplett-Start der Hauptanwendung (Dev)
REM =============================================

REM ---- Basiseinstellungen ---------------------
set NODE_MIN_VER=18
set WEBUI_DIR=webui
set DOCS_DIR=docs
set PORT=5173
set FIREBASE_TARGET=dev

REM ---- Überschreiben per .env.local (optional) - einfache Parser-Variante
if exist .env.local (
  for /f "usebackq tokens=1,2 delims==" %%a in (".env.local") do (
    if /I not "%%a"=="" set %%a=%%b
  )
)

REM ---- Standort prüfen ------------------------
if not exist package.json (
  echo [FEHLER] Bitte im Repo-Root ausfuehren (package.json fehlt).
  goto :end
)

REM ---- Node.js pruefen ------------------------
for /f "tokens=*" %%v in ('node -v 2^>nul') do set NODE_VER=%%v
if "!NODE_VER!"=="" (
  echo [FEHLER] Node.js nicht gefunden. Bitte Node >= %NODE_MIN_VER% installieren.
  goto :end
)
for /f "tokens=1 delims=.v" %%a in ("!NODE_VER!") do set NODE_MAJ=%%a
if !NODE_MAJ! LSS %NODE_MIN_VER% (
  echo [FEHLER] Node-Version zu niedrig: !NODE_VER! (>= %NODE_MIN_VER% erforderlich)
  goto :end
)

echo [OK] Node.js !NODE_VER!

REM ---- Paketmanager ermitteln -----------------
set PM=npm
where pnpm >nul 2>nul && set PM=pnpm
where yarn >nul 2>nul && if /I not "%PM%"=="pnpm" set PM=yarn

echo [INFO] Paketmanager: %PM%

REM ---- Abhaengigkeiten installieren -----------
if /I "%PM%"=="npm" (
  call npm ci || goto :end
) else if /I "%PM%"=="pnpm" (
  call pnpm install --frozen-lockfile || goto :end
) else (
  call yarn install --frozen-lockfile || goto :end
)

REM ---- TypeScript/ts-node vorbereiten (Self-Heal) -----
call %PM% exec -c "node --version" >nul 2>nul
call %PM% exec -c "ts-node -v" >nul 2>nul
if errorlevel 1 (
  echo [INFO] ts-node fehlt, wird temporar installiert...
  if /I "%PM%"=="npm" (
    call npm i -D ts-node typescript @types/node || goto :cont
  ) else if /I "%PM%"=="pnpm" (
    call pnpm add -D ts-node typescript @types/node || goto :cont
  ) else (
    call yarn add -D ts-node typescript @types/node || goto :cont
  )
)
:cont

REM ---- Self-Healing (optional, falls vorhanden) ------
if exist scripts\selfheal.ts (
  echo [RUN] Self-Healing ausfuehren...
  call node --loader ts-node/esm scripts/selfheal.ts || echo [WARN] Self-Healing meldete Fehler (weiter mit Start)
) else (
  echo [HINWEIS] Kein scripts\selfheal.ts gefunden – ueberspringe Self-Healing.
)

REM ---- Rust-Backend (optional) ----------------
if exist Cargo.toml (
  echo [RUN] Starte optionales Rust-Backend (Release, wenn vorhanden)...
  start "OAMTM - Rust" cmd /c "cargo run --release"
) else (
  echo [HINWEIS] Kein Cargo.toml – ueberspringe Rust-Backend.
)

REM ---- Firebase Emulator/Deploy (optional) -----
if exist firebase.json (
  if /I "%FIREBASE_TARGET%"=="emulator" (
    echo [RUN] Starte Firebase Emulator Suite...
    start "OAMTM - Firebase (Emu)" cmd /c "npx firebase emulators:start"
  ) else (
    echo [HINWEIS] Firebase-Konfiguration erkannt. Dev-Target: %FIREBASE_TARGET% (kein Auto-Deploy im Dev-Start)
  )
)

REM ---- WebUI Development-Server ---------------
if exist %WEBUI_DIR% (
  pushd %WEBUI_DIR%
  if exist package.json (
    echo [RUN] Starte WebUI Dev-Server (Vite)...
    if /I "%PM%"=="npm" (
      start "OAMTM - WebUI" cmd /c "npm run dev -- --port %PORT%"
    ) else if /I "%PM%"=="pnpm" (
      start "OAMTM - WebUI" cmd /c "pnpm dev --port %PORT%"
    ) else (
      start "OAMTM - WebUI" cmd /c "yarn dev --port %PORT%"
    )
  ) else (
    echo [WARN] %WEBUI_DIR%/package.json nicht gefunden – versuche Root-Start.
    popd
    goto :start_root_web
  )
  popd
) else (
  echo [WARN] %WEBUI_DIR% nicht gefunden – versuche Root-Start.
  goto :start_root_web
)

goto :open

:start_root_web
if exist package.json (
  echo [RUN] Starte Dev-Server im Root...
  if /I "%PM%"=="npm" (
    start "OAMTM - WebUI" cmd /c "npm run dev -- --port %PORT%"
  ) else if /I "%PM%"=="pnpm" (
    start "OAMTM - WebUI" cmd /c "pnpm dev --port %PORT%"
  ) else (
    start "OAMTM - WebUI" cmd /c "yarn dev --port %PORT%"
  )
) else (
  echo [FEHLER] Kein Startskript gefunden. Bitte pruefe package.json Scripts.
)

:open
REM ---- Browser oeffnen ------------------------
set URL=http://localhost:%PORT%
start "" %URL%

echo.
echo [OK] OAMTM-Entwicklungsumgebung gestartet.
echo - WebUI : %URL%
echo - Rust  : (Fenster "OAMTM - Rust", falls vorhanden)
echo - Firebase: (Fenster "OAMTM - Firebase", falls Emulator)

goto :end

:end
endlocal
exit /b
