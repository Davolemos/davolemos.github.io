// ARG Workflow — lógica del panel (lado HTML/JS, corre en el navegador de CEP).
(function () {
  "use strict";

  var cep = window.__adobe_cep__;
  var lista = document.getElementById("lista");
  var estado = document.getElementById("estado");
  var buscar = document.getElementById("buscar");

  function setEstado(txt, esError, ocupadoAhora) {
    estado.textContent = txt;
    estado.className = esError ? "error" : (ocupadoAhora ? "ocupado" : "");
    estado.title = txt;
  }
  function q(s) { return JSON.stringify(String(s)); }
  function nfc(s) { return typeof s.normalize === "function" ? s.normalize("NFC") : s; }

  if (!cep) {
    setEstado("Este panel solo funciona dentro de Illustrator.", true);
    return;
  }

  // ── Ruta de la extensión (algunas versiones la devuelven como URL file://) ──
  var extPath = cep.getSystemPath("extension");
  if (extPath.indexOf("file://") === 0) {
    extPath = decodeURI(extPath.replace(/^file:\/\/\/?/, navigator.platform.indexOf("Win") === 0 ? "" : "/"));
  }

  // ── Configuración: botones.js del plugin + botones.js personal (opcional) ──
  function configBase() {
    var c = (typeof ARG_CONFIG === "object" && ARG_CONFIG) ? ARG_CONFIG : {};
    return { nombres: c.nombres || {}, iconos: c.iconos || {}, cadenas: (c.cadenas || []).slice() };
  }
  function mezclarConfigUsuario(cfg, codigo) {
    if (!codigo) { return cfg; }
    try {
      var u = new Function(codigo + "\n;return (typeof ARG_CONFIG === 'object' && ARG_CONFIG) ? ARG_CONFIG : {};")();
      var k;
      for (k in (u.nombres || {})) { if (u.nombres.hasOwnProperty(k)) { cfg.nombres[nfc(k)] = u.nombres[k]; } }
      for (k in (u.iconos || {})) { if (u.iconos.hasOwnProperty(k)) { cfg.iconos[nfc(k)] = u.iconos[k]; } }
      (u.cadenas || []).forEach(function (c) { cfg.cadenas.push(c); });
    } catch (e) {
      setEstado("Error en Documentos/ARG Workflow/botones.js: " + e.message, true);
    }
    return cfg;
  }
  function nombresNFC(cfg) {
    var out = {}, ic = {}, k;
    for (k in cfg.nombres) { if (cfg.nombres.hasOwnProperty(k)) { out[nfc(k)] = cfg.nombres[k]; } }
    for (k in cfg.iconos) { if (cfg.iconos.hasOwnProperty(k)) { ic[nfc(k)] = cfg.iconos[k]; } }
    cfg.nombres = out; cfg.iconos = ic;
    return cfg;
  }

  // "02 Edicion" -> "Edicion"; "Replace_Text.jsx" -> "Replace Text"
  function nombreBonito(nombreArchivo, cfg) {
    var k = nfc(nombreArchivo);
    if (cfg.nombres[k]) { return cfg.nombres[k]; }
    return k.replace(/\.(jsx|js)$/i, "").replace(/^\d+[\s._-]+/, "").replace(/[_-]+/g, " ").trim();
  }
  function claveOrden(nombreCarpeta) {
    return nombreCarpeta === "" ? "￿" : nfc(nombreCarpeta).toLowerCase();
  }

  // ── Construcción de grupos a partir del listado del host ──
  // items: [{ n: archivo, g: carpeta ("" = raíz), s: "plugin"|"usuario", u: uri }]
  function construirGrupos(items, cfg) {
    var porArchivo = {}, grupos = {}, orden = [];

    items.forEach(function (it) {
      var n = nfc(it.n), g = nfc(it.g);
      // Si el mismo archivo está en el plugin y en la carpeta personal, manda el personal.
      if (porArchivo[n] && porArchivo[n].s === "usuario" && it.s !== "usuario") { return; }
      porArchivo[n] = it;
      if (!grupos[g]) { grupos[g] = { carpeta: g, titulo: g === "" ? "Otros" : nombreBonito(g, cfg), botones: [] }; orden.push(g); }
    });

    Object.keys(porArchivo).forEach(function (n) {
      var it = porArchivo[n];
      grupos[nfc(it.g)].botones.push({
        nombre: nombreBonito(n, cfg), archivo: n, uri: it.u, usuario: it.s === "usuario",
        icono: cfg.iconos[n] || cfg.iconos[nfc(it.g)] || "script",
        detalle: n + (it.s === "usuario" ? "  (carpeta personal)" : "")
      });
    });

    // Cadenas: varios scripts seguidos. Van al grupo "Cadenas" salvo que indiquen otro.
    cfg.cadenas.forEach(function (c) {
      if (!c || !c.nombre || !(c.scripts instanceof Array) || !c.scripts.length) { return; }
      var pasos = [], faltan = [];
      c.scripts.forEach(function (s) {
        var it = porArchivo[nfc(s)];
        if (it) { pasos.push({ nombre: nombreBonito(nfc(s), cfg), uri: it.u }); } else { faltan.push(s); }
      });
      var g = c.grupo ? nfc(c.grupo) : "Cadenas";
      if (!grupos[g]) { grupos[g] = { carpeta: g, titulo: nombreBonito(g, cfg), botones: [] }; orden.push(g); }
      grupos[g].botones.push({
        nombre: c.nombre, cadena: pasos, faltan: faltan, icono: c.icono || "cadena",
        detalle: c.scripts.join("  →  ") + (faltan.length ? "\nNo encontrados: " + faltan.join(", ") : "")
      });
    });

    orden.sort(function (a, b) { return claveOrden(a) < claveOrden(b) ? -1 : claveOrden(a) > claveOrden(b) ? 1 : 0; });
    return orden.map(function (g) {
      grupos[g].botones.sort(function (a, b) { return a.nombre.localeCompare(b.nombre); });
      return grupos[g];
    });
  }

  // ── Ejecución ──
  var ocupado = false;

  function evalHost(codigo, cb) {
    cep.evalScript(codigo, function (res) { cb(String(res === undefined || res === null ? "" : res)); });
  }

  function ejecutarUno(nombre, uri, cb) {
    setEstado("Ejecutando: " + nombre + "…", false, true);
    evalHost("argRun(" + q(uri) + ")", function (res) {
      if (res === "OK") { cb(null); }
      else if (res.indexOf("ERR|") === 0) { cb(res.substring(4)); }
      else { cb("no se pudo ejecutar (" + res + ")"); }
    });
  }

  function ejecutar(btn, item) {
    if (ocupado) { return; }
    if (item.faltan && item.faltan.length) {
      setEstado(item.nombre + ": faltan scripts: " + item.faltan.join(", "), true);
      return;
    }
    ocupado = true;
    btn.className += " activo";
    var pasos = item.cadena ? item.cadena.slice() : [{ nombre: item.nombre, uri: item.uri }];
    var total = pasos.length, hechos = 0;

    (function siguiente() {
      if (!pasos.length) {
        ocupado = false;
        btn.className = btn.className.replace(/\s*activo/, "");
        setEstado("Listo · " + item.nombre + (total > 1 ? " (" + total + " pasos)" : ""));
        return;
      }
      var p = pasos.shift();
      hechos++;
      ejecutarUno(total > 1 ? item.nombre + " " + hechos + "/" + total + " · " + p.nombre : p.nombre, p.uri, function (err) {
        if (err) {
          ocupado = false;
          btn.className = btn.className.replace(/\s*activo/, "");
          setEstado((total > 1 ? item.nombre + " (paso " + hechos + ", " + p.nombre + ")" : p.nombre) + ": " + err, true);
          return;
        }
        siguiente();
      });
    })();
  }

  // ── Iconos (SVG monolínea, color = acento) ──
  var ICONOS = {
    plantilla: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>',
    cuaderno:  '<path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><path d="M5 8h3M5 12h3M5 16h3"/>',
    texto:     '<path d="M5 6h14M12 6v13M9 19h6"/>',
    color:     '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    pantone:   '<rect x="4" y="3" width="7" height="18" rx="1.5"/><path d="M11 7l5.5-2.5 3 7.5-8.5 4"/><path d="M11 17h8.5a1.5 1.5 0 0 1 0 3H11"/>',
    negro:     '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17A8.5 8.5 0 0 0 12 3.5z" fill="currentColor"/>',
    imagen:    '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-8 8"/>',
    revisar:   '<path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M14 3v5h5"/><path d="M8.5 14.5l2.5 2.5 4.5-5"/>',
    paquete:   '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
    pdf:       '<path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M14 3v5h5M8 13h8M8 17h5"/>',
    exportar:  '<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    cadena:    '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2"/>',
    script:    '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>'
  };
  function svgIcono(nombre) {
    var d = ICONOS[nombre] || ICONOS.script;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  }

  // ── Pintado y filtro ──
  var gruposActuales = [];
  var grupoActivo = null;   // null = todos
  var chips = document.getElementById("chips");

  function pintarChips() {
    chips.innerHTML = "";
    var todos = [{ carpeta: null, titulo: "Todos" }].concat(gruposActuales);
    todos.forEach(function (g) {
      var c = document.createElement("button");
      c.className = "chip" + (g.carpeta === grupoActivo ? " activo" : "");
      c.textContent = g.titulo;
      c.onclick = function () { grupoActivo = g.carpeta; pintarChips(); pintar(); };
      chips.appendChild(c);
    });
    chips.style.display = gruposActuales.length > 1 ? "" : "none";
  }

  function pintar() {
    var filtro = buscar.value.trim().toLowerCase();
    lista.innerHTML = "";
    var n = 0;
    gruposActuales.forEach(function (g) {
      if (grupoActivo !== null && g.carpeta !== grupoActivo) { return; }
      var visibles = g.botones.filter(function (b) {
        return !filtro || b.nombre.toLowerCase().indexOf(filtro) >= 0 || (b.archivo || "").toLowerCase().indexOf(filtro) >= 0;
      });
      if (!visibles.length) { return; }
      if (grupoActivo === null) {
        var h = document.createElement("h2");
        h.textContent = g.titulo;
        lista.appendChild(h);
      }
      var grid = document.createElement("div");
      grid.className = "grid";
      visibles.forEach(function (item) {
        var b = document.createElement("button");
        b.className = "card" + (item.cadena ? " cadena" : "") + (item.usuario ? " usuario" : "");
        b.innerHTML = '<span class="ico">' + svgIcono(item.icono) + '</span><span class="lbl"></span>';
        b.querySelector(".lbl").textContent = item.nombre;
        b.title = item.nombre + "\n" + item.detalle;
        b.onclick = function () { ejecutar(b, item); };
        grid.appendChild(b);
        n++;
      });
      lista.appendChild(grid);
    });
    if (!n) {
      var v = document.createElement("div");
      v.id = "vacio";
      v.textContent = filtro ? "Ningún script coincide con «" + buscar.value.trim() + "»."
        : "No hay scripts. Copia tus .js / .jsx a la carpeta personal y pulsa recargar.";
      lista.appendChild(v);
    }
  }
  buscar.addEventListener("input", pintar);

  function recargar() {
    setEstado("Leyendo scripts…");
    evalHost("argList(" + q(extPath) + ")", function (res) {
      var datos;
      try { datos = JSON.parse(res); } catch (e) {
        setEstado("No se pudo leer la lista de scripts: " + res, true);
        return;
      }
      evalHost("argUserConfig()", function (codigo) {
        if (codigo.indexOf("EvalScript error") === 0) { codigo = ""; }
        var cfg = nombresNFC(mezclarConfigUsuario(configBase(), codigo));
        gruposActuales = construirGrupos(datos.items || [], cfg);
        if (grupoActivo !== null && !gruposActuales.some(function (g) { return g.carpeta === grupoActivo; })) { grupoActivo = null; }
        pintarChips();
        pintar();
        if (estado.className !== "error") {
          var total = (datos.items || []).length;
          setEstado(total + (total === 1 ? " script listo" : " scripts listos"));
          estado.title = "Scripts personales: " + datos.userFolder;
        }
        document.getElementById("btnCarpeta").title = "Abrir la carpeta de scripts personales\n" + datos.userFolder;
      });
    });
  }

  document.getElementById("btnRecargar").onclick = recargar;
  document.getElementById("btnCarpeta").onclick = function () {
    evalHost("argOpenUserFolder()", function (res) {
      if (res.indexOf("ERR|") === 0) { setEstado(res.substring(4), true); }
    });
  };

  recargar();
})();
