@echo off
echo.
echo === Allow learno GPC through Windows Firewall (port 3001) ===
echo Run this ONCE on the HUB PC as Administrator.
echo Right-click this file -^> Run as administrator
echo.

net session >nul 2>&1
if errorlevel 1 (
  echo ERROR: Not running as Administrator.
  echo Right-click allow-firewall-port-3001.bat and choose "Run as administrator"
  pause
  exit /b 1
)

netsh advfirewall firewall delete rule name="learno GPC 3001" >nul 2>&1
netsh advfirewall firewall add rule name="learno GPC 3001" dir=in action=allow protocol=TCP localport=3001

if errorlevel 1 (
  echo FAILED to add firewall rule.
  pause
  exit /b 1
)

echo SUCCESS: Port 3001 allowed for incoming connections on Private networks.
echo Now run start-windows.bat and test from a kiosk:
echo   http://YOUR-HUB-IP:3001/?kiosk=2
echo.
pause
