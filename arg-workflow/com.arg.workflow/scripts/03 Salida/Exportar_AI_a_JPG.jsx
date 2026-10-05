// ============================================================
// Exportar_AI_a_JPG.jsx
// Abre todos los archivos .AI de una carpeta seleccionada,
// los exporta como .JPG al DPI y calidad (Baja/Media/Alta)
// elegidos por el usuario, y guarda los JPG en una subcarpeta
// dentro de la carpeta madre.
// ============================================================

// Muestra un diálogo para que el usuario elija el DPI y la calidad de exportación.
// Devuelve un objeto { dpi: Number, calidad: Number, calidadNombre: String },
// o null si el usuario cancela.
function pedirDPI() {

    var valorPorDefecto = 150;

    // Valores de qualitySetting de Illustrator van de 0 (mínima) a 100 (máxima)
    var CALIDAD_BAJA = 30;
    var CALIDAD_MEDIA = 70;
    var CALIDAD_ALTA = 100;

    var dlg = new Window("dialog", "Opciones de exportación JPG");
    dlg.orientation = "column";
    dlg.alignChildren = "left";
    dlg.margins = 18;
    dlg.spacing = 12;

    // --- Sección DPI ---
    var grupoTexto = dlg.add("group");
    grupoTexto.add("statictext", undefined, "Ingresa la resolución (DPI), entre 72 y 300:");

    var grupoInput = dlg.add("group");
    grupoInput.add("statictext", undefined, "DPI:");
    var campoDPI = grupoInput.add("edittext", undefined, String(valorPorDefecto));
    campoDPI.characters = 6;

    var grupoPresets = dlg.add("group");
    grupoPresets.add("statictext", undefined, "Rápido:");
    var btn72 = grupoPresets.add("button", undefined, "72");
    var btn150 = grupoPresets.add("button", undefined, "150");
    var btn200 = grupoPresets.add("button", undefined, "200");
    var btn300 = grupoPresets.add("button", undefined, "300");

    btn72.onClick = function () { campoDPI.text = "72"; };
    btn150.onClick = function () { campoDPI.text = "150"; };
    btn200.onClick = function () { campoDPI.text = "200"; };
    btn300.onClick = function () { campoDPI.text = "300"; };

    // --- Separador ---
    dlg.add("panel", undefined, "").preferredSize.height = 1;

    // --- Sección Calidad ---
    dlg.add("statictext", undefined, "Calidad de compresión JPG:");

    var grupoCalidad = dlg.add("group");
    grupoCalidad.orientation = "row";
    var radioBaja = grupoCalidad.add("radiobutton", undefined, "Baja");
    var radioMedia = grupoCalidad.add("radiobutton", undefined, "Media");
    var radioAlta = grupoCalidad.add("radiobutton", undefined, "Alta");
    radioAlta.value = true; // Alta por defecto

    // --- Separador ---
    dlg.add("panel", undefined, "").preferredSize.height = 1;

    // --- Opción de incluir subcarpetas ---
    var checkSubcarpetas = dlg.add("checkbox", undefined, "Incluir archivos en subcarpetas");
    checkSubcarpetas.value = false;

    // --- Botones ---
    var grupoBotones = dlg.add("group");
    grupoBotones.alignment = "right";
    var btnCancelar = grupoBotones.add("button", undefined, "Cancelar", { name: "cancel" });
    var btnAceptar = grupoBotones.add("button", undefined, "Aceptar", { name: "ok" });

    var resultado = null;

    btnAceptar.onClick = function () {
        var valor = parseFloat(campoDPI.text);

        if (isNaN(valor)) {
            alert("Por favor ingresa un número válido de DPI.");
            return;
        }
        if (valor < 72 || valor > 300) {
            alert("El DPI debe estar entre 72 y 300.");
            return;
        }

        var calidadValor, calidadNombre;
        if (radioBaja.value) {
            calidadValor = CALIDAD_BAJA;
            calidadNombre = "Baja";
        } else if (radioMedia.value) {
            calidadValor = CALIDAD_MEDIA;
            calidadNombre = "Media";
        } else {
            calidadValor = CALIDAD_ALTA;
            calidadNombre = "Alta";
        }

        resultado = {
            dpi: valor,
            calidad: calidadValor,
            calidadNombre: calidadNombre,
            incluirSubcarpetas: checkSubcarpetas.value
        };
        dlg.close();
    };

    btnCancelar.onClick = function () {
        resultado = null;
        dlg.close();
    };

    dlg.show();

    return resultado;
}

