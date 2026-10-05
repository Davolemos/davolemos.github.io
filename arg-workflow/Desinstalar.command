#!/bin/bash
# ARG Workflow — desinstalador (macOS). No toca la carpeta de scripts de Illustrator.
DESTINO="$HOME/Library/Application Support/Adobe/CEP/extensions/com.arg.workflow"
if [ -d "$DESTINO" ]; then
  rm -rf "$DESTINO"
  echo "ARG Workflow desinstalado. Los scripts de la carpeta de Illustrator no se han tocado."
else
  echo "ARG Workflow no estaba instalado."
fi
read -n 1 -s -r -p "Pulsa una tecla para cerrar."
