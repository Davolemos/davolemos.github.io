#!/bin/bash
# Regenera ARG-Workflow.zxp a partir de la carpeta com.arg.workflow.
# Ejecútalo cada vez que añadas scripts "de fábrica" al plugin:
#     bash crear-zxp.sh
#
# Necesita ZXPSignCmd (herramienta gratuita de Adobe):
#   https://github.com/Adobe-CEP/CEP-Resources/tree/master/ZXPSignCMD
#   Mac: 4.1.3/macOS/ZXPSignCmd   ·   Windows: 4.1.3/x64/ZXPSignCmd.exe
# Déjalo junto a este script (o en el PATH). En Mac, la primera vez:
#   chmod +x ZXPSignCmd  y permitirlo en Ajustes > Privacidad y seguridad.
#
# Certificado: si existe arg-workflow.p12 junto a este script se reutiliza
# (así las actualizaciones se instalan sobre la versión anterior sin avisos).
# Si no existe, se crea uno autofirmado válido 10 años.

cd "$(dirname "$0")" || exit 1
if [ -x ./ZXPSignCmd ]; then SIGN=./ZXPSignCmd
elif command -v ZXPSignCmd >/dev/null 2>&1; then SIGN=ZXPSignCmd
elif [ -f ./ZXPSignCmd.exe ] && command -v wine >/dev/null 2>&1; then SIGN="wine ./ZXPSignCmd.exe"
else
  echo "Falta ZXPSignCmd. Descárgalo del enlace del encabezado y ponlo junto a este script."
  exit 1
fi

CERT="arg-workflow.p12"
PASS="argworkflow"
if [ ! -f "$CERT" ]; then
  $SIGN -selfSignedCert ES Madrid "ARG" "ARG Workflow" "$PASS" "$CERT" -validityDays 3650 || exit 1
fi

find com.arg.workflow -name '.DS_Store' -delete 2>/dev/null
rm -f ARG-Workflow.zxp
# Con sello de tiempo el .zxp sigue instalándose aunque caduque el certificado.
# Si el servidor de sellos falla, se firma sin él (válido hasta que caduque el certificado).
$SIGN -sign com.arg.workflow ARG-Workflow.zxp "$CERT" "$PASS" -tsa http://timestamp.digicert.com \
  || $SIGN -sign com.arg.workflow ARG-Workflow.zxp "$CERT" "$PASS" || exit 1
$SIGN -verify ARG-Workflow.zxp -skipOnlineRevocationChecks
echo "Creado: ARG-Workflow.zxp"
