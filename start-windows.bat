@echo off
cd /d "%~dp0"
echo.
echo If kiosks show "site can't be reached", on the hub PC run ONCE as Admin:
echo   allow-firewall-port-3001.bat
echo.
set "NODE_ENV=production"
call npx ts-node server.ts
