// Vectorizar silueta — ARG Workflow
// Convierte la forma de una imagen (PNG con transparencia, o JPG sobre fondo
// blanco) en un vector relleno de negro, en un clic. Equivale a: Editar colores
// > negro al 100%  →  Calco de imagen (Siluetas)  →  Expandir.
//
// Cómo decide qué es "forma":
//   · PNG con transparencia: TODO lo que no sea transparente es forma, sea del
//     color que sea (también el blanco). Se compone la imagen sobre negro, se
//     invierte, y encima se pone la original al 50 %: el fondo queda blanco y
//     la figura en gris medio en cualquier tono. Un solo calco, sin uniones.
//   · Imagen sin transparencia: todo lo que no sea blanco puro es forma.
// La imagen original no se toca; el vector queda encima, en un grupo "Silueta",
// relleno K100 (o RGB 0,0,0 si el documento es RGB), sin trazo y seleccionado.
// Acepta varias imágenes, aunque estén dentro de grupos o máscaras (p. ej.
// pegadas desde Photoshop).
#target illustrator

(function () {
    if (app.documents.length === 0) { alert("Abre un documento primero."); return; }
    var doc = app.activeDocument;

    // ── Ajustes ──
    var UMBRAL = 254;        // píxeles más claros que esto se consideran fondo
    var RESOLUCION = 600;    // ppp de la copia de trabajo (precisión del borde)
    var SUAVIDAD = 60;       // 0-100: trazado. Menos = curvas más suaves y menos puntos
    var ESQUINAS = 20;       // 0-100: menos = menos esquinas, contorno más redondeado
    var RUIDO = 50;          // px: ignora manchas y muescas más pequeñas que esto

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
    function margen(item) {
        var b = item.geometricBounds;
        return [b[0] - 1, b[1] + 1, b[2] + 1, b[3] - 1];
    }
    // doc.rasterize necesita un rectángulo de recorte, y según la versión lo
    // interpreta en coordenadas de documento o de mesa de trabajo. Si el
    // resultado no cae encima del original, se repite con el otro sistema.
    function rasterizar(item, opts) {
        var sistemas = [CoordinateSystem.DOCUMENTCOORDINATESYSTEM, CoordinateSystem.ARTBOARDCOORDINATESYSTEM];
        var anterior = app.coordinateSystem, res = null, k;
        try {
            for (k = 0; k < sistemas.length; k++) {
                app.coordinateSystem = sistemas[k];
                var dup = item.duplicate(item, ElementPlacement.PLACEBEFORE);
                var antes = dup.geometricBounds;
                var r = doc.rasterize(dup, margen(dup), opts);
                var despues = r.geometricBounds;
                if (Math.abs(despues[0] - antes[0]) < 3 && Math.abs(despues[1] - antes[1]) < 3) {
                    res = r; break;
                }
                try { r.remove(); } catch (e1) {}
                try { dup.remove(); } catch (e2) {}
            }
        } finally {
            app.coordinateSystem = anterior;
        }
        try { item.remove(); } catch (e3) {}
        if (!res) { throw new Error("No se pudo rasterizar la imagen en su sitio."); }
        return res;
    }
    // ¿La forma es (casi) el rectángulo completo? Señal de que el fondo salió negro.
    function esRectangulo(grupo) {
        var b, area = 0;
        try { b = grupo.geometricBounds; } catch (e) { return false; }
        var caja = Math.abs((b[2] - b[0]) * (b[1] - b[3]));
        if (!caja) { return false; }
        function suma(item) {
            var j;
            if (item.typename === "PathItem") { area += item.area; }
            else if (item.typename === "CompoundPathItem") { for (j = 0; j < item.pathItems.length; j++) { suma(item.pathItems[j]); } }
            else if (item.typename === "GroupItem") { for (j = 0; j < item.pageItems.length; j++) { suma(item.pageItems[j]); } }
        }
        suma(grupo);
        return Math.abs(area) > caja * 0.97;
    }
    // Calco blanco y negro suavizado + expansión. Devuelve el grupo expandido.
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
        try { op.pathFidelity = SUAVIDAD; } catch (e2) {}
        try { op.cornerFidelity = ESQUINAS; } catch (e3) {}
        try { op.noiseFidelity = RUIDO; } catch (e4) {}
        app.redraw();
        return calco.tracing.expandTracing();
    }

    // ── 2. Procesar cada imagen ──
    var resultados = [], errores = [];
    for (i = 0; i < imagenes.length; i++) {
        var img = imagenes[i], temporales = [], forma = null;
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

            var fuente;
            if (conAlfa) {
                // a) Imagen sobre fondo negro (transparente -> negro) e invertida:
                //    fondo blanco, figura con los colores invertidos.
                var copiaB = img.duplicate(capa, ElementPlacement.PLACEATBEGINNING);
                var ro = new RasterizeOptions();
                ro.transparency = false;
                ro.backgroundBlack = true;
                ro.resolution = RESOLUCION;
                ro.antiAliasingMethod = AntiAliasingMethod.ARTOPTIMIZED;
                var inv = rasterizar(copiaB, ro);
                temporales.push(inv);
                doc.selection = null; inv.selected = true;
                app.executeMenuCommand("Colors6");   // Editar colores > Invertir colores
                var s1 = doc.selection;
                if (s1.length && s1[0].typename === "RasterItem") { inv = s1[0]; }

                // b) Encima, la imagen original al 50 % de opacidad (fusión normal):
                //    cada píxel de la figura queda en (v + (255 - v)) / 2 = gris medio,
                //    sea v blanco, negro o cualquier color; el fondo transparente sigue blanco.
                var copiaC = img.duplicate(capa, ElementPlacement.PLACEATBEGINNING);
                copiaC.blendingMode = BlendModes.NORMAL;
                copiaC.opacity = 50;
                var g = capa.groupItems.add();
                temporales.push(g);
                inv.move(g, ElementPlacement.PLACEATEND);
                copiaC.move(g, ElementPlacement.PLACEATBEGINNING);

                // c) Aplanar el conjunto sobre blanco en un único raster.
                var ro2 = new RasterizeOptions();
                ro2.transparency = false;
                ro2.backgroundBlack = false;
                ro2.resolution = RESOLUCION;
                ro2.antiAliasingMethod = AntiAliasingMethod.ARTOPTIMIZED;
                fuente = rasterizar(g, ro2);
                temporales.push(fuente);
            } else {
                // Sin transparencia: lo que no es blanco es forma.
                fuente = img.duplicate(capa, ElementPlacement.PLACEATBEGINNING);
                temporales.push(fuente);
            }

            forma = calcar(fuente);
            if (conAlfa && esRectangulo(forma)) {
                // El método por transparencia devolvió el rectángulo entero:
                // se descarta y se usa el umbral directo sobre la imagen.
                try { forma.remove(); } catch (e10) {}
                var copiaA = img.duplicate(capa, ElementPlacement.PLACEATBEGINNING);
                temporales.push(copiaA);
                forma = calcar(copiaA);
            }
            forma.name = "Silueta";
            pintar(forma, negro());
            resultados.push(forma);
        } catch (e) {
            errores.push("Imagen " + (i + 1) + ": " + e.message);
            if (forma) { try { forma.remove(); } catch (e7) {} }
        }
        // Retirar copias de trabajo que sigan existiendo (el calco consume la suya).
        for (var t = temporales.length - 1; t >= 0; t--) { try { temporales[t].remove(); } catch (e8) {} }
    }

    doc.selection = null;
    for (i = 0; i < resultados.length; i++) { try { resultados[i].selected = true; } catch (e9) {} }
    app.redraw();

    if (errores.length) {
        alert("Vectorizadas: " + resultados.length + "\nCon error: " + errores.length + "\n\n" + errores.join("\n"));
    }
})();
