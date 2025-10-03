@echo off
REM HFRF Universal SDR Canvas Integration Build Script (Windows)
REM Builds and runs the HFRF-SDR system with Canvas integration

echo ╔══════════════════════════════════════════════════════════════╗
echo ║           🎨 HFRF Universal SDR Canvas Build Script 🎨       ║
echo ╠══════════════════════════════════════════════════════════════╣

REM Check if Rust is installed
where cargo >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Rust/Cargo not found. Please install Rust first.
    echo    Visit: https://rustup.rs/
    pause
    exit /b 1
)

echo ✅ Rust/Cargo found
cargo --version

REM Check if we're in the right directory
if not exist "Cargo.toml" (
    echo ❌ Cargo.toml not found. Please run this script from the hfrf-universal-sdr directory.
    pause
    exit /b 1
)

echo ✅ Project directory confirmed

REM Create webui directory if it doesn't exist
if not exist "webui" (
    echo 📁 Creating webui directory...
    mkdir webui
)

REM Check if Canvas files exist
if not exist "webui\canvas-integration.html" (
    echo ⚠️  Canvas integration files not found. Please ensure canvas-integration.html exists.
)

if not exist "webui\canvas-app.tsx" (
    echo ⚠️  Canvas app files not found. Please ensure canvas-app.tsx exists.
)

echo ✅ Canvas files checked

REM Build the project
echo 🔨 Building HFRF Universal SDR with Canvas integration...
cargo build --release

if %errorlevel% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo ✅ Build successful!

REM Check if binary was created
if exist "target\release\hfrf-universal-sdr.exe" (
    echo ✅ Windows binary created: target\release\hfrf-universal-sdr.exe
) else (
    echo ⚠️  Binary not found in expected location
)

echo.
echo 🚀 Starting HFRF Universal SDR Canvas Server...
echo 📡 Canvas Integration: http://localhost:8080/canvas-integration
echo 🎨 Canvas App: http://localhost:8080/canvas-app
echo 📊 Dashboard: http://localhost:8080/
echo 🔗 API Endpoints:
echo    - /api/proxy - Proxy für CORS-freie Requests
echo    - /api/royalty - Royalty-Zählung
echo    - /api/spectrum - Spektrumdaten
echo    - /api/presets - SDR Presets
echo    - /api/hardware/status - Hardware Status
echo    - /api/transmit - TX-Steuerung
echo    - /api/frequency - Frequenz-Steuerung
echo    - /api/community/* - Community Integration
echo    - /api/audit - Audit-Logging
echo.

REM Run the application
if exist "target\release\hfrf-universal-sdr.exe" (
    target\release\hfrf-universal-sdr.exe
) else (
    echo ❌ Binary not found. Running with cargo run...
    cargo run --release
)

pause

