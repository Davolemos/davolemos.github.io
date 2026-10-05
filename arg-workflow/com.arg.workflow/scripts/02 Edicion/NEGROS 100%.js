// Script: Limpiar Negros Contaminados
// Convierte todos los colores que parecen negro a K:100%
// Para Adobe Illustrator

#target illustrator

// Configuración: umbral para considerar un color como "negro contaminado"
var UMBRAL_RGB = 15; // Valores RGB menores a este se consideran negros
var UMBRAL_CMYK = 85; // Si la suma de CMY es menor a este % y K es alto

// Contador global de conversiones
var contadorConversiones = 0;

function esNegroContaminado(color) {
    // Verificar si es color CMYK
    if (color.typename == "CMYKColor") {
        var c = color.cyan;
        var m = color.magenta;
        var y = color.yellow;
        var k = color.black;
        
        // Si K es alto (>70) y tiene CMY residuales
        if (k > 70 && (c > 0 || m > 0 || y > 0)) {
            return true;
        }
        
        // Si la suma total de tintas es alta y da apariencia de negro
        var totalTinta = c + m + y + k;
        if (totalTinta > 300 && k > 50) {
            return true;
        }
    }
    
    // Verificar si es color RGB
    if (color.typename == "RGBColor") {
        var r = color.red;
        var g = color.green;
        var b = color.blue;
        
        // Si todos los valores RGB son muy bajos (negro o casi negro)
        if (r <= UMBRAL_RGB && g <= UMBRAL_RGB && b <= UMBRAL_RGB) {
            return true;
        }
    }
    
    // Verificar si es color Gray
    if (color.typename == "GrayColor") {
        if (color.gray >= 90) { // Gris muy oscuro
            return true;
        }
    }
    
    return false;
}

function convertirANegroPuro(item) {
    var negroPuro = new CMYKColor();
    negroPuro.cyan = 0;
    negroPuro.magenta = 0;
    negroPuro.yellow = 0;
    negroPuro.black = 100;
    
    // Convertir fillColor
    if (item.filled && item.fillColor && esNegroContaminado(item.fillColor)) {
        item.fillColor = negroPuro;
        contadorConversiones++;
    }
    
    // Convertir strokeColor
    if (item.stroked && item.strokeColor && esNegroContaminado(item.strokeColor)) {
        item.strokeColor = negroPuro;
        contadorConversiones++;
    }
}

function procesarItem(item) {
    // PathItems
    if (item.typename == "PathItem") {
        convertirANegroPuro(item);
    }
    
    // CompoundPathItems
    else if (item.typename == "CompoundPathItem") {
        convertirANegroPuro(item);
    }
    
    // TextFrames
    else if (item.typename == "TextFrame") {
        if (item.textRange && item.textRange.characterAttributes) {
            var color = item.textRange.characterAttributes.fillColor;
            if (color && esNegroContaminado(color)) {
                var negroPuro = new CMYKColor();
                negroPuro.cyan = 0;
                negroPuro.magenta = 0;
                negroPuro.yellow = 0;
                negroPuro.black = 100;
                item.textRange.characterAttributes.fillColor = negroPuro;
                contadorConversiones++;
            }
        }
    }
    
    // GroupItems - procesar recursivamente
    else if (item.typename == "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) {
            procesarItem(item.pageItems[i]);
        }
    }
}

function main() {
    // Verificar que hay un documento abierto
    if (app.documents.length == 0) {
        alert("No hay ningún documento abierto.");
        return;
    }
    
    var doc = app.activeDocument;
    contadorConversiones = 0;
    
    // Procesar todos los elementos del documento
    try {
        for (var i = 0; i < doc.pageItems.length; i++) {
            procesarItem(doc.pageItems[i]);
        }
        
        // Mostrar resultado
        if (contadorConversiones > 0) {
            alert("Proceso completado.\n\nColores convertidos a K:100%: " + contadorConversiones);
        } else {
            alert("Proceso completado.\n\nNo se encontraron negros contaminados.");
        }
    }
    catch (e) {
        alert("Error durante el proceso: " + e.message);
    }
}

// Ejecutar el script
main();