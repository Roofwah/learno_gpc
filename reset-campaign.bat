@echo off
cd /d "%~dp0"
if not exist ".data" mkdir ".data"
echo []> ".data\scores.json"
if exist ".data\session.json" del /f ".data\session.json"
echo Campaign reset: scores cleared, session removed.
echo This bypasses the Master PIN (organizer-only). Start the hub when done.
pause
