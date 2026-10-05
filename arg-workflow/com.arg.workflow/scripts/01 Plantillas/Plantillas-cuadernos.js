// Script mejorado por David Ortiz - Plantillas de Cuadernos v2.0
#target Illustrator

(function () {
    // Verificar entorno Illustrator
    if (app.name !== "Adobe Illustrator") {
        alert("Este script solo funciona en Adobe Illustrator.");
        return;
    }

    // Tema de colores
    var theme = {
        background: [0.2, 0.2, 0.25],    // Fondo principal
        headerBg:   [0.15, 0.15, 0.2],    // Cabecera
        panelBg:    [0.25, 0.25, 0.28],   // Paneles
        text:       [1, 1, 1],            // Texto blanco
        portadaColor: [0.16, 0.7, 0.16],  // Verde para sección portadas
        internaColor: [0.9, 0.7, 0.1],    // Amarillo para sección internas
        hoverColor: [0, 0.624, 0.89]      // Color hover #009fe3 (0, 159, 227)
    };

    // Crear ventana principal
    var win = new Window("dialog", "Plantillas de Cuadernos");
    win.alignChildren = "fill";
    win.preferredSize = [360, 620];
    
    try {
        // Aplicar color de fondo al diálogo
        win.graphics.backgroundColor = win.graphics.newBrush(win.graphics.BrushType.SOLID_COLOR, theme.background);
    } catch(e) {
        // En caso de error, seguimos sin aplicar el color
    }

    // Cabecera con título
    var header = win.add("group");
    header.alignment = "center";
    header.preferredSize.height = 50;
    
    var title = header.add("statictext", undefined, "PLANTILLAS DE CUADERNOS");
    title.graphics.font = ScriptUI.newFont("Arial", "BOLD", 16);
    try {
        title.graphics.foregroundColor = title.graphics.newPen(title.graphics.PenType.SOLID_COLOR, theme.text, 1);
    } catch(e) {
        // Si falla la personalización, seguimos con el estilo por defecto
    }

    // Contenedor principal para todas las secciones
    var mainContainer = win.add("group");
    mainContainer.orientation = "column";
    mainContainer.alignChildren = ["fill", "top"];
    mainContainer.spacing = 10;
    mainContainer.margins = 10;

    // Función para abrir plantilla
    function openTemplate(name) {
        var file = new File(Folder.desktop + "/Plantillas de Cuadernos/" + name + ".ai");
        if (file.exists) {
            app.open(file);
        } else {
            alert("No se encontró el archivo " + name + ".ai en la carpeta Plantillas de Cuadernos en el escritorio.");
        }
    }

    // Función para crear una sección con título y botones
    function createSection(sectionTitle, templates) {
        // Panel para la sección
        var section = mainContainer.add("panel", undefined, sectionTitle);
        section.orientation = "column";
        section.alignChildren = ["fill", "top"];
        section.spacing = 5;
        section.margins = 10;
        
                    // Agregar botones para cada plantilla
        for (var i = 0; i < templates.length; i++) {
            var template = templates[i];
            var btn = section.add("button", undefined, template + ".ai");
            btn.preferredSize.height = 36;
            
            // Intentamos aplicar el estilo de fuente si está disponible
            try {
                btn.graphics.font = ScriptUI.newFont("Arial", "BOLD", 12);
            } catch(e) {
                // Si falla, continuamos con la fuente predeterminada
            }
            
            // Guardar el nombre de la plantilla para usar en el evento click
            btn.templateName = template;
            
            // Guardar el estado original del botón para restaurarlo después
            btn.originalBg = btn.graphics.backgroundColor;
            
            // Efecto hover - cambiar color al pasar el mouse
            btn.addEventListener('mouseover', function() {
                try {
                    this.graphics.backgroundColor = this.graphics.newBrush(
                        this.graphics.BrushType.SOLID_COLOR,
                        theme.hoverColor
                    );
                    this.notify("onDraw");
                } catch(e) {
                    // Si falla el efecto hover, continuamos
                }
            });
            
            // Restaurar color original al salir el mouse
            btn.addEventListener('mouseout', function() {
                try {
                    this.graphics.backgroundColor = this.originalBg;
                    this.notify("onDraw");
                } catch(e) {
                    // Si falla la restauración, continuamos
                }
            });
            
            // Agregar evento click
            btn.onClick = function() {
                openTemplate(this.templateName);
                win.close();
            };
        }
        
        return section;
    }

    // 1. Sección de Portadas
    createSection("1. PORTADAS", [
        "PORTADA 1 MATERIA ESP",
        "PORTADA 3 MATERIAS ESP",
        "PORTADA 5 MATERIAS ESP",
        "PORTADA 200 PAGINAS",
        "PORTADA TAPA DURA"
    ]);

    // 2. Sección de Internas
    createSection("2. INTERNAS", [
        "INNER 1 MATERIA",
        "INNER 3 MATERIAS",
        "INNER 5 MATERIAS",
        "INNER TAPADURA"
    ]);

    // Pie de página con firma
    var footer = win.add("group");
    footer.alignment = "center";
    footer.margins = [0, 10, 0, 0];

    var signature = footer.add("statictext", undefined, "Script by David Ortiz");
    try {
        signature.graphics.font = ScriptUI.newFont("Arial", "ITALIC", 10);
        signature.graphics.foregroundColor = signature.graphics.newPen(signature.graphics.PenType.SOLID_COLOR, theme.text, 0.8);
    } catch(e) {
        // Si falla la personalización, seguimos con el estilo por defecto
    }

    // Botón de cerrar
    var closeBtn = footer.add("button", undefined, "Cerrar", {name: "cancel"});
    closeBtn.preferredSize = [80, 30];
    closeBtn.onClick = function() { win.close(); };

    // Mostrar el diálogo centrado en la pantalla
    win.center();
    win.show();
})();