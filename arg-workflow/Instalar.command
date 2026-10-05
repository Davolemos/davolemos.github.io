#!/bin/bash
# ARG Workflow — instalador para Illustrator (macOS)
# Copia el panel a la carpeta de extensiones CEP del usuario y activa el modo
# que permite a Illustrator cargar paneles sin firma de Adobe.

cd "$(dirname "$0")" || exit 1
ORIGEN="com.arg.workflow"
DESTINO="$HOME/Library/Application Support/Adobe/CEP/extensions/com.arg.workflow"

if [ ! -d "$ORIGEN" ]; then
  echo "No encuentro la carpeta $ORIGEN junto a este instalador."
  read -n 1 -s -r -p "Pulsa una tecla para cerrar."; exit 1
fi

if pgrep -xq "Adobe Illustrator"; then
  echo "Illustrator está abierto. Ciérralo del todo y vuelve a ejecutar este instalador."
  read -n 1 -s -r -p "Pulsa una tecla para cerrar."; exit 1
fi

mkdir -p "$(dirname "$DESTINO")"
rm -rf "$DESTINO"
cp -R "$ORIGEN" "$DESTINO"
xattr -dr com.apple.quarantine "$DESTINO" 2>/dev/null || true

# PlayerDebugMode=1 permite paneles sin firmar. CSXS.7 … CSXS.15 cubre
# Illustrator CC 2017 hasta versiones futuras.
for v in 7 8 9 10 11 12 13 14 15; do
  defaults write com.adobe.CSXS.$v PlayerDebugMode 1
done
killall cfprefsd 2>/dev/null || true

echo ""
echo "ARG Workflow instalado en:"
echo "  $DESTINO"
echo "Para añadir scripts: carpeta de scripts de Illustrator (botón de carpeta del panel)."
echo ""
echo "Abre Illustrator y ve a  Ventana > Extensiones > ARG Workflow"
echo ""
read -n 1 -s -r -p "Pulsa una tecla para cerrar."
