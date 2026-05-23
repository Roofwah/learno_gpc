@echo off
cd /d "%~dp0"
echo.
echo === learno_gpc — stop and restart ===
echo.

echo [1/3] Stopping anything listening on port 3001...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
  echo   Killing PID %%p
  taskkill /F /PID %%p >nul 2>&1
)

echo [2/3] Stopping Node processes (learno server)...
taskkill /F /IM node.exe >nul 2>&1

echo   Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo [3/3] Starting server...
echo.
call start-windows.bat
