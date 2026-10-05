#!/bin/bash
# ARG Workflow — desinstalador (macOS). No toca Documentos/ARG Workflow.
DESTINO="$HOME/Library/Application Support/Adobe/CEP/extensions/com.arg.workflow"
if [ -d "$DESTINO" ]; then
  rm -rf "$DESTINO"
  echo "ARG Workflow desinstalado. Tus scripts personales siguen en ~/Documents/ARG Workflow."
else
  echo "ARG Workflow no estaba instalado."
fi
read -n 1 -s -r -p "Pulsa una tecla para cerrar."