// Devuelve un array con todos los archivos .ai dentro de una carpeta.
// Si incluirSubcarpetas es true, recorre también todas las subcarpetas.
function obtenerArchivosAI(folder, incluirSubcarpetas, resultado) {

    if (resultado === undefined) resultado = [];

    var items = folder.getFiles();

    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        if (item instanceof File) {
            if (/\.ai$/i.test(item.name)) {
                resultado.push(item);
            }
        } else if (item instanceof Folder && incluirSubcarpetas) {
            obtenerArchivosAI(item, incluirSubcarpetas, resultado);
        }
    }

    return resultado;
}

(function () {

    // 1. Pedir al usuario que elija el DPI y la calidad de exportación
    var opciones = pedirDPI();
    if (opciones === null) {
        return; // el usuario canceló el diálogo
    }

    var dpiElegido = opciones.dpi;
    var calidadValor = opciones.calidad;
    var calidadNombre = opciones.calidadNombre;

    // 2. Pedir al usuario que seleccione la carpeta madre
    var carpetaMadre = Folder.selectDialog("Selecciona la carpeta que contiene los archivos .AI");
    if (carpetaMadre === null) {
        alert("No se seleccionó ninguna carpeta. Proceso cancelado.");
        return;
    }

    // 3. Crear (o reutilizar) la subcarpeta "JPG_[dpi]dpi_[calidad]" dentro de la carpeta madre
    var carpetaSalida = new Folder(carpetaMadre.fsName + "/JPG_" + dpiElegido + "dpi_" + calidadNombre);
    if (!carpetaSalida.exists) {
        carpetaSalida.create();
    }

    // 3. Obtener todos los archivos .ai de la carpeta madre (y subcarpetas si se pidió)
    var archivosAI = obtenerArchivosAI(carpetaMadre, opciones.incluirSubcarpetas);

    if (archivosAI.length === 0) {
        var msgVacio = opciones.incluirSubcarpetas ?
            "No se encontraron archivos .AI en la carpeta seleccionada ni en sus subcarpetas." :
            "No se encontraron archivos .AI en la carpeta seleccionada.";
        alert(msgVacio);
        return;
    }

    var exportados = 0;
    var errores = [];

    // 4. Recorrer cada archivo .ai
    for (var i = 0; i < archivosAI.length; i++) {

        var archivo = archivosAI[i];

        try {
            // Abrir el documento
            var doc = app.open(archivo);

            // Nombre de salida (mismo nombre, extensión .jpg), respetando la subcarpeta de origen
            var nombreBase = archivo.name.replace(/\.ai$/i, "");
            var rutaRelativa = archivo.path.substring(carpetaMadre.fsName.length);
            var carpetaDestino = new Folder(carpetaSalida.fsName + rutaRelativa);
            if (!carpetaDestino.exists) {
                carpetaDestino.create();
            }
            var archivoSalida = new File(carpetaDestino.fsName + "/" + nombreBase + ".jpg");

            // Opciones de exportación JPG
            var opcionesJPG = new ExportOptionsJPEG();
            opcionesJPG.qualitySetting = calidadValor; // Calidad elegida (Baja/Media/Alta)
            opcionesJPG.horizontalScale = 100;      // Escala 100%
            opcionesJPG.verticalScale = 100;
            opcionesJPG.antiAliasing = true;
            opcionesJPG.artBoardClipping = true;    // Recorta a la mesa de trabajo
            opcionesJPG.saveMultipleArtboards = false;

            // Escala respecto a 72 dpi (resolución base de Illustrator)
            var factorEscala = (dpiElegido / 72) * 100;
            opcionesJPG.horizontalScale = factorEscala;
            opcionesJPG.verticalScale = factorEscala;

            // Exportar
            doc.exportFile(archivoSalida, ExportType.JPEG, opcionesJPG);

            exportados++;

            // Cerrar sin guardar cambios en el .ai original
            doc.close(SaveOptions.DONOTSAVECHANGES);

        } catch (e) {
            errores.push(archivo.name + ": " + e.message);
        }
    }

    // 5. Resumen final
    var mensaje = "Proceso terminado.\n";
    mensaje += "Archivos exportados: " + exportados + " de " + archivosAI.length + "\n";
    mensaje += "Resolución: " + dpiElegido + " dpi | Calidad: " + calidadNombre + "\n";
    mensaje += "Carpeta de salida: " + carpetaSalida.fsName;

    if (errores.length > 0) {
        mensaje += "\n\nErrores:\n" + errores.join("\n");
    }

    alert(mensaje);

})();
