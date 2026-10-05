/*
Artefinalizador V2.1 - Modo Lote
Author: Claude
Description: Script profesional para preparar archivos de Illustrator para producción
- Interfaz de usuario mejorada
- Soporte multilingüe
- Sistema de logging
- Manejo de errores robusto
- Opciones configurables
- NUEVO: Modo lote (procesa una carpeta completa automáticamente)
*/

#target illustrator
#targetengine main

// Configuración de idiomas
var SCRIPT_LOCALE = {
    en: {
        scriptName: "Artwork Finalizer",
        windowTitle: "Artwork Finalizer v2.1",
        processBtn: "Process",
        cancelBtn: "Cancel",
        options: "Options",
        unlockLayers: "Unlock all layers",
        outlineTexts: "Convert texts to outlines",
        embedImages: "Embed all images",
        addSuffix: "Add suffix when saving",
        customSuffix: "Custom suffix:",
        defaultSuffix: "_AF",
        processing: "Processing...",
        success: "Process completed successfully!",
        error: "Error: ",
        noDocument: "No document open. Please open a document and try again.",
        savePath: "Choose save location",
        logTitle: "Process Log",
        step1: "1. Unlocking layers...",
        step2: "2. Converting texts to outlines...",
        step3: "3. Embedding images...",
        step4: "4. Saving document...",
        imageEmbedded: "Embedded image: ",
        textConverted: "Converted text frame to outlines",
        layerUnlocked: "Unlocked layer: ",
        mode: "Mode",
        modeSingle: "Active document",
        modeBatch: "Folder (batch)",
        selectFolder: "Select folder...",
        folderSelected: "Folder: ",
        noFolder: "No folder selected",
        includeSubfolders: "Include subfolders",
        filesFound: " file(s) found",
        noFilesFound: "No .ai files found in the selected folder.",
        processingFile: "Processing file ",
        of: " of ",
        batchComplete: "Batch process completed!",
        filesProcessed: "Files processed successfully: ",
        filesFailed: "Files with errors: ",
        outputFolder: "Output folder: ",
        viewLog: "View Log"
    },
    es: {
        scriptName: "Artefinalizador",
        windowTitle: "Artefinalizador v2.1",
        processBtn: "Procesar",
        cancelBtn: "Cancelar",
        options: "Opciones",
        unlockLayers: "Desbloquear todas las capas",
        outlineTexts: "Convertir textos a trazados",
        embedImages: "Incrustar todas las imágenes",
        addSuffix: "Añadir sufijo al guardar",
        customSuffix: "Sufijo personalizado:",
        defaultSuffix: "_AF",
        processing: "Procesando...",
        success: "¡Proceso completado con éxito!",
        error: "Error: ",
        noDocument: "No hay documentos abiertos. Por favor, abre un documento e inténtalo de nuevo.",
        savePath: "Elegir ubicación para guardar",
        logTitle: "Registro del Proceso",
        step1: "1. Desbloqueando capas...",
        step2: "2. Convirtiendo textos a trazados...",
        step3: "3. Incrustando imágenes...",
        step4: "4. Guardando documento...",
        imageEmbedded: "Imagen incrustada: ",
        textConverted: "Marco de texto convertido a trazados",
        layerUnlocked: "Capa desbloqueada: ",
        mode: "Modo",
        modeSingle: "Documento activo",
        modeBatch: "Carpeta (lote)",
        selectFolder: "Seleccionar carpeta...",
        folderSelected: "Carpeta: ",
        noFolder: "No se ha seleccionado carpeta",
        includeSubfolders: "Incluir subcarpetas",
        filesFound: " archivo(s) encontrado(s)",
        noFilesFound: "No se encontraron archivos .ai en la carpeta seleccionada.",
        processingFile: "Procesando archivo ",
        of: " de ",
        batchComplete: "¡Proceso por lote completado!",
        filesProcessed: "Archivos procesados con éxito: ",
        filesFailed: "Archivos con error: ",
        outputFolder: "Carpeta de salida: ",
        viewLog: "Ver Registro"
    }
};

