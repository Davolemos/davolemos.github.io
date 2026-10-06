// Vectorizar silueta — ARG Workflow
// Con la imagen seleccionada: Calco de imagen "Siluetas" + Expandir, en un clic.
// Deja la forma rellena de negro K100 (RGB 0,0,0 si el documento es RGB), sin
// trazo, en un grupo "Silueta", seleccionada. La imagen original no se toca.
//
// Para que TODA la figura cuente como forma aunque tenga zonas blancas (como
// hace tu paso de "Negro 100 %"), en imágenes con transparencia se calcan dos
// copias: la original (recoge todo lo que no es blanco) y la misma con los
// colores invertidos (recoge todo lo que no es negro, es decir, también el
// blanco). Las dos formas se unen con Buscatrazos > Unificar.
// Solo usa operaciones básicas: duplicar, invertir colores, calcar, expandir,
// unificar. Nada de rasterizar ni cuadros de diálogo.
// Acepta varias imágenes, aunque estén dentro de grupos o máscaras.
#target illustrator

(function () {
    if (app.documents.length === 0) { alert("Abre un documento primero."); return; }
    var doc = app.activeDocument;

    // ── Ajustes ──
    var UMBRAL = 254;    // píxeles más claros que esto se consideran fondo
    var SUAVIDAD = 60;   // 0-100: menos = curvas más suaves y menos puntos
    var ESQUINAS = 20;   // 0-100: menos = menos esquinas
    var RUIDO = 50;      // px: ignora manchas más pequeñas que esto

    // ── 1. Imágenes dentro de la selección (también en grupos y máscaras) ──
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
    // Calco "Siluetas" + Expandir. Devuelve el grupo expandido.
    function calcarYExpandir(raster) {
        var calco = raster.trace();
        var op = calco.tracing.tracingOptions;
        if (preset) { try { op.loadFromPreset(preset); } catch (e1) {} }
        op.tracingMode = TracingModeType.TRACINGMODEBLACKANDWHITE;
        op.threshold = UMBRAL;
        op.fills = true;
        op.strokes = false;
        op.ignoreWhite = true;
        op.snapCurveToLines = false;
        try { op.pathFidelity = SUAVIDAD; } catch (e2) {}
        try { op.cornerFidelity = ESQUINAS; } catch (e3) {}
        try { op.noiseFidelity = RUIDO; } catch (e4) {}
        app.redraw();
        return calco.tracing.expandTracing();
    }
    // Une dos formas en una con Buscatrazos > Unificar (Efecto + Expandir apariencia).
    function unir(a, b) {
        doc.selection = null;
        a.selected = true; b.selected = true;
        try {
            app.executeMenuCommand("Live Pathfinder Add");
            app.executeMenuCommand("expandStyle");
            var s = doc.selection;
            if (s.length === 1) { return s[0]; }
            var g = doc.activeLayer.groupItems.add();
            for (var j = s.length - 1; j >= 0; j--) { s[j].move(g, ElementPlacement.PLACEATBEGINNING); }
            return g;
        } catch (e) {
            // Si Unificar no está disponible, se dejan las dos formas superpuestas en un grupo.
            var g2 = doc.activeLayer.groupItems.add();
            b.move(g2, ElementPlacement.PLACEATBEGINNING);
            a.move(g2, ElementPlacement.PLACEATBEGINNING);
            return g2;
        }
    }

    // ── 2. Procesar cada imagen ──
    var resultados = [], errores = [];
    for (i = 0; i < imagenes.length; i++) {
        var img = imagenes[i], forma = null, formaInv = null, copia = null, copiaInv = null;
        try {
            if (img.typename === "PlacedItem") {
                doc.selection = null; img.selected = true;
                try { img.embed(); } catch (e5) {}
                var s0 = doc.selection;
                if (s0.length && s0[0].typename === "RasterItem") { img = s0[0]; }
            }
            var capa = img.layer;
            var conAlfa = false;
            try { conAlfa = img.transparent === true; } catch (e6) {}

            // a) Lo que no es blanco.
            copia = img.duplicate(capa, ElementPlacement.PLACEATBEGINNING);
            forma = calcarYExpandir(copia);
            copia = null; // el calco la ha consumido

            // b) Con transparencia: también lo que sí es blanco (copia invertida).
            if (conAlfa) {
                copiaInv = img.duplicate(capa, ElementPlacement.PLACEATBEGINNING);
                doc.selection = null; copiaInv.selected = true;
                app.executeMenuCommand("Colors6");   // Edición > Editar colores > Invertir colores
                var s1 = doc.selection;
                if (s1.length && s1[0].typename === "RasterItem") { copiaInv = s1[0]; }
                formaInv = calcarYExpandir(copiaInv);
                copiaInv = null;
                forma = unir(forma, formaInv);
                formaInv = null;
            }

            forma.name = "Silueta";
            pintar(forma, negro());
            resultados.push(forma);
        } catch (e) {
            errores.push("Imagen " + (i + 1) + ": " + e.message);
            if (forma) { try { forma.remove(); } catch (e7) {} }
            if (formaInv) { try { formaInv.remove(); } catch (e8) {} }
            if (copia) { try { copia.remove(); } catch (e9) {} }
            if (copiaInv) { try { copiaInv.remove(); } catch (e10) {} }
        }
    }

    doc.selection = null;
    for (i = 0; i < resultados.length; i++) { try { resultados[i].selected = true; } catch (e11) {} }
    app.redraw();

    if (errores.length) {
        alert("Vectorizadas: " + resultados.length + "\nCon error: " + errores.length + "\n\n" + errores.join("\n"));
    }
})();
