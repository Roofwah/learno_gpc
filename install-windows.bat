@echo off
cd /d "%~dp0"
echo Removing old install...
if exist node_modules rmdir /s /q node_modules
if exist .next rmdir /s /q .next
echo Installing (no native SQLite - should work on Windows)...
call npm install --loglevel=error --no-fund --no-audit
if errorlevel 1 goto fail
echo Building store list...
call npm run build-stores
if errorlevel 1 goto fail
if not exist public\data\stores.json (
  echo ERROR: public\data\stores.json missing after build-stores
  goto fail
)
echo Building app...
call npm run build
if errorlevel 1 goto fail
echo.
echo SUCCESS. Double-click start-windows.bat to run the server.
pause
exit /b 0
:fail
echo.
echo FAILED. Copy the red npm ERR lines above and send them.
pause
exit /b 1
