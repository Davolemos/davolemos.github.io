# Imágenes del sitio

Reemplaza los archivos manteniendo el mismo nombre y la página los toma sola.

```
img/
├── marca/
│   └── simbolo.svg            Símbolo de chóque (también es el favicon). Cámbialo por el SVG oficial.
├── proyectos/
│   ├── ricketts-lab/
│   │   └── portada.jpg        Portada del carrusel · 1600×1200 px (4:3)
│   └── modo-hermetico/
│       └── portada.jpg        Portada del carrusel · 1600×1200 px (4:3)
└── social/                    Imagen para compartir en redes (og.jpg · 1200×630 px)
```

Las portadas actuales están recortadas de una captura de pantalla y tienen poca resolución.

## Agregar un proyecto nuevo

1. Crea `img/proyectos/<nombre-del-proyecto>/portada.jpg` (4:3, ~1600×1200, JPG o WebP de menos de 300 KB).
2. En `index.html`, duplica un bloque `<li class="card">` dentro de `#track`, cambia la ruta de la imagen, el `alt`, el título y la categoría.
3. El contador del carrusel se actualiza solo.
