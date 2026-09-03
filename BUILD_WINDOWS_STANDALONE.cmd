@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 scripts\build_windows_standalone.py
) else (
  python scripts\build_windows_standalone.py
)
if errorlevel 1 (
  echo.
  echo ERROR: no se pudo construir el instalador autonomo L-26.
  exit /b 1
)
echo.
echo Instalador y portable generados en desktop\dist\
endlocal
