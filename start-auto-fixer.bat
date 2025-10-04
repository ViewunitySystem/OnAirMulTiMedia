@echo off
REM AUTOMATIC TERMINAL PROBLEM SECTOR FIXER SYSTEM
REM Quick Start Script for Windows
REM 
REM @author Raymond Demitrio Dr. Tel
REM @version 1.0.0

echo 🤖 AUTOMATIC TERMINAL PROBLEM SECTOR FIXER SYSTEM
echo ================================================
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "scripts\auto-problem-fixer.js" (
    echo ❌ Auto Problem Fixer scripts not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

echo ✅ Node.js detected: 
node --version
echo.

REM Show menu
:menu
echo Choose an option:
echo.
echo 1. Run one-time fix
echo 2. Start real-time monitoring
echo 3. Run dry-run (preview fixes)
echo 4. Start background daemon
echo 5. Stop background daemon
echo 6. Show daemon status
echo 7. Run PowerShell version
echo 8. Exit
echo.
set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto fix
if "%choice%"=="2" goto watch
if "%choice%"=="3" goto dryrun
if "%choice%"=="4" goto start
if "%choice%"=="5" goto stop
if "%choice%"=="6" goto status
if "%choice%"=="7" goto powershell
if "%choice%"=="8" goto exit
goto menu

:fix
echo.
echo 🔧 Running one-time fix...
node scripts/auto-problem-fixer.js
echo.
echo ✅ Fix completed!
pause
goto menu

:watch
echo.
echo 👁️  Starting real-time monitoring...
echo Press Ctrl+C to stop
node scripts/auto-problem-fixer.js --watch
pause
goto menu

:dryrun
echo.
echo 🔍 Running dry-run (preview mode)...
node scripts/auto-problem-fixer.js --dry-run
echo.
echo ✅ Dry-run completed!
pause
goto menu

:start
echo.
echo 🚀 Starting background daemon...
node scripts/auto-problem-fixer.js --start
echo.
echo ✅ Daemon started!
pause
goto menu

:stop
echo.
echo 🛑 Stopping background daemon...
node scripts/auto-problem-fixer.js --stop
echo.
echo ✅ Daemon stopped!
pause
goto menu

:status
echo.
echo 📊 Checking daemon status...
node scripts/auto-problem-fixer.js --status
echo.
pause
goto menu

:powershell
echo.
echo 🔧 Running PowerShell version...
powershell -ExecutionPolicy Bypass -File scripts/auto-problem-fixer.ps1 -Fix
echo.
echo ✅ PowerShell fix completed!
pause
goto menu

:exit
echo.
echo 👋 Thank you for using Auto Problem Fixer System!
echo.
exit /b 0
