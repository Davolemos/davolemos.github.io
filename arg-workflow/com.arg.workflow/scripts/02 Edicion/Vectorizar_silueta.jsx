// Vectorizar silueta — ARG Workflow
// Reproduce en un clic el proceso manual:
//   1. Edición > Editar colores > Ajustar equilibrio de colores:
//      Escala de grises, Convertir, Negro 100 %  (toda la figura pasa a negro,
//      la transparencia se conserva)
//   2. Objeto > Calco de imagen > ajuste "Siluetas"
//   3. Expandir
// y deja el vector relleno de negro K100, sin trazo, en un grupo "Silueta",
// seleccionado. La imagen original no se toca; el vector queda encima.
//
// El paso 1 no se puede rellenar por script (Illustrator solo permite abrir el
// cuadro), así que se hace de forma automática por otro camino con el mismo
// resultado: se compone la imagen sobre negro, se invierte y se le superpone la
// original al 50 %; cualquier píxel opaco queda oscuro y el fondo blanco. Si por
// lo que sea ese camino fallara (la forma sale como un rectángulo), el script
// abre el cuadro "Ajustar equilibrio de colores" para que lo rellenes tú y
// continúa solo con el calco y el expandir.
// Acepta varias imágenes, aunque estén dentro de grupos o máscaras (pegadas
// desde Photoshop).
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
    function margen(item) {
        var b = item.geometricBounds;
        return [b[0] - 1, b[1] + 1, b[2] + 1, b[3] - 1];
    }
    // doc.rasterize exige un rectángulo de recorte y, según la versión, lo lee en
    // coordenadas de documento o de mesa de trabajo. Se comprueba que el resultado
    // cae encima del original; si no, se repite con el otro sistema.
    function rasterizar(item, opts) {
        var sistemas = [CoordinateSystem.DOCUMENTCOORDINATESYSTEM, CoordinateSystem.ARTBOARDCOORDINATESYSTEM];
        var anterior = app.coordinateSystem, res = null, k;
        try {
            for (k = 0; k < sistemas.length && !res; k++) {
                app.coordinateSystem = sistemas[k];
                var dup = item.duplicate(item, ElementPlacement.PLACEBEFORE);
                var antes = dup.geometricBounds;
                var r = doc.rasterize(dup, margen(dup), opts);
                var despues = r.geometricBounds;
                if (Math.abs(despues[0] - antes[0]) < 3 && Math.abs(despues[1] - antes[1]) < 3) { res = r; }
                else { try { r.remove(); } catch (e1) {} try { dup.remove(); } catch (e2) {} }
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
    // Paso 2 y 3: Calco de imagen "Siluetas" + Expandir. Devuelve el grupo expandido.
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

    // Paso 1 (automático): figura oscura en cualquier tono, fondo blanco.
    function ennegrecerAutomatico(img, capa, temporales) {
        var copiaB = img.duplicate(capa, ElementPlacement.PLACEATBEGINNING);
        var ro = new RasterizeOptions();
        ro.transparency = false;
        ro.backgroundBlack = true;                 // transparente -> negro
        ro.resolution = RESOLUCION;
        ro.antiAliasingMethod = AntiAliasingMethod.ARTOPTIMIZED;
        var inv = rasterizar(copiaB, ro);
        temporales.push(inv);
        doc.selection = null; inv.selected = true;
        app.executeMenuCommand("Colors6");         // Editar colores > Invertir colores
        var s1 = doc.selection;
        if (s1.length && s1[0].typename === "RasterItem") { inv = s1[0]; }

        var copiaC = img.duplicate(capa, ElementPlacement.PLACEATBEGINNING);
        copiaC.blendingMode = BlendModes.NORMAL;
        copiaC.opacity = 50;                       // (v + (255 - v)) / 2 = gris medio
        var g = capa.groupItems.add();
        temporales.push(g);
        inv.move(g, ElementPlacement.PLACEATEND);
        copiaC.move(g, ElementPlacement.PLACEATBEGINNING);

        var ro2 = new RasterizeOptions();
        ro2.transparency = false;
        ro2.backgroundBlack = false;
        ro2.resolution = RESOLUCION;
        ro2.antiAliasingMethod = AntiAliasingMethod.ARTOPTIMIZED;
        var plano = rasterizar(g, ro2);
        temporales.push(plano);
        return plano;
    }

    // Paso 1 (manual, de respaldo): abre "Ajustar equilibrio de colores" sobre
    // una copia y espera a que pulses OK.
    function ennegrecerConDialogo(img, capa, temporales) {
        var copiaD = img.duplicate(capa, ElementPlacement.PLACEATBEGINNING);
        temporales.push(copiaD);
        doc.selection = null; copiaD.selected = true;
        alert("Se abrirá 'Ajustar equilibrio de colores'.\n\n" +
              "Pon  Modo de color: Escala de grises,  marca  Convertir,  Negro: 100 %  y pulsa OK.\n" +
              "El script seguirá solo con el calco y el expandir.");
        app.executeMenuCommand("Adjust3");         // Edición > Editar colores > Ajustar equilibrio de colores...
        var s = doc.selection;
        if (s.length && s[0].typename === "RasterItem") { copiaD = s[0]; }
        return copiaD;
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

            if (conAlfa) {
                var fuente = null;
                try { fuente = ennegrecerAutomatico(img, capa, temporales); } catch (e7) { fuente = null; }
                if (fuente) {
                    forma = calcarYExpandir(fuente);
                    if (esRectangulo(forma)) { try { forma.remove(); } catch (e8) {} forma = null; }
                }
                if (!forma) {
                    forma = calcarYExpandir(ennegrecerConDialogo(img, capa, temporales));
                }
            } else {
                // Sin transparencia: lo que no es blanco es forma.
                var copiaA = img.duplicate(capa, ElementPlacement.PLACEATBEGINNING);
                temporales.push(copiaA);
                forma = calcarYExpandir(copiaA);
            }

            forma.name = "Silueta";
            pintar(forma, negro());
            resultados.push(forma);
        } catch (e) {
            errores.push("Imagen " + (i + 1) + ": " + e.message);
            if (forma) { try { forma.remove(); } catch (e9) {} }
        }
        // Retirar copias de trabajo que sigan existiendo (el calco consume la suya).
        for (var t = temporales.length - 1; t >= 0; t--) { try { temporales[t].remove(); } catch (e10) {} }
    }

    doc.selection = null;
    for (i = 0; i < resultados.length; i++) { try { resultados[i].selected = true; } catch (e11) {} }
    app.redraw();

    if (errores.length) {
        alert("Vectorizadas: " + resultados.length + "\nCon error: " + errores.length + "\n\n" + errores.join("\n"));
    }
})();
