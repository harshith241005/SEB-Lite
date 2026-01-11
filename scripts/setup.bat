@echo off
REM SEB-Lite Quick Start Script for Windows

echo 🚀 SEB-Lite Setup Wizard
echo ==========================
echo.

echo Installing dependencies...
call npm run install-all

if errorlevel 1 (
  echo ✗ Installation failed
  exit /b 1
)

echo.
echo ✓ Setup complete!
echo.
echo To start the application, run:
echo   npm start
echo.
echo Or run services individually:
echo   Terminal 1: npm run backend
echo   Terminal 2: npm run frontend
echo   Terminal 3: npm run electron
echo.
echo Make sure MongoDB is running before starting the app!
pause
