@echo off
cd /d "%~dp0"

set "PORT=3001"
if defined GPC_PORT set "PORT=%GPC_PORT%"

if not exist "%~dp0hub-address.txt" (
  start "" "http://localhost:%PORT%/presenter?compact=1"
  exit /b 0
)

set /p "HUB_IP=" < "%~dp0hub-address.txt"
set "HUB_IP=%HUB_IP: =%"
if "%HUB_IP%"=="" (
  start "" "http://localhost:%PORT%/presenter?compact=1"
  exit /b 0
)

start "" "http://%HUB_IP%:%PORT%/presenter?compact=1"
