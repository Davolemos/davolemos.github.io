# Domestika Notes

Extensión de Chrome que va recogiendo los subtítulos de las lecciones de Domestika
mientras las ves y los exporta en Markdown, para estudiarlos y destilarlos en skills.

No descarga videos ni usa ninguna API: solo lee el texto de los subtítulos que el
reproductor ya muestra y lo guarda en tu navegador.

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
3. **Copiar curso en Markdown** y pégaselo a Claude, o **Descargar .md**.
4. Cuando termines el curso, **Borrar este curso** para liberar espacio.

## Si no recoge nada

- Comprueba que la lección tenga subtítulos en el menú del reproductor.
- Activa los subtítulos a mano una vez y recarga la página.
- Si sigue vacío, el reproductor puede estar pintándolos de otra forma: avísale a
  Claude y ajusta los selectores en `content.js` (`CAPTION_SELECTORS`).

## Uso responsable

Es para tu estudio personal de cursos que compraste. Comparte la skill que
destiles (tu método, con tus palabras), no la transcripción.
