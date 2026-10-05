// Script Profesional Integrado para guardar PDF con opciones avanzadas
// Versión completa con todas las características integradas

// Configuración global
var CONFIG = {
    version: "2.1",
    presets: {
        web: {name: "Web", dpi: 72, compression: CompressionQuality.AUTOMATICJPEGLOW},
        email: {name: "Email", dpi: 100, compression: CompressionQuality.AUTOMATICJPEGMEDIUM},
        print: {name: "Impresión", dpi: 300, compression: CompressionQuality.AUTOMATICJPEGMAXIMUM},
        screen: {name: "Pantalla", dpi: 150, compression: CompressionQuality.AUTOMATICJPEGMEDIUM}
    }
};

// Sistema de configuración persistente
var ConfigManager = {
    configFile: new File(Folder.userData + "/IllustratorPDFSettings.json"),
    
    save: function(settings) {
        try {
            this.configFile.open("w");
            this.configFile.write(JSON.stringify(settings, null, 2));
            this.configFile.close();
            return true;
        } catch (e) {
            return false;
        }
    },
    
    load: function() {
        try {
            if (this.configFile.exists) {
                this.configFile.open("r");
                var content = this.configFile.read();
                this.configFile.close();
                return JSON.parse(content);
            }
        } catch (e) {}
        return null;
    }
};

// Sistema de registro
var Logger = {
    logFile: new File(Folder.userData + "/IllustratorPDFLog.txt"),
    
    log: function(message) {
        try {
            this.logFile.open("a");
            var timestamp = new Date().toLocaleString();
            this.logFile.writeln("[" + timestamp + "] " + message);
            this.logFile.close();
        } catch (e) {}
    }
};

// Verificar que hay un documento abierto
if (app.documents.length > 0) {
    showMainDialog();
} else {
    alert("No hay ningún documento abierto.\n\nPor favor, abre un documento antes de ejecutar este script.");
}

