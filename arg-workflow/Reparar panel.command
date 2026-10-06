#!/bin/bash
# ARG Workflow — si el panel se ve gris/vacío (bug de Adobe en Illustrator 2026 +
# CEP 12.1 en Mac Apple Silicon), este script reinicia solo el proceso de dibujo
# del panel, sin cerrar Illustrator. Después cierra la pestaña del panel y
# vuelve a abrirla desde Ventana > Extensiones > ARG Workflow.
if pkill -f "[C]EPHtmlEngine.*com[.]arg[.]workflow"; then
  echo "Motor del panel reiniciado."
  echo "Ahora cierra la pestaña del panel y vuelve a abrirla: Ventana > Extensiones > ARG Workflow."
else
  echo "No había ningún proceso del panel en marcha. Abre el panel desde Ventana > Extensiones > ARG Workflow."
fi
read -n 1 -s -r -p "Pulsa una tecla para cerrar."
