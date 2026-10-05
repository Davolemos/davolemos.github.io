// ARG Workflow — lado ExtendScript (corre dentro de Illustrator).
// El panel (index.html / panel.js) llama a estas funciones con evalScript.
//
//   argList(extPath)        -> JSON con todos los scripts encontrados
//   argRun(uri)             -> ejecuta un script; devuelve "OK" o "ERR|mensaje"
//   argUserConfig()         -> contenido de ~/Documents/ARG Workflow/botones.js (o "")
//   argOpenUserFolder()     -> crea (si hace falta) y abre la carpeta personal de scripts

// ── JSON para ExtendScript (ES3 no lo trae; algunos scripts lo usan) ──
if (typeof JSON === "undefined") { JSON = {}; }
if (typeof JSON.stringify !== "function") {
    JSON.stringify = function (v) {
        var t = typeof v, i, out;
        if (v === null || t === "undefined" || t === "function") { return "null"; }
        if (t === "number") { return isFinite(v) ? String(v) : "null"; }
        if (t === "boolean") { return String(v); }
        if (t === "string") {
            return '"' + v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")
                .replace(/\r/g, "\\r").replace(/\t/g, "\\t") + '"';
        }
        if (v instanceof Array) {
            out = [];
            for (i = 0; i < v.length; i++) { out.push(JSON.stringify(v[i])); }
            return "[" + out.join(",") + "]";
        }
        out = [];
        for (i in v) {
            if (v.hasOwnProperty(i) && typeof v[i] !== "function" && typeof v[i] !== "undefined") {
                out.push(JSON.stringify(String(i)) + ":" + JSON.stringify(v[i]));
            }
        }
        return "{" + out.join(",") + "}";
    };
}
if (typeof JSON.parse !== "function") {
    JSON.parse = function (s) { return eval("(" + s + ")"); };
}

// ── Rutas ──
var ARG_USER_DIR_NAME = "ARG Workflow";

function argUserFolder() {
    return new Folder(Folder.myDocuments + "/" + ARG_USER_DIR_NAME);
}
function argUserScriptsFolder() {
    return new Folder(argUserFolder().fsName + "/scripts");
}
function argBundledScriptsFolder(extPath) {
    return new Folder(extPath + "/scripts");
}

function argIsScript(f) {
    return (f instanceof File) && /\.(jsx|js)$/i.test(f.name) && f.name.charAt(0) !== ".";
}

// Recorre una carpeta: los scripts de la raíz van al grupo "" (el panel los
// muestra como "Otros"); los de cada subcarpeta van al grupo con ese nombre.
function argScan(folder, source, out) {
    if (!folder.exists) { return; }
    var entries = folder.getFiles(), i, e;
    for (i = 0; i < entries.length; i++) {
        e = entries[i];
        if (e.name.charAt(0) === ".") { continue; }
        if (e instanceof Folder) {
            var sub = e.getFiles(), j;
            for (j = 0; j < sub.length; j++) {
                if (argIsScript(sub[j])) {
                    out.push({ n: decodeURI(sub[j].name), g: decodeURI(e.name), s: source, u: sub[j].absoluteURI });
                }
            }
        } else if (argIsScript(e)) {
            out.push({ n: decodeURI(e.name), g: "", s: source, u: e.absoluteURI });
        }
    }
}

function argList(extPath) {
    var items = [];
    argScan(argBundledScriptsFolder(extPath), "plugin", items);
    argScan(argUserScriptsFolder(), "usuario", items);
    return JSON.stringify({
        userFolder: argUserScriptsFolder().fsName,
        bundledFolder: argBundledScriptsFolder(extPath).fsName,
        items: items
    });
}

function argUserConfig() {
    var f = new File(argUserFolder().fsName + "/botones.js");
    if (!f.exists) { return ""; }
    f.encoding = "UTF-8";
    if (!f.open("r")) { return ""; }
    var code = f.read();
    f.close();
    return code;
}

function argOpenUserFolder() {
    var folder = argUserScriptsFolder();
    if (!folder.exists) { folder.create(); }
    if (!folder.exists) { return "ERR|No se pudo crear " + folder.fsName; }
    folder.execute();
    return "OK";
}

// Ejecuta un script en su propio ámbito, para que las variables de un script
// no choquen con las de otro. El código se lee en cada clic, así que editar
// un script en disco se aplica de inmediato.
function argRun(uri) {
    var __f = new File(uri);
    if (!__f.exists) { return "ERR|No se encontró el archivo: " + decodeURI(__f.name); }
    __f.encoding = "UTF-8";
    if (!__f.open("r")) { return "ERR|No se pudo abrir: " + decodeURI(__f.name); }
    var __code = __f.read();
    __f.close();
    // Las directivas #target / #targetengine no son válidas dentro de eval.
    __code = __code.replace(/^﻿/, "").replace(/^([ \t]*#target.*)$/gm, "//$1");
    try {
        (function () { eval(__code); })();
        return "OK";
    } catch (e) {
        return "ERR|" + e.message + (e.line ? " (línea " + e.line + ")" : "");
    }
}
