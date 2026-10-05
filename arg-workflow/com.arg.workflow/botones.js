// ── ARG Workflow · configuración del panel ──────────────────────────────
//
// NO hace falta tocar este archivo para añadir scripts: basta con copiar el
// .js / .jsx a una carpeta de scripts y pulsar "Recargar" en el panel.
//
//   · Cada SUBCARPETA de scripts/ es un grupo del panel. El prefijo numérico
//     ("01 ", "02 ") solo sirve para ordenarlas y no se muestra.
//   · Los scripts sueltos en la raíz de scripts/ van al grupo "Otros".
//   · Los scripts que añadas DESPUÉS de instalar van en la carpeta de scripts
//     de Illustrator (la misma de Archivo > Scripts; el botón de carpeta del
//     panel la abre):
//       Mac:     /Applications/Adobe Illustrator 2026/Presets.localized/es_ES/Scripts
//       Windows: C:\Program Files\Adobe\Adobe Illustrator 2026\Presets\es_ES\Scripts
//     Sobreviven a cualquier reinstalación del plugin. Puedes crear ahí
//     subcarpetas con el mismo nombre que las del plugin para mezclarlos.
//
// Este archivo solo sirve para tres cosas opcionales:
//   1. "nombres": el texto del botón (o del grupo) cuando el nombre del
//      archivo no queda bonito. Clave = nombre exacto del archivo o carpeta.
//   2. "iconos": el icono de la tarjeta. Clave = archivo o carpeta (el de la
//      carpeta se aplica a todos sus scripts sin icono propio). Valores:
//      plantilla, cuaderno, texto, color, pantone, negro, imagen, revisar,
//      paquete, pdf, exportar, cadena, script (el de por defecto).
//   3. "cadenas": botones que ejecutan varios scripts seguidos, en orden.
//
// Si en esa carpeta de scripts de Illustrator existe un botones.js con esta
// misma forma, se combina con este: sus nombres mandan y sus cadenas se suman.

var ARG_CONFIG = {

  nombres: {
    // Grupos (carpetas)
    "01 Plantillas": "Plantillas",
    "02 Edicion":    "Edición",
    "03 Salida":     "Salida",

    // Scripts
    "Plantilla-de-diseno.js":   "Plantilla de diseño",
    "Plantillas-cuadernos.js":  "Plantillas de cuadernos",
    "Replace_Text.jsx":         "Reemplazar texto",
    "Pantone_Generator.js":     "Generar Pantone",
    "NEGROS 100%.js":           "Negros 100%",
    "Rasterize.js":             "Rasterizar",
    "Artefinalizador-v3.jsx":   "Artefinalizador",
    "EMPAQUETADO-EXPRESS.js":   "Empaquetado express",
    "PDF OPTIMIZADO.js":        "PDF optimizado",
    "Exportar_AI_a_JPG.jsx":    "Exportar AI a JPG"
  },

  iconos: {
    "01 Plantillas": "plantilla",
    "02 Edicion":    "script",
    "03 Salida":     "exportar",

    "Plantilla-de-diseno.js":   "plantilla",
    "Plantillas-cuadernos.js":  "cuaderno",
    "Replace_Text.jsx":         "texto",
    "Pantone_Generator.js":     "pantone",
    "NEGROS 100%.js":           "negro",
    "Rasterize.js":             "imagen",
    "Artefinalizador-v3.jsx":   "revisar",
    "EMPAQUETADO-EXPRESS.js":   "paquete",
    "PDF OPTIMIZADO.js":        "pdf",
    "Exportar_AI_a_JPG.jsx":    "exportar"
  },

  // Ejemplo (quita las barras // para activarlo):
  // cadenas: [
  //   { nombre: "Artefinalizar + empaquetar", icono: "cadena",
  //     scripts: ["Artefinalizador-v3.jsx", "EMPAQUETADO-EXPRESS.js"] }
  // ]
  cadenas: []

};
