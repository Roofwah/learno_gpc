@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set "PROJ=%~dp0"
set "PROJ=%PROJ:~0,-1%"
set "DESKTOP=%USERPROFILE%\Desktop"

echo.
echo === Installing GPC Kiosk shortcuts on Desktop ===
echo Project: %PROJ%
echo.

if not exist "%PROJ%\public\hub-socket-url.txt" (
  if not exist "%PROJ%\hub-address.txt" (
    echo WARNING: No hub-socket-url.txt — kiosks need Mac hub IP for live event.
    echo Copy hub-address.txt from the Mac ^(run ./set-hub-ip.sh^) or set-hub-ip.bat with Mac IP.
    echo.
  )
)

for %%K in (1 2 3 4 5 6 7 8) do (
  (
    echo @echo off
    echo REM learno GPC — Kiosk %%K
    echo call "%PROJ%\start-kiosk.bat" %%K
  ) > "%DESKTOP%\GPC Kiosk %%K.bat"
  echo Created: GPC Kiosk %%K.bat
)

echo.
echo Done. Double-click "GPC Kiosk N.bat" on the Desktop.
echo Each shortcut starts the local server and opens http://127.0.0.1:3001/?kiosk=N
echo Mac hub: ./start-mac.sh must be running on the Mac during the event.
echo.
pause
