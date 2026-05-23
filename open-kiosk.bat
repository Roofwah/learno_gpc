@echo off
REM Always start local server first, then open browser (same as start-kiosk.bat)
cd /d "%~dp0"
call "%~dp0start-kiosk.bat" %*
