@echo off
title PEOS Monitoring System

echo ============================================
echo PEOS Monitoring System - Multi-Service Start
echo ============================================
echo.

echo Starting Backend Server (Port 3001)...
start cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak

echo Starting Frontend & Tailwind (Port 5000)...
start cmd /k "npm run dev"

echo.
echo ============================================
echo Services started in new windows:
echo - Backend API: http://localhost:3001
echo - Frontend UI: http://localhost:5000
echo ============================================
echo.
echo Press CTRL+C in each window to stop services
pause
