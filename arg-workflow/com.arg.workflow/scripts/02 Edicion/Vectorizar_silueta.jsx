// Vectorizar silueta — ARG Workflow
// Con una imagen seleccionada (PNG, JPG... colocada o incrustada):
//   1. Calco de imagen en modo blanco y negro con umbral alto: todo lo que no
//      sea blanco o transparente pasa a negro (equivale a "negro al 100%").
//   2. Expande el calco para que la forma sea un vector editable.
//   3. Deja la forma rellena de negro K100 (o RGB 0,0,0 si el documento es RGB),
//      sin trazo, agrupada como "Silueta" y seleccionada.
// Funciona con varias imágenes seleccionadas a la vez.
#target illustrator

(function () {
    if (app.documents.length === 0) { alert("Abre un documento primero."); return; }
    var doc = app.activeDocument;
    var sel = doc.selection, i;
    var imagenes = [];
    for (i = 0; i < sel.length; i++) {
        if (sel[i].typename === "PlacedItem" || sel[i].typename === "RasterItem") { imagenes.push(sel[i]); }
    }
    if (!imagenes.length) {
        alert("Selecciona una imagen (PNG, JPG...) y vuelve a pulsar el botón.");
        return;
    }

    // Ajuste de umbral: 254 = cualquier píxel que no sea blanco puro se vuelve negro.
    var UMBRAL = 254;

    // Preset "Siluetas" de Illustrator si existe (el nombre depende del idioma).
    var preset = null;
    try {
        var lista = app.tracingPresetsList;
        for (i = 0; i < lista.length; i++) {
            if (/silhou|silueta/i.test(lista[i])) { preset = lista[i]; break; }
        }
    } catch (e) {}

    function negro() {
        if (doc.documentColorSpace === DocumentColorSpace.RGB) {
            var r = new RGBColor(); r.red = 0; r.green = 0; r.blue = 0; return r;
        }
        var k = new CMYKColor(); k.cyan = 0; k.magenta = 0; k.yellow = 0; k.black = 100; return k;
    }
    function pintar(item, color) {
        var j;
        if (item.typename === "PathItem") {
            item.filled = true; item.fillColor = color; item.stroked = false;
        } else if (item.typename === "CompoundPathItem") {
            for (j = 0; j < item.pathItems.length; j++) { pintar(item.pathItems[j], color); }
        } else if (item.typename === "GroupItem") {
            for (j = 0; j < item.pageItems.length; j++) { pintar(item.pageItems[j], color); }
        }
    }

    var resultados = [], errores = [];
    for (i = 0; i < imagenes.length; i++) {
        var img = imagenes[i];
        try {
            if (img.typename === "PlacedItem") {
                // Las imágenes enlazadas se incrustan para que el calco sea estable.
                img.selected = true;
                try { img.embed(); } catch (e1) {}
                var s = doc.selection;
                if (s.length && s[0].typename === "RasterItem") { img = s[0]; }
            }
            var calco = img.trace();
            var op = calco.tracing.tracingOptions;
            if (preset) { try { op.loadFromPreset(preset); } catch (e2) {} }
            op.tracingMode = TracingModeType.TRACINGMODEBLACKANDWHITE;
            op.threshold = UMBRAL;
            op.fills = true;
            op.strokes = false;
            op.ignoreWhite = true;
            op.snapCurveToLines = false;
            app.redraw();
            var grupo = calco.tracing.expandTracing();
            grupo.name = "Silueta";
            pintar(grupo, negro());
            resultados.push(grupo);
        } catch (e) {
            errores.push("Imagen " + (i + 1) + ": " + e.message);
        }
    }

    doc.selection = null;
    for (i = 0; i < resultados.length; i++) { resultados[i].selected = true; }
    app.redraw();

    if (errores.length) {
        alert("Vectorizadas: " + resultados.length + "\nCon error: " + errores.length + "\n\n" + errores.join("\n"));
    }
})();
