@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set "TARGET=%~dp0start-kiosk.bat"
set "WORKDIR=%~dp0"
set "LINK=%USERPROFILE%\Desktop\Start GPC Kiosk.lnk"
set "ICON=%SystemRoot%\System32\shell32.dll,13"

echo.
echo === Create desktop shortcut for THIS kiosk PC ===
echo.

set "KIOSK="
set /p "KIOSK=Which kiosk is this PC (1-8)? "

set "KIOSK=%KIOSK: =%"
if "%KIOSK%"=="" goto :bad_kiosk
echo %KIOSK%| findstr /r "^[1-8]$" >nul || goto :bad_kiosk

echo %KIOSK%> "%~dp0kiosk-number.txt"

echo Creating desktop shortcut for Kiosk %KIOSK%...
echo   %LINK%

powershell -NoProfile -Command ^
  "$s = (New-Object -ComObject WScript.Shell).CreateShortcut('%LINK%');" ^
  "$s.TargetPath = '%SystemRoot%\System32\cmd.exe';" ^
  "$s.Arguments = '/k \"\"%TARGET%\" %KIOSK%\"';" ^
  "$s.WorkingDirectory = '%WORKDIR%';" ^
  "$s.WindowStyle = 1;" ^
  "$s.Description = 'Start GPC Kiosk %KIOSK%';" ^
  "$s.IconLocation = '%ICON%';" ^
  "$s.Save()"

if errorlevel 1 (
  echo Failed to create shortcut.
  pause
  exit /b 1
)

echo.
echo Done. Double-click "Start GPC Kiosk" — always opens Kiosk %KIOSK%.
echo To change number later, run this script again or edit kiosk-number.txt
echo.
pause
exit /b 0

:bad_kiosk
echo Invalid kiosk number. Use 1 through 8.
pause
exit /b 1
