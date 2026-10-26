# Web a PDF

Extensión de Chrome que guarda la página que estás viendo como PDF completo, de
arriba abajo, con sus imágenes, colores y fondos tal como se ven en pantalla.

- El texto se puede seleccionar y buscar, y los enlaces siguen funcionando.
- Carga las imágenes perezosas (las que aparecen al hacer scroll) antes de guardar.
- Las portadas que miden "una pantalla" mantienen su altura, en vez de estirarse.
- Las cabeceras fijas aparecen una vez arriba, no repetidas en cada hoja.

## Instalar

1. Abre `chrome://extensions`.
2. Activa **Modo de desarrollador** (arriba a la derecha).
3. Pulsa **Cargar descomprimida** y elige esta carpeta `web-pdf/`.
4. Fija el icono en la barra de Chrome.

## Usar

1. Abre la web y cierra antes los avisos de cookies o los pop-ups.
2. Pulsa el icono y elige:
   - **Una página larga**: todo en una sola hoja continua, igual que en pantalla.
     Si la web es larguísima (más de unos 5 metros), se parte en tramos largos
     para que cualquier lector de PDF la abra.
   - **Hojas A4**: el mismo diseño escalado a A4, para imprimir o leer por páginas.
3. El PDF se guarda en **Descargas** con el título de la web y la fecha.

Mientras trabaja, Chrome muestra arriba el aviso *"Web a PDF ha empezado a
depurar este navegador"*. Es normal: usa la misma función de imprimir a PDF que
las DevTools, y el aviso se va al terminar.

## Límites

- No funciona en páginas internas de Chrome (`chrome://`) ni en la Chrome Web Store.
- Si tienes abiertas las DevTools en esa pestaña, ciérralas antes.
- En webs con scroll infinito, recorre como máximo 45 segundos de contenido.
- Videos y animaciones salen como el fotograma que se ve en ese momento.
