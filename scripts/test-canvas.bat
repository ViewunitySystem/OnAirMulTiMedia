@echo off
REM HFRF Universal SDR Canvas Integration Test Script (Windows)
REM Tests all Canvas integration endpoints and functionality

echo ╔══════════════════════════════════════════════════════════════╗
echo ║        🧪 HFRF Universal SDR Canvas Test Script 🧪          ║
echo ╠══════════════════════════════════════════════════════════════╣

set BASE_URL=http://localhost:8080
set PASSED=0
set FAILED=0

REM Check if curl is available
where curl >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ curl not found. Please install curl first.
    echo    Download from: https://curl.se/download.html
    pause
    exit /b 1
)

REM Check if server is running
echo 🔍 Checking if HFRF-SDR server is running...
curl -s "%BASE_URL%" >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Server is running on %BASE_URL%
) else (
    echo ❌ Server is not running on %BASE_URL%
    echo    Please start the server first with:
    echo    scripts\build-canvas.bat
    pause
    exit /b 1
)

echo.
echo 🧪 Starting Canvas Integration Tests...
echo.

REM Test basic endpoints
echo 🔍 Testing: Main Dashboard
curl -s -w "%%{http_code}" -o temp_response.json "%BASE_URL%/"
if %errorlevel% equ 0 (
    echo    ✅ Main Dashboard accessible
    set /a PASSED+=1
) else (
    echo    ❌ Main Dashboard failed
    set /a FAILED+=1
)

echo.
echo 🔍 Testing: Canvas Integration Page
curl -s -w "%%{http_code}" -o temp_response.json "%BASE_URL%/canvas-integration"
if %errorlevel% equ 0 (
    echo    ✅ Canvas Integration page accessible
    set /a PASSED+=1
) else (
    echo    ❌ Canvas Integration page failed
    set /a FAILED+=1
)

echo.
echo 🔍 Testing: Canvas App TypeScript
curl -s -w "%%{http_code}" -o temp_response.json "%BASE_URL%/canvas-app"
if %errorlevel% equ 0 (
    echo    ✅ Canvas App TypeScript accessible
    set /a PASSED+=1
) else (
    echo    ❌ Canvas App TypeScript failed
    set /a FAILED+=1
)

echo.
echo 🔍 Testing: Hardware Status API
curl -s -w "%%{http_code}" -o temp_response.json "%BASE_URL%/api/hardware/status"
if %errorlevel% equ 0 (
    echo    ✅ Hardware Status API accessible
    set /a PASSED+=1
) else (
    echo    ❌ Hardware Status API failed
    set /a FAILED+=1
)

echo.
echo 🔍 Testing: Spectrum Data API
curl -s -w "%%{http_code}" -o temp_response.json "%BASE_URL%/api/spectrum"
if %errorlevel% equ 0 (
    echo    ✅ Spectrum Data API accessible
    set /a PASSED+=1
) else (
    echo    ❌ Spectrum Data API failed
    set /a FAILED+=1
)

echo.
echo 🔍 Testing: Presets API
curl -s -w "%%{http_code}" -o temp_response.json "%BASE_URL%/api/presets"
if %errorlevel% equ 0 (
    echo    ✅ Presets API accessible
    set /a PASSED+=1
) else (
    echo    ❌ Presets API failed
    set /a FAILED+=1
)

echo.
echo 🔍 Testing: Royalty API
curl -s -w "%%{http_code}" -o temp_response.json -X POST -H "Content-Type: application/json" -d "{\"event_type\":\"TEST_EVENT\",\"asset_id\":\"test\",\"timestamp\":1234567890,\"session_id\":\"test_session\",\"frequency\":144300000,\"position\":0,\"data\":{}}" "%BASE_URL%/api/royalty"
if %errorlevel% equ 0 (
    echo    ✅ Royalty API accessible
    set /a PASSED+=1
) else (
    echo    ❌ Royalty API failed
    set /a FAILED+=1
)

echo.
echo 🔍 Testing: Transmit API
curl -s -w "%%{http_code}" -o temp_response.json -X POST -H "Content-Type: application/json" -d "{\"preset\":\"test_preset\",\"frequency\":144300000}" "%BASE_URL%/api/transmit"
if %errorlevel% equ 0 (
    echo    ✅ Transmit API accessible
    set /a PASSED+=1
) else (
    echo    ❌ Transmit API failed
    set /a FAILED+=1
)

