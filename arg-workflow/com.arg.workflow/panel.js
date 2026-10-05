// ARG Workflow — lógica del panel (lado HTML/JS, corre en el navegador de CEP).
(function () {
  "use strict";

  var cep = window.__adobe_cep__;
  var lista = document.getElementById("lista");
  var estado = document.getElementById("estado");
  var buscar = document.getElementById("buscar");

  function setEstado(txt, esError) {
    estado.textContent = txt;
    estado.className = esError ? "error" : "";
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

  // ── Tema: sigue el brillo de la interfaz de Illustrator ──
  function aplicarTema() {
    try {
      var c = JSON.parse(cep.getHostEnvironment()).appSkinInfo.panelBackgroundColor.color;
      document.body.style.background = "rgb(" + Math.round(c.red) + "," + Math.round(c.green) + "," + Math.round(c.blue) + ")";
      var lum = 0.299 * c.red + 0.587 * c.green + 0.114 * c.blue;
      document.body.className = lum > 140 ? "claro" : "";
    } catch (e) {}
  }
  aplicarTema();
  try { cep.addEventListener("com.adobe.csxs.events.ThemeColorChanged", aplicarTema); } catch (e) {}

  // ── Configuración: botones.js del plugin + botones.js personal (opcional) ──
  function configBase() {
    var c = (typeof ARG_CONFIG === "object" && ARG_CONFIG) ? ARG_CONFIG : {};
    return { nombres: c.nombres || {}, cadenas: (c.cadenas || []).slice() };
  }
  function mezclarConfigUsuario(cfg, codigo) {
    if (!codigo) { return cfg; }
    try {
      var u = new Function(codigo + "\n;return (typeof ARG_CONFIG === 'object' && ARG_CONFIG) ? ARG_CONFIG : {};")();
      var k;
      for (k in (u.nombres || {})) { if (u.nombres.hasOwnProperty(k)) { cfg.nombres[nfc(k)] = u.nombres[k]; } }
      (u.cadenas || []).forEach(function (c) { cfg.cadenas.push(c); });
    } catch (e) {
      setEstado("Error en Documentos/ARG Workflow/botones.js: " + e.message, true);
    }
    return cfg;
  }
  function nombresNFC(cfg) {
    var out = {}, k;
    for (k in cfg.nombres) { if (cfg.nombres.hasOwnProperty(k)) { out[nfc(k)] = cfg.nombres[k]; } }
    cfg.nombres = out;
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
        nombre: c.nombre, cadena: pasos, faltan: faltan,
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
    setEstado("Ejecutando: " + nombre + "…");
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

  // ── Pintado y filtro ──
  var gruposActuales = [];

  function pintar() {
    var filtro = buscar.value.trim().toLowerCase();
    lista.innerHTML = "";
    var n = 0;
    gruposActuales.forEach(function (g) {
      var visibles = g.botones.filter(function (b) {
        return !filtro || b.nombre.toLowerCase().indexOf(filtro) >= 0 || (b.archivo || "").toLowerCase().indexOf(filtro) >= 0;
      });
      if (!visibles.length) { return; }
      var h = document.createElement("h2");
      h.textContent = g.titulo;
      lista.appendChild(h);
      visibles.forEach(function (item) {
        var b = document.createElement("button");
        b.className = "item" + (item.cadena ? " cadena" : "") + (item.usuario ? " usuario" : "");
        b.textContent = item.nombre;
        b.title = item.nombre + "\n" + item.detalle;
        b.onclick = function () { ejecutar(b, item); };
        lista.appendChild(b);
        n++;
      });
    });
    if (!n) {
      var v = document.createElement("div");
      v.id = "vacio";
      v.textContent = filtro ? "Ningún script coincide con «" + buscar.value.trim() + "»."
        : "No hay scripts. Copia tus .js / .jsx a la carpeta 📂 y pulsa ↻.";
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
        pintar();
        if (estado.className !== "error") {
          var total = (datos.items || []).length;
          setEstado(total + (total === 1 ? " script" : " scripts") + " · personal: " + datos.userFolder);
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
