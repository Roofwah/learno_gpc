@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

for %%I in ("%~dp0.") do set "NAME=%%~nxI"
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "STAMP=%%i"
set "ZIP_PREFIX=im"
if defined ZIP_PREFIX_ENV set "ZIP_PREFIX=%ZIP_PREFIX_ENV%"
set "ZIP=%~dp0..\%ZIP_PREFIX%-%STAMP%.zip"
set "BUILT_AT="
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format \"yyyy-MM-dd HH:mm:ss\""') do set "BUILT_AT=%%i"

echo learno GPC deploy package> "%~dp0BUILD.txt"
echo Built: %BUILT_AT%>> "%~dp0BUILD.txt"
echo Zip file: %ZIP_PREFIX%-%STAMP%.zip>> "%~dp0BUILD.txt"

echo Packaging %NAME%...
echo Output: %ZIP%
echo.

tar -a -c -f "%ZIP%" ^
  --exclude=node_modules ^
  --exclude=.next ^
  --exclude=.git ^
  --exclude=.data ^
  --exclude=.env ^
  --exclude=.DS_Store ^
  --exclude=Thumbs.db ^
  --exclude=*.zip ^
  --exclude=tsconfig.tsbuildinfo ^
  --exclude=.cursor ^
  --exclude=coverage ^
  --exclude=campaign-reset-pin.txt ^
  -C "%~dp0.." ^
  "%NAME%"

if errorlevel 1 (
  echo.
  echo Failed. If tar is unavailable, run zip-deploy.sh on a Mac instead.
  pause
  exit /b 1
)

echo.
echo Done: %ZIP%
echo Always use the newest im-YYYYMMDD-HHMMSS.zip — higher date/time = latest build.
pause
