@echo off
setlocal
cd /d "%~dp0"
if "%~1"=="" (
  echo Uso: SUBIR_A_GITHUB.cmd https://github.com/USUARIO/REPOSITORIO.git
  echo.
  echo Requiere Git instalado y autenticacion configurada para GitHub.
  exit /b 2
)
where git >nul 2>nul
if errorlevel 1 (
  echo ERROR: Git no esta instalado o no esta en PATH.
  exit /b 3
)
git remote remove origin >nul 2>nul
git remote add origin "%~1"
git push -u origin main
if errorlevel 1 exit /b 4
echo.
echo Repositorio L-26 actualizado en GitHub.
endlocal
