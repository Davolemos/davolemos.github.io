# Imágenes del sitio

Reemplaza los archivos manteniendo el mismo nombre y la página los toma sola.
Las imágenes actuales están recortadas de capturas de pantalla: cámbialas por los originales
(JPG o WebP, idealmente de menos de 300 KB cada una).

```
img/
├── marca/
│   ├── logo-negro.png             Logo completo en la barra de navegación
│   ├── simbolo-blanco.png         Símbolo en la tarjeta "¿Listo para el impacto?"
│   └── simbolo-negro.png          Símbolo en la franja en movimiento y favicon
├── equipo/equipo.jpg              Foto "Meet the team" (falta) · 1600×900 px
├── social/og.jpg                  Imagen para compartir en redes (falta) · 1200×630 px
└── proyectos/
    ├── chavela/
    │   ├── portada.jpg            Tarjeta y reel en la home · 4:5 (1200×1500)
    │   ├── fachada.jpg            Galería del caso y reel
    │   ├── collage.jpg            Imagen principal del caso · horizontal
    │   ├── logo-poster.jpg        Galería · horizontal
    │   ├── periodico.jpg          Galería · cuadrada
    │   ├── comida.jpg             Galería · cuadrada
    │   ├── merch.jpg              Galería · horizontal
    │   ├── menu.jpg               Galería · cuadrada
    │   └── tote-delantal.jpg      Galería · horizontal
    ├── sultavolo/
    │   ├── portada.jpg            Tarjeta y reel en la home
    │   └── hero, logo, brindis, simbolo, patron, paleta, individual, etiquetas (.jpg)  Página del caso
    ├── mansa-galleta/portada.jpg  Tarjeta · 4:5
    ├── fondas-de-colon/portada.jpg
    └── ricketts-lab/portada.jpg
```

## Agregar un proyecto

1. Crea `img/proyectos/<nombre>/portada.jpg` en 4:5.
2. En `index.html`, duplica un `<li class="card">` dentro de `#track` y cambia imagen, `alt`, nombre y frase.
3. Para una página de caso, copia `proyectos/chavela.html` o `proyectos/sultavolo.html`, cambia textos e imágenes y enlaza la tarjeta a ella.
