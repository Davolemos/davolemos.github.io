@echo off
rem ARG Workflow - instalador para Illustrator (Windows)
setlocal
set "ORIGEN=%~dp0com.arg.workflow"
set "DESTINO=%APPDATA%\Adobe\CEP\extensions\com.arg.workflow"

if not exist "%ORIGEN%\CSXS\manifest.xml" (
  echo No encuentro la carpeta com.arg.workflow junto a este instalador.
  pause & exit /b 1
)

tasklist /FI "IMAGENAME eq Illustrator.exe" 2>NUL | find /I "Illustrator.exe" >NUL
if not errorlevel 1 (
  echo Illustrator esta abierto. Cierralo del todo y vuelve a ejecutar este instalador.
  pause & exit /b 1
)

if exist "%DESTINO%" rmdir /S /Q "%DESTINO%"
xcopy /E /I /Q /Y "%ORIGEN%" "%DESTINO%" >NUL

rem PlayerDebugMode=1 permite paneles sin firmar (CSXS.7 ... CSXS.15).
for %%v in (7 8 9 10 11 12 13 14 15) do (
  reg add "HKCU\Software\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >NUL
)

echo.
echo ARG Workflow instalado en:
echo   %DESTINO%
echo Para anadir scripts: Documentos\ARG Workflow\scripts (boton de carpeta del panel).
echo.
echo Abre Illustrator y ve a  Ventana ^> Extensiones ^> ARG Workflow
echo.
pause