// Configuración global
var CONFIG = {
    language: app.locale.indexOf("es") >= 0 ? "es" : "en",
    logEnabled: true,
    defaultOptions: {
        unlockLayers: true,
        outlineTexts: true,
        embedImages: true,
        addSuffix: true,
        defaultSuffix: "_AF"
    }
};

// Clase para el registro de operaciones
function Logger() {
    this.logs = [];

    this.log = function(message) {
        if (CONFIG.logEnabled) {
            this.logs.push(new Date().toLocaleTimeString() + ": " + message);
        }
    };

    this.getLog = function() {
        return this.logs.join("\n");
    };

    this.showLog = function() {
        var logWindow = new Window("dialog", getStr("logTitle"));
        var logText = logWindow.add("edittext", undefined, this.getLog(), {multiline: true, readonly: true, scrolling: true});
        logText.preferredSize = [500, 300];
        var closeBtn = logWindow.add("button", undefined, "OK");
        logWindow.show();
    };
}

var logger = new Logger();

// Función auxiliar para obtener strings localizados
function getStr(key) {
    return SCRIPT_LOCALE[CONFIG.language][key] || key;
}

// ---------------------------------------------------------------------
// Funciones de procesamiento (compartidas entre modo único y modo lote)
// ---------------------------------------------------------------------

function unlockAllLayers(doc) {
    for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        if (layer.locked) {
            layer.locked = false;
            logger.log(getStr("layerUnlocked") + layer.name);
        }
    }
}

function outlineAllText(doc) {
    var textFrames = doc.textFrames;
    for (var i = textFrames.length - 1; i >= 0; i--) {
        try {
            textFrames[i].createOutline();
            logger.log(getStr("textConverted"));
        } catch(e) {
            logger.log(getStr("error") + e.message);
        }
    }
}

function embedAllImages(doc) {
    var placedItems = doc.placedItems;

    for (var i = placedItems.length - 1; i >= 0; i--) {
        var item = placedItems[i];
        if (!item.embedded) {
            try {
                embedImage(item);
                logger.log(getStr("imageEmbedded") + item.file.name);
            } catch(e) {
                logger.log(getStr("error") + e.message);
            }
        }
    }
}

function embedImage(item) {
    var matrix = item.matrix;
    var layer = item.layer;
    var zOrderPosition = item.zOrderPosition;

    item.embed();

    // Restaurar propiedades originales
    item.matrix = matrix;
    if (item.layer != layer) {
        item.move(layer, ElementPlacement.PLACEATEND);
    }
    while (item.zOrderPosition > zOrderPosition) {
        item.zOrder(ZOrderMethod.SENDBACKWARD);
    }
}

// Aplica las opciones seleccionadas a un documento ya abierto
function processDocument(doc, options) {
    if (options.unlockLayers.value) {
        unlockAllLayers(doc);
    }
    if (options.outlineTexts.value) {
        outlineAllText(doc);
    }
    if (options.embedImages.value) {
        embedAllImages(doc);
    }
}

// Guarda el documento activo con sufijo, en su misma carpeta (modo único)
function saveWithSuffix(doc, suffix) {
    var filePath = doc.fullName.toString();
    var newFilePath = filePath.substring(0, filePath.lastIndexOf(".")) + suffix + filePath.substring(filePath.lastIndexOf("."));
    var saveOptions = new IllustratorSaveOptions();
    doc.saveAs(new File(newFilePath), saveOptions);
}

// Guarda el documento en una carpeta de salida específica con sufijo (modo lote)
function saveWithSuffixToFolder(doc, suffix, outputFolder, originalName) {
    var dotIndex = originalName.lastIndexOf(".");
    var baseName = dotIndex >= 0 ? originalName.substring(0, dotIndex) : originalName;
    var ext = dotIndex >= 0 ? originalName.substring(dotIndex) : ".ai";
    var newFilePath = outputFolder.fsName + "/" + baseName + suffix + ext;
    var saveOptions = new IllustratorSaveOptions();
    doc.saveAs(new File(newFilePath), saveOptions);
}

