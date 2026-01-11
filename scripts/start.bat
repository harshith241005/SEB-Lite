@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM  SEB-Lite Complete Startup Script (Windows)
REM  Starts MongoDB, Backend, Frontend, and Electron
REM ═══════════════════════════════════════════════════════════════════════════

setlocal enabledelayedexpansion

echo.
echo ╔═══════════════════════════════════════════════════════════════════════╗
echo ║           🚀 SEB-LITE COMPLETE STARTUP                              ║
echo ╚═══════════════════════════════════════════════════════════════════════╝
echo.

REM Check if we're in the correct directory
if not exist "package.json" (
    echo ❌ Error: package.json not found
    echo Please run this script from the SEB-Lite root directory
    pause
    exit /b 1
)

echo ✅ Project directory verified
echo.

REM Check if MongoDB is running
echo 🔍 Checking MongoDB status...
netstat -ano | findstr :27017 >nul 2>&1
if !errorlevel! equ 0 (
    echo ✓ MongoDB is running on port 27017
) else (
    echo ⚠️  MongoDB is not running
    echo.
    echo To start MongoDB:
    echo   Option 1: mongod (in Command Prompt if installed)
    echo   Option 2: Services (search "Services" and start MongoDB)
    echo   Option 3: Docker (docker run -d -p 27017:27017 mongo:latest)
    echo.
    pause
)

REM Check Node.js
echo.
echo 🔍 Checking Node.js...
node --version >nul 2>&1
if !errorlevel! equ 0 (
    echo ✓ Node.js is installed
    node --version
) else (
    echo ❌ Node.js is not installed
    pause
    exit /b 1
)

echo.

REM Check dependencies
echo 🔍 Checking dependencies...
if not exist "backend\node_modules" (
    echo ⚠️  Backend dependencies not installed
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo ⚠️  Frontend dependencies not installed
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo ✓ All dependencies verified

echo.
echo ═══════════════════════════════════════════════════════════════════════
echo 📋 Startup Options:
echo ═══════════════════════════════════════════════════════════════════════
echo.
echo 1. Full Stack (Backend + Frontend + Electron)
echo 2. Backend Only (http://localhost:5000)
echo 3. Frontend Only (http://localhost:3000)
echo 4. Initialize Database (Sample Data)
echo 5. Test API Endpoints
echo 6. Exit
echo.

set /p choice="Select option (1-6): "

if "%choice%"=="1" (
    cls
    echo 🚀 Starting Full Stack...
    echo.
    echo Backend:   http://localhost:5000
    echo Frontend:  http://localhost:3000
    echo.
    echo Press Ctrl+C to stop all services
    echo.
    call npm start
) else if "%choice%"=="2" (
    cls
    echo 🚀 Starting Backend Server...
    echo.
    call npm run backend
) else if "%choice%"=="3" (
    cls
    echo 🚀 Starting Frontend...
    echo.
    call npm run frontend
) else if "%choice%"=="4" (
    cls
    echo 🚀 Initializing Database...
    echo.
    call node db-init.js
    pause
) else if "%choice%"=="5" (
    cls
    echo 🚀 Testing API Endpoints...
    echo.
    call node api-test.js
    pause
) else if "%choice%"=="6" (
    exit /b 0
) else (
    echo ❌ Invalid option
    pause
    goto start
)

pause
