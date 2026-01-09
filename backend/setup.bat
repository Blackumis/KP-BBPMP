@echo off
echo ========================================
echo KP BBPMP Backend Setup
echo ========================================
echo.

echo [1/5] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo.

echo [2/5] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [3/5] Setting up environment file...
if not exist .env (
    copy .env.example .env
    echo .env file created. Please edit it with your database credentials.
    echo.
    echo Opening .env file for editing...
    timeout /t 2 >nul
    notepad .env
) else (
    echo .env file already exists, skipping...
)
echo.

echo [4/5] Do you want to run database migration now? (Y/N)
set /p migrate="Enter choice: "
if /i "%migrate%"=="Y" (
    echo Running database migration...
    call npm run migrate
    if errorlevel 1 (
        echo WARNING: Migration failed. Please check your database configuration in .env
    ) else (
        echo Migration completed successfully!
    )
) else (
    echo Skipping migration. Run 'npm run migrate' manually when ready.
)
echo.

echo [5/5] Setup Complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Edit .env file with your configuration
echo 2. Run 'npm run migrate' to setup database
echo 3. Run 'npm run dev' to start the server
echo 4. Default login: admin / admin123
echo.
echo Documentation:
echo - QUICKSTART.md for quick setup guide
echo - README.md for full documentation
echo - DEPLOYMENT.md for production deployment
echo ========================================
echo.
pause
