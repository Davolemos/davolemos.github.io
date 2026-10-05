#target illustrator

// ------------------------------------------------------------
// Corregir_Texto.jsx
// Reemplaza una palabra/frase por otra (con opción de variantes
// de mayúsculas/minúsculas) en todos los textos, ya sea:
//   - del documento actualmente abierto en Illustrator, o
//   - de TODOS los archivos .ai / .eps de una carpeta que elijas
// ------------------------------------------------------------

// Muestra un diálogo para pedir el texto a buscar, el texto de reemplazo,
// si se debe aplicar a variantes de mayúsculas/minúsculas, si se debe
// trabajar sobre el documento activo o en lote sobre una carpeta,
// y si se deben guardar copias en otra carpeta.
// Devuelve un objeto con los datos elegidos, o null si el usuario cancela.
function pedirDatos() {

    var dlg = new Window("dialog", "Buscar y reemplazar texto");
    dlg.orientation = "column";
    dlg.alignChildren = "left";
    dlg.margins = 18;
    dlg.spacing = 10;

    // --- Modo: documento activo o lote ---
    dlg.add("statictext", undefined, "¿Dónde quieres aplicar el cambio?");
    var grupoModo = dlg.add("group");
    grupoModo.orientation = "row";
    var radioActivo = grupoModo.add("radiobutton", undefined, "Documento activo");
    var radioLote = grupoModo.add("radiobutton", undefined, "Lote (carpeta completa)");
    radioActivo.value = true;

    // --- Opción de incluir subcarpetas (solo aplica en modo lote) ---
    var checkSubcarpetas = dlg.add("checkbox", undefined, "Incluir archivos en subcarpetas");
    checkSubcarpetas.value = false;

    // --- Separador ---
    dlg.add("panel", undefined, "").preferredSize.height = 1;

    // --- Texto a buscar ---
    dlg.add("statictext", undefined, "Texto a buscar:");
    var campoBuscar = dlg.add("edittext", undefined, "");
    campoBuscar.characters = 35;

    // --- Texto de reemplazo ---
    dlg.add("statictext", undefined, "Reemplazar por:");
    var campoReemplazar = dlg.add("edittext", undefined, "");
    campoReemplazar.characters = 35;

    // --- Opción de variantes de mayúsculas ---
    var checkVariantes = dlg.add("checkbox", undefined, "Aplicar también a variantes en MAYÚSCULAS / minúsculas / Capitalizado");
    checkVariantes.value = true;

    // --- Separador ---
    dlg.add("panel", undefined, "").preferredSize.height = 1;

    // --- Opción de guardar como copia ---
    var checkCopia = dlg.add("checkbox", undefined, "Guardar copia(s) en otra carpeta (en vez de sobrescribir los originales)");
    checkCopia.value = false;

    function actualizarEstadoSubcarpetas() {
        checkSubcarpetas.enabled = radioLote.value;
    }
    radioActivo.onClick = actualizarEstadoSubcarpetas;
    radioLote.onClick = actualizarEstadoSubcarpetas;
    actualizarEstadoSubcarpetas();

    // --- Botones ---
    var grupoBotones = dlg.add("group");
    grupoBotones.alignment = "right";
    var btnCancelar = grupoBotones.add("button", undefined, "Cancelar", { name: "cancel" });
    var btnAceptar = grupoBotones.add("button", undefined, "Aceptar", { name: "ok" });

    var resultado = null;

    btnAceptar.onClick = function () {
        var buscar = campoBuscar.text;
        var reemplazar = campoReemplazar.text;

        if (buscar === "") {
            alert("Por favor escribe el texto que quieres buscar.");
            return;
        }

        resultado = {
            buscar: buscar,
            reemplazar: reemplazar,
            variantes: checkVariantes.value,
            guardarComoCopia: checkCopia.value,
            incluirSubcarpetas: checkSubcarpetas.value,
            modo: radioActivo.value ? "activo" : "lote"
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

// Genera pares [buscar, reemplazar] a partir de una sola palabra/frase base,
// incluyendo variantes en mayúsculas, minúsculas y capitalizado si se pidió.
function generarReemplazos(buscar, reemplazar, incluirVariantes) {

    var pares = [];
    pares.push([buscar, reemplazar]);

    if (!incluirVariantes) {
        return pares;
    }

    function capitalizar(s) {
        if (s.length === 0) return s;
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    }

    var variantesBuscar = [
        buscar.toLowerCase(),
        buscar.toUpperCase(),
        capitalizar(buscar)
    ];
    var variantesReemplazar = [
        reemplazar.toLowerCase(),
        reemplazar.toUpperCase(),
        capitalizar(reemplazar)
    ];

    for (var i = 0; i < variantesBuscar.length; i++) {
        // Evitar duplicar el par exacto ya agregado, y evitar pares vacíos duplicados
        var yaExiste = false;
        for (var j = 0; j < pares.length; j++) {
            if (pares[j][0] === variantesBuscar[i]) {
                yaExiste = true;
                break;
            }
        }
        if (!yaExiste) {
            pares.push([variantesBuscar[i], variantesReemplazar[i]]);
        }
    }

    return pares;
}

// Devuelve un array con todos los archivos .ai / .eps dentro de una carpeta.
// Si incluirSubcarpetas es true, recorre también todas las subcarpetas.
function obtenerArchivos(folder, incluirSubcarpetas, resultado) {

    if (resultado === undefined) resultado = [];

    var items = folder.getFiles();

    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        if (item instanceof File) {
            var name = item.name.toLowerCase();
            if (name.indexOf(".ai") !== -1 || name.indexOf(".eps") !== -1) {
                resultado.push(item);
            }
        } else if (item instanceof Folder && incluirSubcarpetas) {
            obtenerArchivos(item, incluirSubcarpetas, resultado);
        }
    }

    return resultado;
}

// Aplica los reemplazos a todos los text frames de un documento.
// Devuelve la cantidad de bloques de texto modificados.
function aplicarReemplazosADocumento(doc, replacements) {
    var count = 0;
    var frames = doc.textFrames;

    for (var i = 0; i < frames.length; i++) {
        var tf = frames[i];
        var original = tf.contents;
        var updated = original;

        for (var r = 0; r < replacements.length; r++) {
            updated = replaceAll(updated, replacements[r][0], replacements[r][1]);
        }

        if (updated !== original) {
            tf.contents = updated;
            count++;
        }
    }

    return count;
}

// --------------------------------------------------------
// Modo: solo el documento activo
// --------------------------------------------------------
function procesarDocumentoActivo(datos, replacements) {

    if (app.documents.length === 0) {
        alert("No hay ningún documento abierto en Illustrator.");
        return;
    }

    var doc = app.activeDocument;
    var count = aplicarReemplazosADocumento(doc, replacements);

    if (count === 0) {
        alert('No se encontró "' + datos.buscar + '" en el documento activo. No se hicieron cambios.');
        return;
    }

    try {
        if (datos.guardarComoCopia) {
            var outputFolder = Folder.selectDialog("Selecciona la carpeta donde guardar la copia corregida");
            if (outputFolder === null) {
                alert("No se guardó ningún archivo (se canceló la selección de carpeta), pero los cambios quedaron aplicados en memoria.");
                return;
            }
            var nombreOriginal = doc.name;
            var destFile = new File(outputFolder.fsName + "/" + nombreOriginal);

            if (nombreOriginal.toLowerCase().indexOf(".eps") !== -1) {
                doc.saveAs(destFile, new EPSSaveOptions());
            } else {
                doc.saveAs(destFile);
            }
        } else {
            doc.save();
        }
    } catch (e) {
        alert("No se pudo guardar el documento: " + e.message);
        return;
    }

    alert("Proceso terminado.\nBloques de texto corregidos: " + count);
}

// --------------------------------------------------------
// Modo: lote sobre una carpeta completa
// --------------------------------------------------------
function procesarLote(datos, replacements) {

    var inputFolder = Folder.selectDialog("Selecciona la carpeta con los archivos a corregir");
    if (inputFolder === null) return;

    var SAVE_AS_COPY = datos.guardarComoCopia;
    var outputFolder = null;

    if (SAVE_AS_COPY) {
        outputFolder = Folder.selectDialog("Selecciona la carpeta donde guardar las copias corregidas");
        if (outputFolder === null) return;
    }

    var files = obtenerArchivos(inputFolder, datos.incluirSubcarpetas);

    if (files.length === 0) {
        var msgVacio = datos.incluirSubcarpetas ?
            "No se encontraron archivos .ai o .eps en esa carpeta ni en sus subcarpetas." :
            "No se encontraron archivos .ai o .eps en esa carpeta.";
        alert(msgVacio);
        return;
    }

    var totalArchivosCorregidos = 0;
    var totalBloques = 0;
    var errores = [];

    for (var f = 0; f < files.length; f++) {
        var file = files[f];
        var doc = null;

        try {
            doc = app.open(file);
        } catch (e) {
            errores.push(file.name + " (no se pudo abrir: " + e.message + ")");
            continue;
        }

        var count = aplicarReemplazosADocumento(doc, replacements);

        if (count > 0) {
            totalArchivosCorregidos++;
            totalBloques += count;

            try {
                if (SAVE_AS_COPY) {
                    var rutaRelativa = file.fsName.substring(inputFolder.fsName.length);
                    var destFile = new File(outputFolder.fsName + rutaRelativa);
                    if (!destFile.parent.exists) {
                        destFile.parent.create();
                    }
                    if (file.name.toLowerCase().indexOf(".eps") !== -1) {
                        doc.saveAs(destFile, new EPSSaveOptions());
                    } else {
                        doc.saveAs(destFile);
                    }
                } else {
                    doc.save();
                }
            } catch (e) {
                errores.push(file.name + " (no se pudo guardar: " + e.message + ")");
            }
        }

        doc.close(SaveOptions.DONOTSAVECHANGES);
    }

    var msg = "Proceso terminado.\n";
    msg += "Archivos revisados: " + files.length + "\n";
    msg += "Archivos corregidos: " + totalArchivosCorregidos + "\n";
    msg += "Bloques de texto corregidos: " + totalBloques;

    if (errores.length > 0) {
        msg += "\n\nErrores:\n" + errores.join("\n");
    }

    alert(msg);
}

function main() {

    var datos = pedirDatos();
    if (datos === null) return;

    var replacements = generarReemplazos(datos.buscar, datos.reemplazar, datos.variantes);

    if (datos.modo === "activo") {
        procesarDocumentoActivo(datos, replacements);
    } else {
        procesarLote(datos, replacements);
    }
}

function replaceAll(str, find, replace) {
    return str.split(find).join(replace);
}

main();
