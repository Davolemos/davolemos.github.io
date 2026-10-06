// Vectorizar silueta — ARG Workflow
// Convierte la forma de una imagen (PNG con transparencia, o JPG sobre fondo
// blanco) en un vector relleno de negro, en un clic. Equivale a: Editar colores
// > negro al 100%  →  Calco de imagen (Siluetas)  →  Expandir.
//
// Cómo decide qué es "forma":
//   · PNG con transparencia: TODO lo que no sea transparente es forma, sea del
//     color que sea (también el blanco). Se hace componiendo la imagen sobre
//     negro, invirtiendo colores y calcando; se une con un segundo calco de las
//     zonas oscuras para no dejar huecos en sombras muy negras.
//   · Imagen sin transparencia: todo lo que no sea blanco puro es forma.
// La imagen original no se toca; el vector queda encima, en un grupo "Silueta",
// relleno K100 (o RGB 0,0,0 si el documento es RGB), sin trazo y seleccionado.
// Acepta varias imágenes, aunque estén dentro de grupos o máscaras (p. ej.
// pegadas desde Photoshop).
#target illustrator

(function () {
    if (app.documents.length === 0) { alert("Abre un documento primero."); return; }
    var doc = app.activeDocument;
    var UMBRAL = 254;       // píxeles más claros que esto se consideran blanco/fondo
    var RESOLUCION = 600;   // ppp de la copia de trabajo (solo afecta a la precisión del borde)

    // ── 1. Buscar imágenes dentro de la selección (también en grupos y máscaras) ──
    function recoger(item, lista) {
        var t = item.typename, i;
        if (t === "RasterItem" || t === "PlacedItem") { lista.push(item); }
        else if (t === "GroupItem") { for (i = 0; i < item.pageItems.length; i++) { recoger(item.pageItems[i], lista); } }
    }
    var sel = doc.selection, imagenes = [], i;
    for (i = 0; i < sel.length; i++) { recoger(sel[i], imagenes); }
    if (!imagenes.length) {
        alert("Selecciona una imagen (PNG, JPG...) y vuelve a pulsar el botón.");
        return;
    }

    // ── Utilidades ──
    var preset = null;
    try {
        var lista = app.tracingPresetsList;
        for (i = 0; i < lista.length; i++) { if (/silhou|silueta/i.test(lista[i])) { preset = lista[i]; break; } }
    } catch (e0) {}

    function negro() {
        if (doc.documentColorSpace === DocumentColorSpace.RGB) {
            var r = new RGBColor(); r.red = 0; r.green = 0; r.blue = 0; return r;
        }
        var k = new CMYKColor(); k.cyan = 0; k.magenta = 0; k.yellow = 0; k.black = 100; return k;
    }
    function pintar(item, color) {
        var j;
        if (item.typename === "PathItem") { item.filled = true; item.fillColor = color; item.stroked = false; }
        else if (item.typename === "CompoundPathItem") { for (j = 0; j < item.pathItems.length; j++) { pintar(item.pathItems[j], color); } }
        else if (item.typename === "GroupItem") { for (j = 0; j < item.pageItems.length; j++) { pintar(item.pageItems[j], color); } }
    }
    // Calco blanco y negro con umbral alto y expansión. Devuelve el grupo expandido.
    function calcar(raster) {
        var calco = raster.trace();
        var op = calco.tracing.tracingOptions;
        if (preset) { try { op.loadFromPreset(preset); } catch (e1) {} }
        op.tracingMode = TracingModeType.TRACINGMODEBLACKANDWHITE;
        op.threshold = UMBRAL;
        op.fills = true;
        op.strokes = false;
        op.ignoreWhite = true;
        op.snapCurveToLines = false;
        app.redraw();
        return calco.tracing.expandTracing();
    }
    // Une varios grupos en una sola forma con Buscatrazos > Unificar.
    function unir(grupos) {
        if (grupos.length === 1) { return grupos[0]; }
        var j;
        doc.selection = null;
        for (j = 0; j < grupos.length; j++) { grupos[j].selected = true; }
        try {
            app.executeMenuCommand("Live Pathfinder Add");
            app.executeMenuCommand("expandStyle");
            var s = doc.selection;
            if (s.length === 1) { return s[0]; }
            var g = doc.activeLayer.groupItems.add();
            for (j = s.length - 1; j >= 0; j--) { s[j].move(g, ElementPlacement.PLACEATBEGINNING); }
            return g;
        } catch (e2) {
            // Si Buscatrazos falla, se dejan las dos formas superpuestas en un grupo.
            var g2 = doc.activeLayer.groupItems.add();
            for (j = grupos.length - 1; j >= 0; j--) { grupos[j].move(g2, ElementPlacement.PLACEATBEGINNING); }
            return g2;
        }
    }

    // ── 2. Procesar cada imagen ──
    var resultados = [], errores = [];
    for (i = 0; i < imagenes.length; i++) {
        var img = imagenes[i], temporales = [];
        try {
            if (img.typename === "PlacedItem") {
                doc.selection = null; img.selected = true;
                try { img.embed(); } catch (e3) {}
                var s0 = doc.selection;
                if (s0.length && s0[0].typename === "RasterItem") { img = s0[0]; }
            }
            var capa = img.layer;
            var partes = [];

            // A) Zonas oscuras (lo que no es blanco). Sobre una copia, fuera de grupos/máscaras.
            var copiaA = img.duplicate(capa, ElementPlacement.PLACEATBEGINNING);
            temporales.push(copiaA);
            partes.push(calcar(copiaA));

            // B) Si hay transparencia: todo lo opaco, sea del color que sea.
            var conAlfa = false;
            try { conAlfa = img.transparent === true; } catch (e4) {}
            if (conAlfa) {
                var copiaB = img.duplicate(capa, ElementPlacement.PLACEATBEGINNING);
                var ro = new RasterizeOptions();
                ro.transparency = false;
                ro.backgroundBlack = true;          // transparente -> negro
                ro.resolution = RESOLUCION;
                ro.antiAliasingMethod = AntiAliasingMethod.ARTOPTIMIZED;
                var plano = doc.rasterize(copiaB, ro); // copiaB se reemplaza por el nuevo raster
                temporales.push(plano);
                doc.selection = null; plano.selected = true;
                app.executeMenuCommand("Colors6");  // Invertir colores: fondo blanco, forma oscura
                var s1 = doc.selection;
                if (s1.length && s1[0].typename === "RasterItem") { plano = s1[0]; }
                partes.push(calcar(plano));
            }

            var forma = unir(partes);
            forma.name = "Silueta";
            pintar(forma, negro());
            resultados.push(forma);
        } catch (e) {
            errores.push("Imagen " + (i + 1) + ": " + e.message);
        }
        // Limpiar copias de trabajo que sigan existiendo (los calcos ya consumieron las suyas).
        for (var t = 0; t < temporales.length; t++) { try { temporales[t].remove(); } catch (e5) {} }
    }

    doc.selection = null;
    for (i = 0; i < resultados.length; i++) { try { resultados[i].selected = true; } catch (e6) {} }
    app.redraw();

    if (errores.length) {
        alert("Vectorizadas: " + resultados.length + "\nCon error: " + errores.length + "\n\n" + errores.join("\n"));
    }
})();
