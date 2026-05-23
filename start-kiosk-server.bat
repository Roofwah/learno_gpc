@echo off
cd /d "%~dp0"

if not exist "node_modules\" (
  echo ERROR: Run install-windows.bat first.
  pause
  exit /b 1
)

if not exist ".next\" (
  echo ERROR: Run install-windows.bat first ^(build missing^).
  pause
  exit /b 1
)

echo learno GPC — local server on http://127.0.0.1:3001
echo Do not close this window during the event.
echo.

:serve
call npm run start
echo.
echo Server stopped — restarting in 5 seconds...
timeout /t 5 /nobreak >nul
goto serve
