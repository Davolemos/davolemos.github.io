// ── ARG Workflow · configuración del panel ──────────────────────────────
//
// NO hace falta tocar este archivo para añadir scripts: basta con copiar el
// .js / .jsx a una carpeta de scripts y pulsar "Recargar" en el panel.
//
//   · Cada SUBCARPETA de scripts/ es un grupo del panel. El prefijo numérico
//     ("01 ", "02 ") solo sirve para ordenarlas y no se muestra.
//   · Los scripts sueltos en la raíz de scripts/ van al grupo "Otros".
//   · Los scripts que añadas DESPUÉS de instalar van en
//       Documentos/ARG Workflow/scripts/   (botón 📂 del panel)
//     y sobreviven a cualquier reinstalación. Puedes crear ahí subcarpetas
//     con el mismo nombre que las del plugin para mezclarlos en un grupo.
//
// Este archivo solo sirve para dos cosas opcionales:
//   1. "nombres": el texto del botón (o del grupo) cuando el nombre del
//      archivo no queda bonito. Clave = nombre exacto del archivo o carpeta.
//   2. "cadenas": botones que ejecutan varios scripts seguidos, en orden.
//
// Si existe Documentos/ARG Workflow/botones.js con esta misma forma, se
// combina con este: sus nombres mandan y sus cadenas se suman.

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

  // Ejemplo (quita las barras // para activarlo):
  // cadenas: [
  //   { nombre: "Artefinalizar + empaquetar",
  //     scripts: ["Artefinalizador-v3.jsx", "EMPAQUETADO-EXPRESS.js"] }
  // ]
  cadenas: []

};
