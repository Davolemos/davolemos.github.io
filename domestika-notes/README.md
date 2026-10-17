# Domestika Notes

Extensión de Chrome que, mientras ves una lección de Domestika, va recogiendo los
subtítulos y una imagen de cada escena clave (cuando cambia la lámina, el
diagrama o el ejemplo). Lo exporta todo en un ZIP con un Markdown y sus imágenes,
para estudiarlo y destilarlo en skills.

No descarga videos ni usa ninguna API: todo se queda en tu navegador.

## Instalar

1. Abre `chrome://extensions`.
2. Activa **Modo de desarrollador** (arriba a la derecha).
3. Pulsa **Cargar descomprimida** y elige esta carpeta `domestika-notes/`.
4. Fija el icono en la barra de Chrome.

## Usar

1. Entra a una lección de un curso tuyo en Domestika y dale play.
   - Funciona con cualquier velocidad (1.5x, 2x).
   - El curso tiene que tener subtítulos. No hace falta tenerlos visibles: si
     están apagados, la extensión activa una pista en modo oculto.
2. Abre el icono: verás el curso y cuántas líneas lleva cada lección.
3. **Descargar ZIP (Markdown + imágenes)**: una carpeta con `curso.md` y
   `img/`, con cada imagen en su minuto. Ábrelo en Obsidian, Notion o
   Typora, o súbeselo a Claude.
   **Copiar solo el texto** copia el Markdown sin imágenes para pegarlo en el chat.
4. Cuando termines el curso, **Borrar este curso** para liberar espacio.

## Imágenes

- Se guarda una imagen cuando la escena cambia de verdad, con al menos 15 s entre
  capturas y un máximo de 40 automáticas por lección.
- **Alt+Shift+S** captura la escena actual a mano, sin límite. Puedes cambiar el
  atajo en `chrome://extensions/shortcuts`.
- Puedes apagar las capturas automáticas desde el icono.
- Si las automáticas no aparecen, puede que Domestika no deje leer el video. El
  atajo manual sigue funcionando porque hace una captura de la pestaña.

## Si no recoge nada

- Comprueba que la lección tenga subtítulos en el menú del reproductor.
- Activa los subtítulos a mano una vez y recarga la página.
- Si sigue vacío: con la lección sonando y los subtítulos activados, abre el
  icono, pulsa **Diagnóstico** y pégale a Claude lo que se copia. Describe cómo
  está montado el reproductor para ajustar la captura.

## Uso responsable

Es para tu estudio personal de cursos que compraste. Comparte la skill que
destiles (tu método, con tus palabras), no la transcripción.
