/*
QuickPackage.jsx
Version: 1.5.0
Author: Senior Script Developer
Description: 
    ES: Script de empaquetado para Adobe Illustrator que crea una única carpeta
    con sufijo _AF en la misma ubicación que el archivo original.
*/

#target illustrator
#targetengine main

// Configuración de idiomas
var SCRIPT_LOCALE = {
    en: {
        noDocumentOpen: "Please open a document before running this script.",
        documentNotSaved: "Please save the document before packaging.",
        packageComplete: "Package created successfully at:\n",
        errorCreatingFolder: "Error creating package folder",
        folderExists: "A package folder already exists. Please delete or rename it first."
    },
    es: {
        noDocumentOpen: "Por favor, abra un documento antes de ejecutar este script.",
        documentNotSaved: "Por favor, guarde el documento antes de empaquetarlo.",
        packageComplete: "¡Paquete creado exitosamente en:\n",
        errorCreatingFolder: "Error al crear la carpeta del paquete",
        folderExists: "Ya existe una carpeta de paquete. Por favor, elimínela o renómbrela primero."
    }
};

// Configuración global
var CONFIG = {
    suffix: "_AF"
};

// Función principal
try {
    if (app.documents.length > 0) {
        main();
    } else {
        throw new Error(getLocalizedString("noDocumentOpen"));
    }
} catch(e) {
    alert(e.message);
}

function main() {
    var doc = app.activeDocument;
    
    // Verificar que el documento esté guardado
    if (!doc.path) {
        alert(getLocalizedString("documentNotSaved"));
        return;
    }
    
    // Crear nombre de carpeta
    var originalPath = doc.path;
    var fileName = doc.name.split('.')[0];
    var packageFolder = new Folder(originalPath + "/" + fileName + CONFIG.suffix);
    
    // Verificar si la carpeta ya existe
    if (packageFolder.exists) {
        alert(getLocalizedString("folderExists"));
        return;
    }
    
    try {
        // Crear carpeta principal
        if (!packageFolder.create()) {
            throw new Error(getLocalizedString("errorCreatingFolder"));
        }
        
        // Crear subcarpetas necesarias
        var linksFolder = new Folder(packageFolder + "/Links");
        var fontsFolder = new Folder(packageFolder + "/Document_Fonts");
        linksFolder.create();
        fontsFolder.create();
        
        // Copiar archivos vinculados
        copyLinkedFiles(doc, linksFolder);
        
        // Recopilar y copiar fuentes
        gatherFonts(doc, fontsFolder);
        
        // Guardar copia del documento
        saveDocumentCopy(doc, packageFolder);
        
        // Generar reporte
        generateReport(doc, packageFolder);
        
        alert(getLocalizedString("packageComplete") + packageFolder.fsName);
        
    } catch(e) {
        alert(e.message);
    }
}

function copyLinkedFiles(doc, destFolder) {
    var links = doc.placedItems;
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        if (link.file) {
            var fileName = link.file.name;
            link.file.copy(destFolder + "/" + fileName);
        }
    }
}

function gatherFonts(doc, destFolder) {
    // Definir las carpetas de fuentes de macOS
    var systemFontFolders = [
        "/Library/Fonts/",
        "~/Library/Fonts/"
    ];
    
    // Array para almacenar las fuentes usadas
    var usedFonts = {};
    
    // Obtener todas las fuentes usadas en el documento
    for (var i = 0; i < doc.textFrames.length; i++) {
        var textFrame = doc.textFrames[i];
        if (textFrame.textRanges) {
            for (var j = 0; j < textFrame.textRanges.length; j++) {
                var font = textFrame.textRanges[j].characterAttributes.textFont;
                if (font && font.name) {
                    usedFonts[font.name] = true;
                }
            }
        }
    }
    
    // Buscar y copiar cada fuente
    for (var fontName in usedFonts) {
        if (usedFonts.hasOwnProperty(fontName)) {
            // Posibles extensiones de archivo de fuente
            var extensions = [".otf", ".ttf", ".ttc"];
            
            // Buscar en cada carpeta de fuentes
            for (var i = 0; i < systemFontFolders.length; i++) {
                var fontFolder = new Folder(systemFontFolders[i]);
                
                // Buscar la fuente con diferentes extensiones
                for (var j = 0; j < extensions.length; j++) {
                    var fontFile = new File(fontFolder + "/" + fontName + extensions[j]);
                    if (fontFile.exists) {
                        // Copiar la fuente a la carpeta Document_Fonts
                        fontFile.copy(destFolder + "/" + fontFile.name);
                        break;
                    }
                }
            }
        }
    }
    
    // Crear reporte de fuentes
    var report = new File(destFolder + "/fonts_used.txt");
    report.open("w");
    report.writeln("Fonts used in document:");
    report.writeln("=====================");
    for (var fontName in usedFonts) {
        report.writeln(fontName);
    }
    report.close();
}

function saveDocumentCopy(doc, destFolder) {
    var saveOptions = new IllustratorSaveOptions();
    saveOptions.saveMultipleArtboards = false;
    var newFile = new File(destFolder + "/" + doc.name);
    doc.saveAs(newFile, saveOptions);
}

function generateReport(doc, destFolder) {
    var report = new File(destFolder + "/package_report.txt");
    report.open('w');
    report.write("Package Report for " + doc.name + "\n");
    report.write("Created: " + new Date().toLocaleString() + "\n\n");
    report.write("Document Information:\n");
    report.write("- Original Location: " + doc.path + "\n");
    report.write("- Artboards: " + doc.artboards.length + "\n");
    report.write("- Placed Items: " + doc.placedItems.length + "\n");
    report.write("- Text Frames: " + doc.textFrames.length + "\n");
    report.close();
}

function getLocalizedString(key) {
    var userLanguage = app.locale.indexOf("es") === 0 ? "es" : "en";
    return SCRIPT_LOCALE[userLanguage][key] || SCRIPT_LOCALE["en"][key];
}
