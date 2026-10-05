@echo off
rem ARG Workflow - desinstalador (Windows). No toca la carpeta de scripts de Illustrator.
set "DESTINO=%APPDATA%\Adobe\CEP\extensions\com.arg.workflow"
if exist "%DESTINO%" (
  rmdir /S /Q "%DESTINO%"
  echo ARG Workflow desinstalado. Los scripts de la carpeta de Illustrator no se han tocado.
) else (
  echo ARG Workflow no estaba instalado.
)
pause