echo.
echo 🔍 Testing: Frequency API
curl -s -w "%%{http_code}" -o temp_response.json -X POST -H "Content-Type: application/json" -d "{\"frequency\":144300000}" "%BASE_URL%/api/frequency"
if %errorlevel% equ 0 (
    echo    ✅ Frequency API accessible
    set /a PASSED+=1
) else (
    echo    ❌ Frequency API failed
    set /a FAILED+=1
)

echo.
echo 🔍 Testing: Community Stats API
curl -s -w "%%{http_code}" -o temp_response.json "%BASE_URL%/api/community/stats"
if %errorlevel% equ 0 (
    echo    ✅ Community Stats API accessible
    set /a PASSED+=1
) else (
    echo    ❌ Community Stats API failed
    set /a FAILED+=1
)

echo.
echo 🔍 Testing: Community Report API
curl -s -w "%%{http_code}" -o temp_response.json "%BASE_URL%/api/community/report"
if %errorlevel% equ 0 (
    echo    ✅ Community Report API accessible
    set /a PASSED+=1
) else (
    echo    ❌ Community Report API failed
    set /a FAILED+=1
)

echo.
echo 🔍 Testing: Community Details API
curl -s -w "%%{http_code}" -o temp_response.json "%BASE_URL%/api/community/details"
if %errorlevel% equ 0 (
    echo    ✅ Community Details API accessible
    set /a PASSED+=1
) else (
    echo    ❌ Community Details API failed
    set /a FAILED+=1
)

echo.
echo 🔍 Testing: Community Scan API
curl -s -w "%%{http_code}" -o temp_response.json -X POST -H "Content-Type: application/json" -d "{}" "%BASE_URL%/api/community/scan"
if %errorlevel% equ 0 (
    echo    ✅ Community Scan API accessible
    set /a PASSED+=1
) else (
    echo    ❌ Community Scan API failed
    set /a FAILED+=1
)

echo.
echo 🔍 Testing: Audit API
curl -s -w "%%{http_code}" -o temp_response.json -X POST -H "Content-Type: application/json" -d "{\"event_type\":\"TEST\",\"timestamp\":\"2025-01-18T12:00:00Z\",\"data\":{}}" "%BASE_URL%/api/audit"
if %errorlevel% equ 0 (
    echo    ✅ Audit API accessible
    set /a PASSED+=1
) else (
    echo    ❌ Audit API failed
    set /a FAILED+=1
)

echo.
echo 🔍 Testing: Proxy API
curl -s -w "%%{http_code}" -o temp_response.json "%BASE_URL%/api/proxy?url=https%%3A//httpbin.org/json"
if %errorlevel% equ 0 (
    echo    ✅ Proxy API accessible
    set /a PASSED+=1
) else (
    echo    ❌ Proxy API failed
    set /a FAILED+=1
)

echo.
echo 🎨 Testing Canvas-specific functionality...

REM Test if Canvas integration page loads correctly
curl -s "%BASE_URL%/canvas-integration" | findstr /C:"Canvas Integration" >nul
if %errorlevel% equ 0 (
    echo ✅ Canvas Integration page content loaded
    set /a PASSED+=1
) else (
    echo ❌ Canvas Integration page content not found
    set /a FAILED+=1
)

REM Test if Canvas app TypeScript is accessible
curl -s "%BASE_URL%/canvas-app" | findstr /C:"HFRF Universal SDR Canvas Integration" >nul
if %errorlevel% equ 0 (
    echo ✅ Canvas App TypeScript loaded
    set /a PASSED+=1
) else (
    echo ❌ Canvas App TypeScript not found
    set /a FAILED+=1
)

echo.

REM Summary
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    📊 TEST SUMMARY 📊                      ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║ Tests Passed: %PASSED%                                           ║
echo ║ Tests Failed: %FAILED%                                           ║
set /a TOTAL=%PASSED%+%FAILED%
echo ║ Total Tests:  %TOTAL%                                           ║

if %FAILED% equ 0 (
    echo ║ Status: ✅ ALL TESTS PASSED                                ║
) else (
    echo ║ Status: ❌ SOME TESTS FAILED                               ║
)

echo ╚══════════════════════════════════════════════════════════════╝

echo.
echo 🌐 Canvas Integration URLs:
echo    📡 Canvas Integration: %BASE_URL%/canvas-integration
echo    🎨 Canvas App: %BASE_URL%/canvas-app
echo    📊 Dashboard: %BASE_URL%/
echo.

if %FAILED% equ 0 (
    echo 🎉 All Canvas integration tests passed!
    echo    The HFRF Universal SDR Canvas system is working correctly.
) else (
    echo ⚠️  Some tests failed. Please check the server logs and configuration.
)

REM Clean up temporary files
if exist temp_response.json del temp_response.json

pause

