// Script: Auto Pantone Text Generator - Versión corregida
// Maneja capas bloqueadas y otros problemas de capas

// Verificar que hay un documento abierto
if (app.documents.length > 0) {
    var doc = app.activeDocument;
    var selection = doc.selection;
    
    // Verificar que hay objetos seleccionados
    if (selection.length > 0) {
        var processedCount = 0;
        var errors = [];
        
        // Procesar cada objeto seleccionado
        for (var i = 0; i < selection.length; i++) {
            var item = selection[i];
            
            // Verificar que es un PathItem
            if (item.typename == "PathItem") {
                // Verificar que tiene un color de relleno tipo Spot
                if (item.filled && item.fillColor.typename == "SpotColor") {
                    try {
                        // Obtener la capa del objeto
                        var targetLayer = item.layer;
                        var wasLocked = false;
                        var wasVisible = true;
                        
                        // Guardar estado original de la capa y desbloquearla si es necesario
                        if (targetLayer.locked) {
                            wasLocked = true;
                            targetLayer.locked = false;
                        }
                        
                        if (!targetLayer.visible) {
                            wasVisible = false;
                            targetLayer.visible = true;
                        }
                        
                        // Obtener el nombre del color Pantone
                        var pantoneName = item.fillColor.spot.name;
                        
                        // Obtener las dimensiones y posición del rectángulo
                        var bounds = item.geometricBounds;
                        var rectLeft = bounds[0];
                        var rectTop = bounds[1];
                        var rectRight = bounds[2];
                        var rectBottom = bounds[3];
                        
                        // Calcular el centro horizontal del rectángulo
                        var centerX = rectLeft + (rectRight - rectLeft) / 2;
                        
                        // Crear el texto frame en la misma capa que el rectángulo
                        var textFrame = targetLayer.textFrames.add();
                        textFrame.contents = pantoneName;
                        
                        // Configurar el estilo del texto
                        var textRange = textFrame.textRange;
                        textRange.characterAttributes.size = 12; // Tamaño de fuente
                        textRange.paragraphAttributes.justification = Justification.CENTER;
                        
                        // Posicionar el texto debajo del rectángulo
                        var textBounds = textFrame.geometricBounds;
                        var textWidth = textBounds[2] - textBounds[0];
                        
                        // Ajustar posición: centrado horizontalmente, 8pt debajo del rectángulo
                        textFrame.left = centerX - textWidth / 2;
                        textFrame.top = rectBottom - 8;
                        
                        // Restaurar estado original de la capa si estaba bloqueada
                        if (wasLocked) {
                            targetLayer.locked = true;
                        }
                        
                        if (!wasVisible) {
                            targetLayer.visible = false;
                        }
                        
                        processedCount++;
                        
                    } catch (e) {
                        errors.push("Error en objeto " + (i+1) + ": " + e.toString());
                    }
                }
                else if (item.filled) {
                    errors.push("El objeto " + (i+1) + " no tiene un color Pantone asignado");
                }
            }
        }
        
        // Mostrar resultados
        var message = "";
        if (processedCount > 0) {
            message = "Se procesaron " + processedCount + " rectángulos con colores Pantone.";
        }
        
        if (errors.length > 0) {
            message += "\n\nErrores encontrados:\n" + errors.join("\n");
        }
        
        if (message === "") {
            message = "No se encontraron rectángulos con colores Pantone en la selección";
        }
        
        alert(message);
        
    } else {
        alert("Por favor selecciona al menos un rectángulo con color Pantone");
    }
} else {
    alert("Por favor abre un documento");
}