// Recolecta archivos .ai (y opcionalmente de subcarpetas) dentro de una carpeta
function collectFiles(folder, includeSubfolders, filesArray) {
    var items = folder.getFiles();
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item instanceof Folder) {
            if (includeSubfolders) {
                collectFiles(item, includeSubfolders, filesArray);
            }
        } else if (item instanceof File) {
            if (/\.ai$/i.test(item.name)) {
                filesArray.push(item);
            }
        }
    }
    return filesArray;
}

// ---------------------------------------------------------------------
// Procesamiento en modo lote
// ---------------------------------------------------------------------

function runBatch(inputFolder, includeSubfolders, options, suffix, win, statusText, progressBar) {
    var files = collectFiles(inputFolder, includeSubfolders, []);

    if (files.length === 0) {
        alert(getStr("noFilesFound"));
        return;
    }

    var outputFolder = new Folder(inputFolder.fsName + "/AF");
    if (!outputFolder.exists) {
        outputFolder.create();
    }

    var successCount = 0;
    var failCount = 0;

    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        statusText.text = getStr("processingFile") + (i + 1) + getStr("of") + files.length + " (" + file.name + ")";
        win.update();

        var doc = null;
        try {
            doc = app.open(file);

            processDocument(doc, options);

            if (options.addSuffix.value) {
                saveWithSuffixToFolder(doc, suffix, outputFolder, file.name);
            } else {
                saveWithSuffixToFolder(doc, "", outputFolder, file.name);
            }

            doc.close(SaveOptions.DONOTSAVECHANGES);
            successCount++;
        } catch(e) {
            logger.log(getStr("error") + file.name + " - " + e.message);
            failCount++;
            if (doc) {
                try {
                    doc.close(SaveOptions.DONOTSAVECHANGES);
                } catch(e2) {}
            }
        }

        progressBar.value = Math.round(((i + 1) / files.length) * 100);
        win.update();
    }

    var msg = getStr("batchComplete") + "\n\n" +
              getStr("filesProcessed") + successCount + "\n" +
              getStr("filesFailed") + failCount + "\n" +
              getStr("outputFolder") + outputFolder.fsName + "\n\n" +
              "¡IMPORTANTE!\nPor favor, revise cuidadosamente los archivos antes de enviarlos a producción.";
    alert(msg);
}

// ---------------------------------------------------------------------
// Interfaz de usuario principal
// ---------------------------------------------------------------------

