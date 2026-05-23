@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set "PORT=3001"
if defined GPC_PORT set "PORT=%GPC_PORT%"

echo.
echo ========================================
echo   learno GPC - Kiosk
echo ========================================
echo.

set "KIOSK=%~1"
if not defined KIOSK (
  if exist "%~dp0kiosk-number.txt" (
    set /p "KIOSK=" < "%~dp0kiosk-number.txt"
    set "KIOSK=!KIOSK: =!"
  )
)
if not defined KIOSK (
  set /p "KIOSK=Kiosk number (1-8): "
)

set "KIOSK=%KIOSK: =%"
if "%KIOSK%"=="" goto :bad_kiosk
echo %KIOSK%| findstr /r "^[1-8]$" >nul || goto :bad_kiosk

echo %KIOSK%> "%~dp0kiosk-number.txt"

if not exist "%~dp0node_modules\" (
  echo.
  echo ERROR: Run install-windows.bat first.
  pause
  exit /b 1
)

if not exist "%~dp0.next\" (
  echo.
  echo ERROR: Run install-windows.bat first ^(build missing^).
  pause
  exit /b 1
)

if exist "%~dp0hub-address.txt" (
  set /p "HUB_IP=" < "%~dp0hub-address.txt"
  set "HUB_IP=!HUB_IP: =!"
  if not "!HUB_IP!"=="" (
    if "!HUB_IP!"=="127.0.0.1" (
      echo ERROR: hub-address.txt has 127.0.0.1 — run set-hub-ip.bat and enter the MAC hub IP.
      pause
      exit /b 1
    )
    if not exist "%~dp0public\" mkdir "%~dp0public"
    echo http://!HUB_IP!:%PORT!> "%~dp0public\hub-socket-url.txt"
    echo Mac hub sync: http://!HUB_IP!:%PORT%
  )
) else (
  echo.
  echo WARNING: hub-address.txt missing — kiosk will NOT appear on Mac master.
  echo Run set-hub-ip.bat and enter the Mac Wi-Fi IP ^(e.g. 192.168.1.39^).
  echo.
)

set "SERVER_RUNNING=0"
netstat -an | findstr /C:":%PORT% " | findstr LISTENING >nul 2>&1 && set "SERVER_RUNNING=1"

if "%SERVER_RUNNING%"=="0" (
  echo.
  echo Starting local server — a server window will open. Do not close it.
  start "learno GPC Kiosk Server" cmd /k "%~dp0start-kiosk-server.bat"
  timeout /t 3 /nobreak >nul
) else (
  echo Local server already running on port %PORT%.
)

set "URL=http://127.0.0.1:%PORT%/?kiosk=%KIOSK%"
echo.
echo Waiting for http://127.0.0.1:%PORT% ...
echo This can take 1-2 minutes the first time.
echo.

set /a TRIES=0
:wait_loop
set /a TRIES+=1
if !TRIES! GTR 90 goto :wait_failed

curl -sf -o nul "http://127.0.0.1:%PORT%/" 2>nul
if !errorlevel! equ 0 goto :open_browser

echo   Starting... !TRIES!/90
timeout /t 2 /nobreak >nul
goto :wait_loop

:open_browser
echo.
echo Server ready. Opening kiosk %KIOSK% ...
start "" "%URL%"
echo.
echo Done. Browser should be open at:
echo   %URL%
echo.
echo Leave the "learno GPC Kiosk Server" window open all day.
echo.
pause
exit /b 0

:wait_failed
echo.
echo ERROR: Local server did not respond after 3 minutes.
echo.
echo 1. Look at the "learno GPC Kiosk Server" window for red error text.
echo 2. If install failed, run install-windows.bat again.
echo 3. Try this script again.
echo.
pause
exit /b 1

:bad_kiosk
echo Invalid kiosk number. Use 1 through 8.
pause
exit /b 1
