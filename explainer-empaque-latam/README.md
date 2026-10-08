# Empaque desde el mostrador

Video explicativo de 65 s: por qué, en la tiendita latinoamericana, el frente del empaque sirve para que te encuentren, y los claims, para cuando ya estás en la mano.

## Entregables

| Archivo | Qué es |
|---|---|
| `out/master_16x9.mp4` | Máster 1920×1080, 60 fps, H.264 (crf 16, yuv420p) + AAC |
| `out/cut_9x16.mp4` | Recomposición vertical 1080×1920 |
| `out/cut_1x1.mp4` | Recomposición cuadrada 1080×1080 |
| `out/master_16x9_reduced_motion.mp4` | Versión de movimiento reducido: la misma secuencia de ideas |
| `out/captions.srt` | Subtítulos (22 entradas); las palabras en pantalla ya van quemadas en el video |
| `contact.png` | Hoja de contactos: un fotograma por beat clave |
| `directions.html` | Las 4 direcciones, con la ganadora y por qué |
| `SCENES.md` · `DECISIONS.md` · `SOURCES.md` | Especificación de escenas, registro de decisiones y fuentes |
| `src/` · `tools/` | Código fuente que vuelve a renderizar todo |

## Volver a renderizar

Requiere node 22, Playwright con Chromium, ffmpeg y python3 con Pillow.

```
./tools/build.sh
```

`src/timeline.js` contiene todos los beats, movimientos y cues; `window.seek(t)` en `src/scene.js` pinta el fotograma del tiempo t.

## Lo que se probó

- **Determinismo:** el mismo fotograma (beat 61, 16:9) renderizado dos veces con la versión final da PNG idénticos byte a byte (sha256 `5a771c0f6f5d5822…`).
- **Archivos:** con ffprobe, los cuatro videos duran 65.000 s, van a 60 fps con las resoluciones de la tabla y tienen una pista AAC.
- **Audio:** con ebur128 sobre la pista del máster: −15.9 LUFS integrados y −5.4 dBFS de true peak (meta: ~−16 LUFS, ≤ −1.5 dBTP).
- **Sincronía del sonido:** el nivel sube 2.5–3 dB justo en los «ping» de los beats 48 y 76.
- **Contraste sobre el fondo #F2EDE4:** tinta 14.8:1, tinta secundaria 8.2:1 y gris de la fuente 5.1:1 (mínimo: 4.5:1).
- **Lectura a 390 px de ancho (9:16):** el texto principal y las etiquetas se leen. La línea de la fuente estaba en ~7 px y la agrandé después de esa prueba.
- **Revisión de diseño:** un subagente revisó los fotogramas con las preguntas de revisión, la lista de prohibidos, el límite de líneas y palabras y la accesibilidad. Apliqué sus 8 hallazgos (ver DECISIONS.md, 19–25).
- **Fotogramas de los MP4 finales:** revisé visualmente fotogramas de los cuatro videos.
- **Destellos:** no hay cambios de brillo de pantalla completa; el video no tiene cortes rápidos ni parpadeo.

## Lo que no se probó

- No vi los videos en tiempo real ni los escuché en altavoces; la verificación del audio fue por medición.
- El dato de NielsenIQ no se verificó en el informe original (ver SOURCES.md).
- No hubo una pasada de accesibilidad con un lector de pantalla ni con usuarios.

## Licencias

Inter Display e IBM Plex Mono tienen licencia SIL Open Font License. Todas las marcas del video son inventadas.
