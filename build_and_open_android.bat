@echo off
setlocal

REM Get current directory
set "PROJECT_DIR=%cd%"

echo Building project in: %PROJECT_DIR%

REM Run Vite build
npm run build

REM Capacitor copy
npx cap copy

REM Open Android project
npx cap open android

echo --- Build & Sync Complete ---