// FUNCIÓN PRINCIPAL DEL DIÁLOGO
function showMainDialog() {
    var doc = app.activeDocument;
    
    // Crear el diálogo principal
    var dialog = new Window("dialog", "Guardar PDF Profesional v" + CONFIG.version);
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.spacing = 10;
    dialog.margins = 16;
    
    // Panel de presets rápidos
    var presetPanel = dialog.add("panel", undefined, "Presets Rápidos");
    presetPanel.orientation = "row";
    presetPanel.alignChildren = "fill";
    presetPanel.margins = 10;
    
    var presetButtons = presetPanel.add("group");
    presetButtons.alignment = "center";
    
    // Botones de preset
    for (var key in CONFIG.presets) {
        (function(presetKey) {
            var btn = presetButtons.add("button", undefined, CONFIG.presets[presetKey].name);
            btn.onClick = function() {
                applyPreset(presetKey);
            };
        })(key);
    }
    
    // Panel de calidad personalizada
    var qualityPanel = dialog.add("panel", undefined, "Calidad Personalizada");
    qualityPanel.orientation = "column";
    qualityPanel.alignChildren = "fill";
    qualityPanel.margins = 10;
    
    // Slider de calidad
    var qualityGroup = qualityPanel.add("group");
    qualityGroup.add("statictext", undefined, "Calidad:");
    var qualitySlider = qualityGroup.add("slider", undefined, 3, 1, 5);
    qualitySlider.preferredSize.width = 200;
    var qualityValue = qualityGroup.add("statictext", undefined, "Media");
    qualityValue.preferredSize.width = 60;
    
    // DPI personalizado
    var dpiGroup = qualityPanel.add("group");
    dpiGroup.add("statictext", undefined, "DPI personalizado:");
    var dpiInput = dpiGroup.add("edittext", undefined, "150");
    dpiInput.preferredSize.width = 60;
    var dpiAuto = dpiGroup.add("checkbox", undefined, "Automático");
    dpiAuto.value = true;
    
    // Descripción de calidad
    var qualityDesc = qualityPanel.add("statictext", undefined, "Equilibrio entre calidad y tamaño", {multiline: true});
    qualityDesc.preferredSize.height = 40;
    
    // Estimación de tamaño
    var sizeEstimate = qualityPanel.add("statictext", undefined, "Tamaño estimado: Calculando...");
    
    // Panel de opciones
    var optionsPanel = dialog.add("panel", undefined, "Opciones Avanzadas");
    optionsPanel.orientation = "column";
    optionsPanel.alignChildren = "left";
    optionsPanel.margins = 10;
    
    // Opciones en dos columnas
    var optionsRow1 = optionsPanel.add("group");
    var optionsCol1 = optionsRow1.add("group");
    optionsCol1.orientation = "column";
    optionsCol1.alignChildren = "left";
    var optionsCol2 = optionsRow1.add("group");
    optionsCol2.orientation = "column";
    optionsCol2.alignChildren = "left";
    
    // Columna 1
    var preserveIllustrator = optionsCol1.add("checkbox", undefined, "Preservar edición de Illustrator");
    preserveIllustrator.value = false;
    
    var optimizeWeb = optionsCol1.add("checkbox", undefined, "Optimizar para web");
    optimizeWeb.value = true;
    
    var embedFonts = optionsCol1.add("checkbox", undefined, "Incrustar todas las fuentes");
    embedFonts.value = true;
    
    // Columna 2
    var compressVectors = optionsCol2.add("checkbox", undefined, "Comprimir arte vectorial");
    compressVectors.value = true;
    
    var includeBleed = optionsCol2.add("checkbox", undefined, "Incluir sangrado");
    includeBleed.value = false;
    
    var convertText = optionsCol2.add("checkbox", undefined, "Convertir texto a contornos");
    convertText.value = false;
    
    // Panel de ubicación
    var locationPanel = dialog.add("panel", undefined, "Ubicación de Guardado");
    locationPanel.orientation = "column";
    locationPanel.alignChildren = "fill";
    locationPanel.margins = 10;
    
    // Nombre del archivo
    var nameGroup = locationPanel.add("group");
    nameGroup.add("statictext", undefined, "Nombre:");
    var docBaseName = doc.name.replace(/\.[^\.]+$/, '');
    var nameInput = nameGroup.add("edittext", undefined, docBaseName);
    nameInput.preferredSize.width = 200;
    
    // Sufijo
    var suffixGroup = locationPanel.add("group");
    suffixGroup.add("statictext", undefined, "Sufijo:");
    var suffixInput = suffixGroup.add("edittext", undefined, "_optimizado");
    suffixInput.preferredSize.width = 100;
    var addDate = suffixGroup.add("checkbox", undefined, "Añadir fecha");
    addDate.value = false;
    
    // Ubicación
    var pathGroup = locationPanel.add("group");
    pathGroup.add("statictext", undefined, "Guardar en:");
    var pathDisplay = pathGroup.add("statictext", undefined, "Misma carpeta del documento");
    pathDisplay.preferredSize.width = 250;
    var browseBtn = pathGroup.add("button", undefined, "Cambiar...");
    
    var customPath = null;
    browseBtn.onClick = function() {
        var folder = Folder.selectDialog("Selecciona la carpeta de destino");
        if (folder) {
            customPath = folder;
            pathDisplay.text = decodeURI(folder.fsName);
        }
    };
    
    // Botones principales
    var buttonGroup = dialog.add("group");
    buttonGroup.alignment = "center";
    
    var helpBtn = buttonGroup.add("button", undefined, "?");
    helpBtn.preferredSize.width = 30;
    var batchBtn = buttonGroup.add("button", undefined, "Lotes...");
    var cancelBtn = buttonGroup.add("button", undefined, "Cancelar");
    var saveBtn = buttonGroup.add("button", undefined, "Guardar PDF");
    saveBtn.active = true;
    
    // Eventos
    qualitySlider.onChanging = function() {
        updateQualityDisplay();
        updateSizeEstimate();
    };
    
    dpiAuto.onClick = function() {
        dpiInput.enabled = !this.value;
        if (this.value) {
            updateQualityDisplay();
        }
        updateSizeEstimate();
    };
    
    dpiInput.onChanging = function() {
        updateSizeEstimate();
    };
    
    helpBtn.onClick = function() {
        showHelp();
    };
    
    batchBtn.onClick = function() {
        dialog.close();
        showBatchDialog();
    };
    
    cancelBtn.onClick = function() {
        dialog.close();
    };
    
    saveBtn.onClick = function() {
        if (validateInput()) {
            savePDF();
            dialog.close();
        }
    };
    
    // Funciones auxiliares del diálogo principal
    function updateQualityDisplay() {
        var val = Math.round(qualitySlider.value);
        var qualities = ["", "Mínima", "Baja", "Media", "Alta", "Máxima"];
        qualityValue.text = qualities[val];
        
        var descriptions = [
            "",
            "Tamaño mínimo, calidad básica (72 DPI)",
            "Tamaño reducido, calidad aceptable (100 DPI)",
            "Equilibrio entre calidad y tamaño (150 DPI)",
            "Buena calidad, tamaño moderado (200 DPI)",
            "Máxima calidad, tamaño grande (300 DPI)"
        ];
        qualityDesc.text = descriptions[val];
        
        if (dpiAuto.value) {
            var dpiValues = [0, 72, 100, 150, 200, 300];
            dpiInput.text = dpiValues[val];
        }
    }
    
    function updateSizeEstimate() {
        var baseSize = getDocumentSizeInMB();
        var dpi = parseInt(dpiInput.text) || 150;
        var factor = dpi / 300;
        
        if (!preserveIllustrator.value) factor *= 0.7;
        if (optimizeWeb.value) factor *= 0.8;
        if (compressVectors.value) factor *= 0.9;
        
        var estimated = (baseSize * factor).toFixed(1);
        sizeEstimate.text = "Tamaño estimado: ~" + estimated + " MB";
    }
    
    function getDocumentSizeInMB() {
        var items = doc.pageItems.length;
        var rasters = doc.rasterItems.length;
        var size = 0.5 + (items * 0.01) + (rasters * 0.5);
        return Math.max(0.1, size);
    }
    
    function applyPreset(presetKey) {
        var preset = CONFIG.presets[presetKey];
        dpiAuto.value = false;
        dpiInput.text = preset.dpi;
        dpiInput.enabled = true;
        
        if (preset.dpi <= 72) qualitySlider.value = 1;
        else if (preset.dpi <= 100) qualitySlider.value = 2;
        else if (preset.dpi <= 150) qualitySlider.value = 3;
        else if (preset.dpi <= 200) qualitySlider.value = 4;
        else qualitySlider.value = 5;
        
        updateQualityDisplay();
        updateSizeEstimate();
    }
    
    function validateInput() {
        if (nameInput.text.length === 0) {
            alert("Por favor, introduce un nombre para el archivo.");
            return false;
        }
        
        var dpiValue = parseInt(dpiInput.text);
        if (isNaN(dpiValue) || dpiValue < 72 || dpiValue > 600) {
            alert("El valor de DPI debe estar entre 72 y 600.");
            return false;
        }
        
        return true;
    }
    
    function savePDF() {
        var savePath;
        if (customPath) {
            savePath = customPath;
        } else {
            try {
                savePath = doc.fullName.parent;
            } catch (e) {
                savePath = Folder.desktop;
            }
        }
        
        var fileName = nameInput.text + suffixInput.text;
        if (addDate.value) {
            var date = new Date();
            var dateStr = "_" + date.getFullYear() + 
                         ("0" + (date.getMonth() + 1)).slice(-2) + 
                         ("0" + date.getDate()).slice(-2);
            fileName += dateStr;
        }
        fileName += ".pdf";
        
        var pdfFile = new File(savePath + "/" + fileName);
        
        if (pdfFile.exists) {
            var overwrite = confirm("El archivo ya existe:\n" + pdfFile.fsName + "\n\n¿Desea sobrescribirlo?");
            if (!overwrite) return;
        }
        
        var pdfOptions = new PDFSaveOptions();
        var targetDPI = parseInt(dpiInput.text);
        
        pdfOptions.compatibility = PDFCompatibility.ACROBAT5;
        pdfOptions.preserveEditability = preserveIllustrator.value;
        pdfOptions.generateThumbnails = (targetDPI >= 200);
        pdfOptions.compressArt = compressVectors.value;
        pdfOptions.optimizeForWeb = optimizeWeb.value;
        
        var compression;
        if (targetDPI <= 72) compression = CompressionQuality.AUTOMATICJPEGMINIMUM;
        else if (targetDPI <= 100) compression = CompressionQuality.AUTOMATICJPEGLOW;
        else if (targetDPI <= 150) compression = CompressionQuality.AUTOMATICJPEGMEDIUM;
        else if (targetDPI <= 200) compression = CompressionQuality.AUTOMATICJPEGHIGH;
        else compression = CompressionQuality.AUTOMATICJPEGMAXIMUM;
        
        pdfOptions.colorDownsampling = targetDPI;
        pdfOptions.colorDownsamplingMethod = DownsampleMethod.BICUBICDOWNSAMPLE;
        pdfOptions.colorDownsamplingImageThreshold = targetDPI * 1.5;
        pdfOptions.colorCompression = compression;
        
        pdfOptions.grayscaleDownsampling = targetDPI;
        pdfOptions.grayscaleDownsamplingMethod = DownsampleMethod.BICUBICDOWNSAMPLE;
        pdfOptions.grayscaleDownsamplingImageThreshold = targetDPI * 1.5;
        pdfOptions.grayscaleCompression = compression;
        
        pdfOptions.monochromeDownsampling = targetDPI * 2;
        pdfOptions.monochromeDownsamplingMethod = DownsampleMethod.BICUBICDOWNSAMPLE;
        pdfOptions.monochromeDownsamplingImageThreshold = targetDPI * 3;
        pdfOptions.monochromeCompression = MonochromeCompression.CCIT4;
        
        pdfOptions.fontSubsetThreshold = embedFonts.value ? 0 : 100;
        pdfOptions.preserveLayers = preserveIllustrator.value;
        
        try {
            if (convertText.value) {
                var tempDoc = doc.duplicate();
                convertTextToOutlines(tempDoc);
                tempDoc.saveAs(pdfFile, pdfOptions);
                tempDoc.close(SaveOptions.DONOTSAVECHANGES);
            } else {
                doc.saveAs(pdfFile, pdfOptions);
            }
            
            var resultMsg = "PDF guardado exitosamente:\n" + pdfFile.fsName;
            
            if (pdfFile.exists) {
                var fileSize = pdfFile.length / 1024 / 1024;
                resultMsg += "\n\nTamaño final: " + fileSize.toFixed(2) + " MB";
                resultMsg += "\nDPI: " + targetDPI;
                
                // Registrar en el log
                Logger.log("PDF guardado: " + fileName + " | DPI: " + targetDPI + " | Tamaño: " + fileSize.toFixed(2) + " MB");
            }
            
            alert(resultMsg);
            
        } catch (e) {
            alert("Error al guardar el PDF:\n" + e.message);
        }
    }
    
    function convertTextToOutlines(targetDoc) {
        for (var i = 0; i < targetDoc.textFrames.length; i++) {
            try {
                targetDoc.textFrames[i].createOutline();
            } catch (e) {}
        }
    }
    
    // Inicializar
    updateQualityDisplay();
    updateSizeEstimate();
    
    // Mostrar el diálogo
    dialog.show();
}

