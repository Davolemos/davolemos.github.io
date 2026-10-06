// ── ARG Workflow · configuración del panel ──────────────────────────────
//
// NO hace falta tocar este archivo para añadir scripts.
//
//   · Todos los scripts viven en  Documentos/ARG Workflow/scripts/
//     (el botón de carpeta del panel la abre). Es una carpeta tuya: no
//     depende de la versión de Illustrator ni de reinstalar el plugin.
//   · Al abrirse, el panel copia ahí los scripts "de fábrica" de
//     com.arg.workflow/scripts/ que falten (o que tengan versión más nueva).
//   · Cada SUBCARPETA es un grupo del panel. El prefijo numérico ("01 ",
//     "02 ") solo sirve para ordenarlas y no se muestra. Los scripts sueltos
//     en la raíz van al grupo "Otros".
//   · Para añadir un script: cópialo a esa carpeta (o a una subcarpeta) y
//     pulsa recargar en el panel.
//
// Este archivo solo sirve para tres cosas opcionales:
//   1. "nombres": el texto del botón (o del grupo) cuando el nombre del
//      archivo no queda bonito. Clave = nombre exacto del archivo o carpeta.
//   2. "iconos": el icono de la tarjeta. Clave = archivo o carpeta (el de la
//      carpeta se aplica a todos sus scripts sin icono propio). Valores:
//      plantilla, cuaderno, texto, color, pantone, negro, imagen, revisar,
//      paquete, pdf, exportar, vector, cadena, script (el de por defecto).
//   3. "cadenas": botones que ejecutan varios scripts seguidos, en orden.
//
// El panel crea Documentos/ARG Workflow/botones.js con esta misma forma para
// tus ajustes; se combina con este: sus nombres mandan y sus cadenas se suman.

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
    "Vectorizar_silueta.jsx":   "Vectorizar silueta",
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
    "Vectorizar_silueta.jsx":   "vector",
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
