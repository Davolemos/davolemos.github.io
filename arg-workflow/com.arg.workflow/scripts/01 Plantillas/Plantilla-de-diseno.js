// Script by David Ortiz - Versión Moderna

// Crear la ventana principal con apariencia mejorada
var scriptMenu = new Window("dialog", "Seleccionar Plantilla de Diseño", undefined, {borderless: true});
scriptMenu.orientation = "column";
scriptMenu.alignChildren = ["fill", "top"];
scriptMenu.preferredSize = [320, 380];
scriptMenu.margins = 20;
scriptMenu.spacing = 15;

// Personalizar colores (RGB como decimales)
var menuGray = [0.4, 0.4, 0.4];        // Gris medio para el fondo del menú
var buttonLightGray = [0.7, 0.7, 0.7]; // Gris claro para los botones
var whiteText = [1, 1, 1];             // Blanco para el texto
var accentColor = [0.5, 0.5, 0.5];     // Gris para acentos

// Establecer propiedades generales de la ventana
scriptMenu.orientation = "column";
scriptMenu.alignChildren = ["fill", "top"];
scriptMenu.preferredSize = [320, 380];
scriptMenu.margins = 20;
scriptMenu.spacing = 15;
scriptMenu.graphics.backgroundColor = scriptMenu.graphics.newBrush(scriptMenu.graphics.BrushType.SOLID_COLOR, menuGray);

// Aplicar estilo sin borde a la ventana
if (scriptMenu.properties) {
    scriptMenu.properties.borderless = true;
}

// Crear barra de título
var titleBar = scriptMenu.add("group");
titleBar.orientation = "row";
titleBar.alignChildren = ["fill", "center"];
titleBar.spacing = 10;
titleBar.margins = [0, 0, 0, 10];

// Añadir título con estilo moderno
var titleText = titleBar.add("statictext", undefined, "PLANTILLAS DE DISEÑO");
titleText.graphics.font = ScriptUI.newFont("Arial", "BOLD", 16);
titleText.graphics.foregroundColor = titleText.graphics.newPen(scriptMenu.graphics.PenType.SOLID_COLOR, whiteText, 1);

// Botón de cierre mejorado
var closeButton = titleBar.add("button", undefined, "×");
closeButton.alignment = ["right", "top"];
closeButton.preferredSize = [30, 30];
closeButton.graphics.font = ScriptUI.newFont("Arial", "BOLD", 16);
closeButton.onClick = function() {
    scriptMenu.close();
};

// Añadir separador para mejor organización visual
var separator = scriptMenu.add("panel");
separator.alignment = ["fill", "top"];
separator.preferredSize = [0, 1];
separator.graphics.backgroundColor = separator.graphics.newBrush(separator.graphics.BrushType.SOLID_COLOR, accentColor);

// Función para crear botones con estilo moderno y redondeado
function createModernButton(parent, text) {
    // Crear grupo contenedor para el botón
    var btnGroup = parent.add("group");
    btnGroup.orientation = "row";
    btnGroup.alignChildren = ["fill", "center"];
    btnGroup.spacing = 0;
    btnGroup.margins = 0;
    btnGroup.alignment = ["fill", "top"];
    
    // Crear botón dentro del grupo
    var btn = btnGroup.add("button", undefined, text, {style: 'toolbutton'});
    btn.preferredSize = [0, 50];
    btn.alignment = ["fill", "fill"];
    btn.graphics.font = ScriptUI.newFont("Arial", "BOLD", 14);
    
    return btn;
}

// Añadir contenedor para botones
var buttonContainer = scriptMenu.add("group");
buttonContainer.orientation = "column";
buttonContainer.alignChildren = ["fill", "top"];
buttonContainer.spacing = 12;
buttonContainer.alignment = ["fill", "top"];

// Crear botones con el nuevo estilo
var horizontalButton = createModernButton(buttonContainer, "1. Horizontal (Más utilizada)");
horizontalButton.onClick = function() {
    openFileInIllustrator("Horizontal");
    scriptMenu.close();
};

var verticalButton = createModernButton(buttonContainer, "2. Vertical");
verticalButton.onClick = function() {
    openFileInIllustrator("Vertical");
    scriptMenu.close();
};

var largeButton = createModernButton(buttonContainer, "3. Grande");
largeButton.onClick = function() {
    openFileInIllustrator("Grande");
    scriptMenu.close();
};

var headersButton = createModernButton(buttonContainer, "4. Headers");
headersButton.onClick = function() {
    openFileInIllustrator("Headers");
    scriptMenu.close();
};

// Añadir pie de página con firma
var footer = scriptMenu.add("group");
footer.alignment = ["center", "bottom"];
footer.margins = [0, 15, 0, 0];

var signature = footer.add("statictext", undefined, "Script by David Ortiz");
signature.graphics.font = ScriptUI.newFont("Arial", "ITALIC", 10);
signature.graphics.foregroundColor = signature.graphics.newPen(signature.graphics.PenType.SOLID_COLOR, whiteText, 0.8);

// Función para abrir la plantilla seleccionada
function openFileInIllustrator(fileName) {
    var desktopPath = Folder.desktop + "/Plantilla de diseño/" + fileName + ".ai";
    var designFile = new File(desktopPath);

    if (designFile.exists) {
        app.open(designFile);
    } else {
        alert("El archivo " + fileName + " no se encontró en la carpeta Plantilla de diseño en el escritorio.");
    }
}

// Mostrar el diálogo
scriptMenu.show();
