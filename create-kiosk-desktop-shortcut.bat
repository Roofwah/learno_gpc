@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set "TARGET=%~dp0start-kiosk.bat"
set "WORKDIR=%~dp0"
set "LINK=%USERPROFILE%\Desktop\Start GPC Kiosk.lnk"
set "ICON=%SystemRoot%\System32\shell32.dll,13"

echo Creating desktop shortcut...
echo   %LINK%

powershell -NoProfile -Command ^
  "$s = (New-Object -ComObject WScript.Shell).CreateShortcut('%LINK%');" ^
  "$s.TargetPath = '%SystemRoot%\System32\cmd.exe';" ^
  "$s.Arguments = '/k \"\"%TARGET%\"\"';" ^
  "$s.WorkingDirectory = '%WORKDIR%';" ^
  "$s.WindowStyle = 1;" ^
  "$s.Description = 'Start local GPC server and open kiosk';" ^
  "$s.IconLocation = '%ICON%';" ^
  "$s.Save()"

if errorlevel 1 (
  echo Failed to create shortcut.
  pause
  exit /b 1
)

echo.
echo Done. Double-click "Start GPC Kiosk" on your desktop.
echo You will be asked for kiosk number 1-8 each time.
echo A window stays open so you can see progress.
echo.
pause