function createUI() {
    var win = new Window("dialog", getStr("windowTitle"));
    win.orientation = "column";
    win.alignChildren = "fill";

    // Panel de modo
    var modePanel = win.add("panel", undefined, getStr("mode"));
    modePanel.orientation = "row";
    modePanel.alignChildren = "left";
    modePanel.margins = 15;

    var modeSingleRadio = modePanel.add("radiobutton", undefined, getStr("modeSingle"));
    var modeBatchRadio = modePanel.add("radiobutton", undefined, getStr("modeBatch"));
    modeSingleRadio.value = true;

    // Panel de selección de carpeta (solo visible en modo lote)
    var folderPanel = win.add("panel", undefined, getStr("selectFolder"));
    folderPanel.orientation = "column";
    folderPanel.alignChildren = "left";
    folderPanel.margins = 15;
    folderPanel.visible = false;

    var folderBtnGroup = folderPanel.add("group");
    var selectFolderBtn = folderBtnGroup.add("button", undefined, getStr("selectFolder"));
    var folderLabel = folderPanel.add("statictext", undefined, getStr("noFolder"));
    folderLabel.preferredSize.width = 350;

    var includeSubfoldersCheck = folderPanel.add("checkbox", undefined, getStr("includeSubfolders"));
    includeSubfoldersCheck.value = false;

    var selectedFolder = null;

    selectFolderBtn.onClick = function() {
        var folder = Folder.selectDialog(getStr("selectFolder"));
        if (folder) {
            selectedFolder = folder;
            var count = collectFiles(folder, includeSubfoldersCheck.value, []).length;
            folderLabel.text = getStr("folderSelected") + folder.fsName + " (" + count + getStr("filesFound") + ")";
        }
    };

    includeSubfoldersCheck.onClick = function() {
        if (selectedFolder) {
            var count = collectFiles(selectedFolder, includeSubfoldersCheck.value, []).length;
            folderLabel.text = getStr("folderSelected") + selectedFolder.fsName + " (" + count + getStr("filesFound") + ")";
        }
    };

    function updateModeVisibility() {
        folderPanel.visible = modeBatchRadio.value;
        win.layout.layout(true);
    }
    modeSingleRadio.onClick = updateModeVisibility;
    modeBatchRadio.onClick = updateModeVisibility;

    // Panel de opciones
    var optionsPanel = win.add("panel", undefined, getStr("options"));
    optionsPanel.orientation = "column";
    optionsPanel.alignChildren = "left";
    optionsPanel.margins = 15;

    var options = {
        unlockLayers: optionsPanel.add("checkbox", undefined, getStr("unlockLayers")),
        outlineTexts: optionsPanel.add("checkbox", undefined, getStr("outlineTexts")),
        embedImages: optionsPanel.add("checkbox", undefined, getStr("embedImages")),
        addSuffix: optionsPanel.add("checkbox", undefined, getStr("addSuffix"))
    };

    // Grupo para el sufijo personalizado
    var suffixGroup = optionsPanel.add("group");
    suffixGroup.alignment = "left";
    suffixGroup.margins = [20, 5, 0, 0]; // [left, top, right, bottom]

    var suffixLabel = suffixGroup.add("statictext", undefined, getStr("customSuffix"));
    var suffixInput = suffixGroup.add("edittext", undefined, getStr("defaultSuffix"));
    suffixInput.preferredSize.width = 100;

    // Establecer valores por defecto
    for (var key in options) {
        options[key].value = CONFIG.defaultOptions[key];
    }

    // Deshabilitar campo de sufijo si no está marcada la opción
    suffixInput.enabled = options.addSuffix.value;
    options.addSuffix.onClick = function() {
        suffixInput.enabled = options.addSuffix.value;
    };

    // Botones
    var btnGroup = win.add("group");
    btnGroup.alignment = "center";
    var processBtn = btnGroup.add("button", undefined, getStr("processBtn"), {name: "ok"});
    var cancelBtn = btnGroup.add("button", undefined, getStr("cancelBtn"), {name: "cancel"});

    // Barra de progreso
    var progressBar = win.add("progressbar", undefined, 0, 100);
    progressBar.preferredSize.width = 350;

    // Estado
    var statusText = win.add("statictext", undefined, "");
    statusText.preferredSize.width = 350;

    processBtn.onClick = function() {
        try {
            if (modeBatchRadio.value) {
                // ---- MODO LOTE ----
                if (!selectedFolder) {
                    throw new Error(getStr("noFolder"));
                }
                progressBar.value = 0;
                runBatch(selectedFolder, includeSubfoldersCheck.value, options, suffixInput.text, win, statusText, progressBar);
                win.close();

            } else {
                // ---- MODO DOCUMENTO ACTIVO ----
                if (app.documents.length === 0) {
                    throw new Error(getStr("noDocument"));
                }

                var doc = app.activeDocument;
                progressBar.value = 0;

                if (options.unlockLayers.value) {
                    statusText.text = getStr("step1");
                    unlockAllLayers(doc);
                    progressBar.value = 25;
                }

                if (options.outlineTexts.value) {
                    statusText.text = getStr("step2");
                    outlineAllText(doc);
                    progressBar.value = 50;
                }

                if (options.embedImages.value) {
                    statusText.text = getStr("step3");
                    embedAllImages(doc);
                    progressBar.value = 75;
                }

                if (options.addSuffix.value) {
                    statusText.text = getStr("step4");
                    saveWithSuffix(doc, suffixInput.text);
                    progressBar.value = 100;
                }

                var msg = getStr("success") + "\n\n¡IMPORTANTE!\nPor favor, revise cuidadosamente el archivo antes de enviarlo a producción.";
                alert(msg);
                win.close();
            }

        } catch(e) {
            alert(getStr("error") + e.message);
        }
    };

    win.show();
}

// Iniciar el script
createUI();
