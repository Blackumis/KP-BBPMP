@echo off
echo ============================================
echo KP-BBPMP Queue System - Quick Start
echo ============================================
echo.

echo Checking Redis...
redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Redis is not running!
    echo.
    echo Please start Redis first:
    echo   Option 1: Install and run Redis on Windows
    echo   Option 2: Use Docker: docker run -d -p 6379:6379 --name redis redis:alpine
    echo   Option 3: Use WSL2 with Redis
    echo.
    pause
    exit /b 1
)

echo [OK] Redis is running
echo.

echo Installing dependencies...
call npm install

echo.
echo Starting server with queue workers...
echo.
echo Queue Dashboard will be available at: http://localhost:5000/admin/queues
echo.

call npm run dev
