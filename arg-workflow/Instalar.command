#!/bin/bash
# ARG Workflow — instalador para Illustrator (macOS)
# Copia el panel a la carpeta de extensiones CEP del usuario y activa el modo
# que permite a Illustrator cargar paneles sin firma de Adobe.

cd "$(dirname "$0")" || exit 1
ORIGEN="com.arg.workflow"
DESTINO="$HOME/Library/Application Support/Adobe/CEP/extensions/com.arg.workflow"
PERSONAL="$HOME/Documents/ARG Workflow/scripts"

if [ ! -d "$ORIGEN" ]; then
  echo "No encuentro la carpeta $ORIGEN junto a este instalador."
  read -n 1 -s -r -p "Pulsa una tecla para cerrar."; exit 1
fi

if pgrep -xq "Adobe Illustrator"; then
  echo "Illustrator está abierto. Ciérralo del todo y vuelve a ejecutar este instalador."
  read -n 1 -s -r -p "Pulsa una tecla para cerrar."; exit 1
fi

# Scripts que se hubieran añadido a mano dentro de una instalación anterior
# (versión 1.x guardaba todo dentro de la extensión) pasan a la carpeta personal.
if [ -d "$DESTINO/scripts" ]; then
  mkdir -p "$PERSONAL"
  find "$DESTINO/scripts" -type f \( -iname '*.js' -o -iname '*.jsx' \) ! -name '.*' | while read -r f; do
    rel="${f#$DESTINO/scripts/}"
    # Se conserva solo si no viene (con ese nombre) en la versión que se instala.
    if [ -z "$(find "$ORIGEN/scripts" -type f -name "$(basename "$f")" -print -quit)" ]; then
      mkdir -p "$PERSONAL/$(dirname "$rel")"
      [ -e "$PERSONAL/$rel" ] || { cp "$f" "$PERSONAL/$rel"; echo "Conservado en carpeta personal: $rel"; }
    fi
  done
fi

mkdir -p "$(dirname "$DESTINO")" "$PERSONAL"
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
echo "Carpeta para tus scripts personales:"
echo "  $PERSONAL"
echo ""
echo "Abre Illustrator y ve a  Ventana > Extensiones > ARG Workflow"
echo ""
read -n 1 -s -r -p "Pulsa una tecla para cerrar."
