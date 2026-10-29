@echo off
setlocal
cd /d "%~dp0"
title TRADING WORKSPACE - Local Preview
set "CV_OPEN_FLAG=--open"
if /I "%~1"=="--no-open" set "CV_OPEN_FLAG="
if not exist "server.mjs" (
  echo Please extract the entire ZIP before running start.cmd.
  pause
  exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
  if exist "%ProgramFiles%\nodejs\node.exe" (
    "%ProgramFiles%\nodejs\node.exe" server.mjs %CV_OPEN_FLAG%
  ) else (
    echo Node.js 20 or newer is required. Install Node.js and run this file again.
  )
) else (
  node server.mjs %CV_OPEN_FLAG%
)
echo.
echo Preview stopped. If the browser did not open, copy the printed URL.
pause
