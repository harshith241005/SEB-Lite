@echo off
echo Setting up MongoDB for SEB-Lite...

REM Check if MongoDB is already installed
where mongod >nul 2>nul
if %errorlevel% equ 0 (
    echo MongoDB is already installed. Starting MongoDB...
    goto :start_mongo
)

REM Download MongoDB
echo Downloading MongoDB...
powershell -Command "Invoke-WebRequest -Uri 'https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.2.zip' -OutFile 'mongodb.zip'"

REM Extract MongoDB
echo Extracting MongoDB...
powershell -Command "Expand-Archive -Path 'mongodb.zip' -DestinationPath '.' -Force"
move mongodb-win32-x86_64-7.0.2 mongodb

REM Create data directory
if not exist "mongodb\data" mkdir mongodb\data

:start_mongo
REM Start MongoDB
echo Starting MongoDB on port 27017...
start "MongoDB" "mongodb\bin\mongod.exe" --dbpath mongodb\data --port 27017

echo MongoDB is starting up...
echo Please wait 10-15 seconds for MongoDB to fully start...
timeout /t 10 /nobreak >nul

echo MongoDB setup complete!
echo You can now run the backend server with: cd backend && npm run dev