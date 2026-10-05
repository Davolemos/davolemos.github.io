@echo off
rem ARG Workflow - desinstalador (Windows). No toca Documentos\ARG Workflow.
set "DESTINO=%APPDATA%\Adobe\CEP\extensions\com.arg.workflow"
if exist "%DESTINO%" (
  rmdir /S /Q "%DESTINO%"
  echo ARG Workflow desinstalado. Tus scripts personales siguen en Documentos\ARG Workflow.
) else (
  echo ARG Workflow no estaba instalado.
)
pause
