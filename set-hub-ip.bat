@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo.
echo === learno GPC — Mac HUB IP (for live sync) ===
echo.
echo Enter the MAC hub Wi-Fi IP — NOT this kiosk PC's IP.
echo On the Mac run: ipconfig getifaddr en0
echo Example: 192.168.1.39
echo.

set "PORT=3001"
if defined GPC_PORT set "PORT=%GPC_PORT%"

set "HUB_IP="
set /p "HUB_IP=Mac hub IPv4 address: "

set "HUB_IP=%HUB_IP: =%"
if not defined HUB_IP (
  echo No IP entered.
  pause
  exit /b 1
)

if "%HUB_IP%"=="127.0.0.1" (
  echo ERROR: That is this PC, not the Mac hub.
  pause
  exit /b 1
)

if not exist "%~dp0public\" mkdir "%~dp0public"
echo %HUB_IP%> "%~dp0hub-address.txt"
echo http://%HUB_IP%:%PORT%> "%~dp0public\hub-socket-url.txt"
echo.
echo Saved hub-address.txt: %HUB_IP%
echo Saved public\hub-socket-url.txt
echo.
echo Kiosk browser: http://127.0.0.1:%PORT%/?kiosk=1
echo Mac master:    http://localhost:%PORT%/presenter?compact=1
echo.
pause