// FUNCIÓN DE PROCESAMIENTO POR LOTES
function showBatchDialog() {
    var batchDialog = new Window("dialog", "Procesamiento por Lotes");
    batchDialog.orientation = "column";
    batchDialog.alignChildren = "fill";
    batchDialog.margins = 15;
    
    // Panel de archivos
    var filesPanel = batchDialog.add("panel", undefined, "Archivos a Procesar");
    filesPanel.orientation = "column";
    filesPanel.alignChildren = "fill";
    filesPanel.margins = 10;
    
    // Lista de archivos
    var filesList = filesPanel.add("listbox", undefined, [], {
        multiselect: true,
        numberOfColumns: 2,
        showHeaders: true,
        columnTitles: ["Archivo", "Estado"]
    });
    filesList.preferredSize = [500, 200];
    
    // Botones de archivos
    var fileButtons = filesPanel.add("group");
    fileButtons.alignment = "center";
    
    var addFilesBtn = fileButtons.add("button", undefined, "Añadir Archivos...");
    var addFolderBtn = fileButtons.add("button", undefined, "Añadir Carpeta...");
    var removeBtn = fileButtons.add("button", undefined, "Quitar Seleccionados");
    var clearBtn = fileButtons.add("button", undefined, "Limpiar Lista");
    
    // Panel de configuración
    var configPanel = batchDialog.add("panel", undefined, "Configuración para Todos");
    configPanel.orientation = "column";
    configPanel.alignChildren = "fill";
    configPanel.margins = 10;
    
    // Preset para todos
    var presetGroup = configPanel.add("group");
    presetGroup.add("statictext", undefined, "Aplicar preset:");
    var presetDropdown = presetGroup.add("dropdownlist", undefined, ["Web", "Email", "Pantalla", "Impresión"]);
    presetDropdown.selection = 0;
    
    // DPI para todos
    var dpiGroup = configPanel.add("group");
    dpiGroup.add("statictext", undefined, "DPI:");
    var batchDPI = dpiGroup.add("edittext", undefined, "150");
    batchDPI.preferredSize.width = 60;
    
    // Opciones
    var batchOptimize = configPanel.add("checkbox", undefined, "Optimizar para web");
    batchOptimize.value = true;
    var batchCompress = configPanel.add("checkbox", undefined, "Comprimir vectores");
    batchCompress.value = true;
    
    // Panel de progreso
    var progressPanel = batchDialog.add("panel", undefined, "Progreso");
    progressPanel.orientation = "column";
    progressPanel.alignChildren = "fill";
    progressPanel.margins = 10;
    
    var progressBar = progressPanel.add("progressbar", undefined, 0, 100);
    progressBar.preferredSize.width = 500;
    var progressText = progressPanel.add("statictext", undefined, "Listo para procesar");
    
    // Botones principales
    var mainButtons = batchDialog.add("group");
    mainButtons.alignment = "center";
    var backBtn = mainButtons.add("button", undefined, "Volver");
    var processBatchBtn = mainButtons.add("button", undefined, "Procesar Todos");
    
    // Variables
    var filesToProcess = [];
    var processing = false;
    
    // Eventos
    addFilesBtn.onClick = function() {
        var files = File.openDialog("Selecciona archivos de Illustrator", "*.ai;*.eps;*.pdf", true);
        if (files) {
            if (files.length) {
                for (var i = 0; i < files.length; i++) {
                    addFileToList(files[i]);
                }
            } else {
                addFileToList(files);
            }
        }
    };
    
    addFolderBtn.onClick = function() {
        var folder = Folder.selectDialog("Selecciona una carpeta");
        if (folder) {
            var files = folder.getFiles("*.ai");
            for (var i = 0; i < files.length; i++) {
                if (files[i] instanceof File) {
                    addFileToList(files[i]);
                }
            }
        }
    };
    
    removeBtn.onClick = function() {
        var selected = [];
        if (filesList.selection) {
            if (filesList.selection.length) {
                for (var i = 0; i < filesList.selection.length; i++) {
                    selected.push(filesList.selection[i].index);
                }
            } else {
                selected.push(filesList.selection.index);
            }
            
            // Eliminar de atrás hacia adelante
            selected.sort(function(a, b) { return b - a; });
            for (var j = 0; j < selected.length; j++) {
                filesToProcess.splice(selected[j], 1);
                filesList.remove(selected[j]);
            }
        }
    };
    
    clearBtn.onClick = function() {
        filesToProcess = [];
        filesList.removeAll();
    };
    
    backBtn.onClick = function() {
        batchDialog.close();
        showMainDialog();
    };
    
    processBatchBtn.onClick = function() {
        if (filesToProcess.length === 0) {
            alert("No hay archivos para procesar");
            return;
        }
        processBatch();
    };
    
    // Funciones auxiliares
    function addFileToList(file) {
        for (var i = 0; i < filesToProcess.length; i++) {
            if (filesToProcess[i].fsName === file.fsName) return;
        }
        
        filesToProcess.push(file);
        var item = filesList.add("item", file.name);
        item.subItems[0].text = "Pendiente";
    }
    
    function processBatch() {
        processing = true;
        processBatchBtn.enabled = false;
        var errors = [];
        var processed = 0;
        
        for (var i = 0; i < filesToProcess.length && processing; i++) {
            try {
                progressBar.value = ((i + 1) / filesToProcess.length) * 100;
                progressText.text = "Procesando: " + filesToProcess[i].name;
                
                filesList.items[i].subItems[0].text = "Procesando...";
                batchDialog.update();
                
                var batchDoc = app.open(filesToProcess[i]);
                
                var pdfOptions = new PDFSaveOptions();
                var targetDPI = parseInt(batchDPI.text) || 150;
                
                pdfOptions.compatibility = PDFCompatibility.ACROBAT5;
                pdfOptions.preserveEditability = false;
                pdfOptions.compressArt = batchCompress.value;
                pdfOptions.optimizeForWeb = batchOptimize.value;
                
                var compressionMap = {
                    "Web": CompressionQuality.AUTOMATICJPEGLOW,
                    "Email": CompressionQuality.AUTOMATICJPEGMEDIUM,
                    "Pantalla": CompressionQuality.AUTOMATICJPEGMEDIUM,
                    "Impresión": CompressionQuality.AUTOMATICJPEGMAXIMUM
                };
                
                var compression = compressionMap[presetDropdown.selection.text];
                
                pdfOptions.colorDownsampling = targetDPI;
                pdfOptions.colorCompression = compression;
                pdfOptions.grayscaleDownsampling = targetDPI;
                pdfOptions.grayscaleCompression = compression;
                
                var pdfName = filesToProcess[i].name.replace(/\.[^\.]+$/, '') + "_batch.pdf";
                var pdfFile = new File(filesToProcess[i].parent + "/" + pdfName);
                
                batchDoc.saveAs(pdfFile, pdfOptions);
                batchDoc.close(SaveOptions.DONOTSAVECHANGES);
                
                filesList.items[i].subItems[0].text = "✓ Completado";
                processed++;
                
                // Registrar en el log
                Logger.log("Batch PDF: " + pdfName + " | DPI: " + targetDPI);
                
            } catch (e) {
                errors.push(filesToProcess[i].name + ": " + e.message);
                filesList.items[i].subItems[0].text = "✗ Error";
            }
        }
        
        progressBar.value = 100;
        progressText.text = "Proceso completado";
        processBatchBtn.enabled = true;
        processing = false;
        
        var summary = "Proceso completado.\n\n";
        summary += "Archivos procesados: " + processed + "/" + filesToProcess.length;
        
        if (errors.length > 0) {
            summary += "\n\nErrores:\n" + errors.join("\n");
        }
        
        alert(summary);
    }
    
    batchDialog.show();
}

