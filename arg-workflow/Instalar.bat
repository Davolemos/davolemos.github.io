@echo off
rem ARG Workflow - instalador para Illustrator (Windows)
setlocal
set "ORIGEN=%~dp0com.arg.workflow"
set "DESTINO=%APPDATA%\Adobe\CEP\extensions\com.arg.workflow"
set "PERSONAL=%USERPROFILE%\Documents\ARG Workflow\scripts"

if not exist "%ORIGEN%\CSXS\manifest.xml" (
  echo No encuentro la carpeta com.arg.workflow junto a este instalador.
  pause & exit /b 1
)

tasklist /FI "IMAGENAME eq Illustrator.exe" 2>NUL | find /I "Illustrator.exe" >NUL
if not errorlevel 1 (
  echo Illustrator esta abierto. Cierralo del todo y vuelve a ejecutar este instalador.
  pause & exit /b 1
)

if not exist "%PERSONAL%" mkdir "%PERSONAL%"
if exist "%DESTINO%" rmdir /S /Q "%DESTINO%"
xcopy /E /I /Q /Y "%ORIGEN%" "%DESTINO%" >NUL

rem PlayerDebugMode=1 permite paneles sin firmar (CSXS.7 ... CSXS.15).
for %%v in (7 8 9 10 11 12 13 14 15) do (
  reg add "HKCU\Software\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >NUL
)

echo.
echo ARG Workflow instalado en:
echo   %DESTINO%
echo Carpeta para tus scripts personales:
echo   %PERSONAL%
echo.
echo Abre Illustrator y ve a  Ventana ^> Extensiones ^> ARG Workflow
echo.
pause
