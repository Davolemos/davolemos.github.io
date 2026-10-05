// Script: Rasterizar imágenes con presets como botones (vertical)
// Requiere: Documento abierto en Illustrator CS5
#target illustrator

(function () {
  try {
    // Verificar documento abierto y selección
    if (app.documents.length === 0) {
      alert("Error: No hay documentos abiertos.");
      return;
    }
    var doc = app.activeDocument;
    var sel = doc.selection;
    if (!(sel && sel.length > 0)) {
      alert("Error: No hay objetos seleccionados.");
      return;
    }

    // Recopilar elementos PlacedItem y RasterItem
    function collectRasterItems(item) {
      var items = [];
      if (item.typename === 'GroupItem') {
        for (var j = 0; j < item.pageItems.length; j++) {
          items = items.concat(collectRasterItems(item.pageItems[j]));
        }
      } else if (item.typename === 'PlacedItem' || item.typename === 'RasterItem') {
        items.push(item);
      }
      return items;
    }
    var itemsToRaster = [];
    for (var i = 0; i < sel.length; i++) {
      itemsToRaster = itemsToRaster.concat(collectRasterItems(sel[i]));
    }
    if (itemsToRaster.length === 0) {
      alert("No se encontraron elementos rasterizables en la selección.");
      return;
    }

    // Crear ventana de ScriptUI
    var dlg = new Window('dialog', 'Rasterizar Imágenes');
    dlg.alignChildren = 'fill';
    dlg.spacing = 10;
    dlg.margins = [10,10,10,10];

    // Información de elementos a procesar
    dlg.add('statictext', undefined, 'Elementos a rasterizar: ' + itemsToRaster.length);

    // Grupo de botones preset (vertical)
    var presetGroup = dlg.add('group');
    presetGroup.orientation = 'column';
    presetGroup.alignChildren = 'fill';
    presetGroup.spacing = 5;
    var presets = [72, 150, 300, 600, 1200];
    var presetButtons = [];
    for (var p = 0; p < presets.length; p++) {
      (function(res) {
        var btn = presetGroup.add('button', undefined, res + ' DPI');
        btn.preferredSize.width = 100;
        btn.onClick = function() {
          runRaster(res);
        };
        presetButtons.push(btn);
      })(presets[p]);
    }

    // Barra de progreso
    var progBar = dlg.add('progressbar', undefined, 0, itemsToRaster.length);
    progBar.preferredSize.width = 300;
    progBar.visible = false;
    var progText = dlg.add('statictext', undefined, '');

    // Botón cancelar
    var cancelGroup = dlg.add('group');
    cancelGroup.alignment = 'center';
    var cancelBtn = cancelGroup.add('button', undefined, 'Cancelar', { name: 'cancel' });

    // Función principal de rasterizado
    function runRaster(resolution) {
      var options = new RasterizeOptions();
      options.resolution = resolution;
      options.transparency = true;
      options.antiAliasingMethod = AntiAliasingMethod.ARTOPTIMIZED;

      // Desactivar UI
      for (var k = 0; k < presetButtons.length; k++) presetButtons[k].enabled = false;
      cancelBtn.enabled = false;
      progBar.visible = true;
      progBar.value = 0;
      progText.text = 'Procesando 0 de ' + itemsToRaster.length;
      dlg.layout.layout(true);

      var successCount = 0;
      var errorCount = 0;

      for (var i = 0; i < itemsToRaster.length; i++) {
        try {
          doc.rasterize(itemsToRaster[i], itemsToRaster[i].visibleBounds, options);
          successCount++;
        } catch (e) {
          errorCount++;
        }
        progBar.value = i + 1;
        progText.text = 'Procesando ' + progBar.value + ' de ' + itemsToRaster.length;
        dlg.update();
      }

      alert(
        'Rasterizado completado.\n' +
        'Preset: ' + resolution + ' DPI\n' +
        'Total: ' + itemsToRaster.length + '\n' +
        'Éxitos: ' + successCount + '\n' +
        'Fallos: ' + errorCount
      );
      dlg.close();
    }

    dlg.show();

  } catch (err) {
    alert("Error: " + err.message);
  }
})();