// FUNCIÓN DE AYUDA
function showHelp() {
    var helpDialog = new Window("dialog", "Ayuda - Guardar PDF");
    helpDialog.orientation = "column";
    helpDialog.alignChildren = "fill";
    helpDialog.margins = 15;
    
    var helpText = helpDialog.add("statictext", undefined, 
        "CONSEJOS PARA REDUCIR EL TAMAÑO DEL PDF:\n\n" +
        "• Use presets 'Web' o 'Email' para tamaños mínimos\n" +
        "• Desactive 'Preservar edición' si no necesita editar el PDF\n" +
        "• Active 'Optimizar para web' para visualización en línea\n" +
        "• Reduzca el DPI para disminuir el tamaño (mínimo 72)\n" +
        "• Active 'Comprimir arte vectorial' para archivos complejos\n\n" +
        "RECOMENDACIONES POR USO:\n" +
        "• Web/Email: 72-100 DPI\n" +
        "• Pantalla/Presentaciones: 150 DPI\n" +
        "• Impresión doméstica: 200 DPI\n" +
        "• Impresión profesional: 300 DPI\n\n" +
        "PROCESAMIENTO POR LOTES:\n" +
        "Use el botón 'Lotes...' para procesar múltiples archivos",
        {multiline: true}
    );
    helpText.preferredSize = [400, 350];
    
    var okBtn = helpDialog.add("button", undefined, "Entendido");
    okBtn.alignment = "center";
    okBtn.onClick = function() { helpDialog.close(); };
    
    helpDialog.show();
}