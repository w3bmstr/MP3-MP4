@echo off
title Groove Player
echo.
echo  Starting Groove Player...
echo  Browser will open automatically at http://localhost:3000
echo.
echo  Close this window to stop the server.
echo.
node "%~dp0server.js"
pause
