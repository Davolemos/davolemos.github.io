#!/bin/bash
# Empaqueta el panel como ARG-Workflow.zxp firmado (certificado autofirmado).
# Un .zxp se instala con un "ZXP installer" (p. ej. ExManCmd de Adobe o el
# ZXP Installer de aescripts) y NO necesita PlayerDebugMode. Es la forma de
# repartir el panel a otros ordenadores sin usar Instalar.command.
#
# Requiere ZXPSignCmd, que Adobe publica en:
#   https://github.com/Adobe-CEP/CEP-Resources/tree/master/ZXPSignCMD
# Déjalo junto a este script (o en el PATH) y ejecuta:  bash crear-zxp.sh

cd "$(dirname "$0")" || exit 1
SIGN="./ZXPSignCmd"
command -v ZXPSignCmd >/dev/null 2>&1 && SIGN="ZXPSignCmd"
if [ ! -x "$SIGN" ] && ! command -v ZXPSignCmd >/dev/null 2>&1; then
  echo "Falta ZXPSignCmd. Descárgalo del enlace del encabezado y ponlo junto a este script."
  exit 1
fi

CERT="arg-workflow.p12"
PASS="argworkflow"
if [ ! -f "$CERT" ]; then
  "$SIGN" -selfSignedCert ES Madrid "ARG" "ARG Workflow" "$PASS" "$CERT" || exit 1
fi
rm -f ARG-Workflow.zxp
"$SIGN" -sign com.arg.workflow ARG-Workflow.zxp "$CERT" "$PASS" -tsa http://timestamp.digicert.com || exit 1
echo "Creado: ARG-Workflow.zxp"
