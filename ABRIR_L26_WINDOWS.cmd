@echo off
setlocal EnableExtensions
title Fiscalizacion L26 - Aplicacion de escritorio
cd /d "%~dp0desktop"

where node >nul 2>nul
if errorlevel 1 (
  echo ==============================================================
  echo  FISCALIZACION L26 - APLICACION DE ESCRITORIO
  echo ==============================================================
  echo.
  echo ERROR: Node.js no esta disponible en este equipo.
  echo Instale Node.js LTS y vuelva a hacer doble clic en este archivo.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm no esta disponible aunque Node.js esta instalado.
  echo Cierre esta ventana, reinicie Windows y vuelva a intentarlo.
  pause
  exit /b 1
)

if not exist "node_modules\electron\dist\electron.exe" (
  echo ==============================================================
  echo  PRIMERA APERTURA DE L26 EN MODO ESCRITORIO
  echo ==============================================================
  echo.
  echo Se instalara el motor de escritorio Electron una sola vez.
  echo No se abre Chrome ni Edge para ejecutar L26.
  echo Este paso requiere Internet solo durante la primera preparacion.
  echo.
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo ERROR: No se pudo preparar el motor de escritorio.
    echo Revise la conexion a Internet y vuelva a ejecutar este archivo.
    pause
    exit /b 1
  )
)

echo Iniciando Fiscalizacion L26 en modo escritorio...
call npm start
if errorlevel 1 (
  echo.
  echo ERROR: L26 no pudo iniciar en modo escritorio.
  pause
  exit /b 1
)
endlocal
