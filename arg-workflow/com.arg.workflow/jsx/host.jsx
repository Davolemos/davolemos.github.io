// ARG Workflow — lado ExtendScript (corre dentro de Illustrator).
// El panel (index.html / panel.js) llama a estas funciones con evalScript.
//
//   argList(extPath)        -> sincroniza los scripts de fábrica a Documentos y
//                              devuelve JSON con todos los scripts encontrados
//   argRun(uri)             -> ejecuta un script; devuelve "OK" o "ERR|mensaje"
//   argUserConfig()         -> contenido de Documentos/ARG Workflow/botones.js (o "")
//   argOpenUserFolder()     -> crea (si hace falta) y abre Documentos/ARG Workflow/scripts
//   argRepararMotor()       -> mata (en 1 s) el proceso CEPHtmlEngine de este panel para
//                              que Illustrator lo cree de nuevo al reabrir el panel

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
// Todos los scripts viven en Documentos/ARG Workflow/scripts. Es una carpeta
// del usuario, así que no depende de la versión de Illustrator ni del plugin.
// Al abrirse, el panel copia ahí los scripts "de fábrica" que falten.
function argUserFolder() {
    return new Folder(Folder.myDocuments.fsName + "/ARG Workflow");
}
function argUserScriptsFolder() {
    return new Folder(argUserFolder().fsName + "/scripts");
}
function argBundledScriptsFolder(extPath) {
    return new Folder(extPath + "/scripts");
}

function argIsScript(f) {
    return (f instanceof File) && /\.(jsx|js)$/i.test(f.name) && f.name.charAt(0) !== "."
        && decodeURI(f.name).toLowerCase() !== "botones.js";
}

// Copia un script de fábrica a la carpeta del usuario si no existe allí, o si
// la versión de fábrica es más reciente (actualización del plugin).
function argCopyIfNeeded(src, dstFolder) {
    if (!dstFolder.exists) { dstFolder.create(); }
    var dst = new File(dstFolder.fsName + "/" + decodeURI(src.name));
    if (dst.exists && dst.modified >= src.modified) { return false; }
    return src.copy(dst.fsName) ? true : false;
}

// Sincroniza plugin/scripts -> Documentos/ARG Workflow/scripts. Devuelve cuántos copió.
function argSync(extPath) {
    var src = argBundledScriptsFolder(extPath), dst = argUserScriptsFolder(), n = 0, i, j;
    if (!argUserFolder().exists) { argUserFolder().create(); }
    if (!dst.exists) { dst.create(); }
    if (!src.exists || !dst.exists) { return n; }
    var entries = src.getFiles();
    for (i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (e.name.charAt(0) === ".") { continue; }
        if (e instanceof Folder) {
            var sub = e.getFiles();
            for (j = 0; j < sub.length; j++) {
                if (argIsScript(sub[j]) && argCopyIfNeeded(sub[j], new Folder(dst.fsName + "/" + decodeURI(e.name)))) { n++; }
            }
        } else if (argIsScript(e) && argCopyIfNeeded(e, dst)) {
            n++;
        }
    }
    // botones.js de usuario: se crea una plantilla comentada si no existe.
    var cfg = new File(argUserFolder().fsName + "/botones.js");
    if (!cfg.exists) {
        cfg.encoding = "UTF-8";
        if (cfg.open("w")) {
            cfg.write(
                "// ARG Workflow - ajustes personales (opcional).\n" +
                "// Se combina con el botones.js del plugin: lo que pongas aqui manda.\n" +
                "// Nombres e iconos: la clave es el nombre exacto del archivo o carpeta.\n" +
                "// Iconos disponibles: plantilla, cuaderno, texto, color, pantone, negro,\n" +
                "// imagen, revisar, paquete, pdf, exportar, vector, cadena, script.\n" +
                "var ARG_CONFIG = {\n" +
                "  nombres: {\n" +
                "    // \"Mi_script.jsx\": \"Mi script\"\n" +
                "  },\n" +
                "  iconos: {\n" +
                "    // \"Mi_script.jsx\": \"texto\"\n" +
                "  },\n" +
                "  cadenas: [\n" +
                "    // { nombre: \"Artefinalizar + empaquetar\", scripts: [\"Artefinalizador-v3.jsx\", \"EMPAQUETADO-EXPRESS.js\"] }\n" +
                "  ]\n" +
                "};\n");
            cfg.close();
        }
    }
    return n;
}

// Recorre la carpeta de scripts: los de la raíz van al grupo "" (el panel los
// muestra como "Otros"); los de cada subcarpeta van al grupo con ese nombre.
function argScan(folder, out) {
    if (!folder.exists) { return; }
    var entries = folder.getFiles(), i, e;
    for (i = 0; i < entries.length; i++) {
        e = entries[i];
        if (e.name.charAt(0) === ".") { continue; }
        if (e instanceof Folder) {
            var sub = e.getFiles(), j;
            for (j = 0; j < sub.length; j++) {
                if (argIsScript(sub[j])) {
                    out.push({ n: decodeURI(sub[j].name), g: decodeURI(e.name), u: sub[j].absoluteURI });
                }
            }
        } else if (argIsScript(e)) {
            out.push({ n: decodeURI(e.name), g: "", u: e.absoluteURI });
        }
    }
}

function argList(extPath) {
    var copiados = 0;
    try { copiados = argSync(extPath); } catch (e) { copiados = -1; }
    var items = [];
    argScan(argUserScriptsFolder(), items);
    return JSON.stringify({
        userFolder: argUserScriptsFolder().fsName,
        copiados: copiados,
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
    if (!folder.exists) { argUserFolder().create(); folder.create(); }
    if (!folder.exists) { return "ERR|No se pudo crear " + folder.fsName; }
    folder.execute();
    return "OK";
}

// Bug conocido de Adobe (Illustrator 2026 / CEP 12.1 / Apple Silicon): a veces el
// panel se queda gris porque su proceso de dibujo (CEPHtmlEngine) nunca llega a
// presentar el contenido, y ese proceso sobrevive a cerrar y abrir el panel.
// Cada extensión tiene su propio CEPHtmlEngine, así que matar solo el nuestro
// obliga a Illustrator a crear uno nuevo al reabrir el panel, sin reiniciar.
// El patrón [C]EPHtmlEngine evita que el comando se mate a sí mismo.
function argRepararMotor() {
    try {
        if ($.os.indexOf("Windows") === 0) {
            system.callSystem('cmd.exe /c start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep 1; Get-CimInstance Win32_Process | Where-Object { $_.Name -eq \'CEPHtmlEngine.exe\' -and $_.CommandLine -like \'*com.arg.workflow*\' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"');
        } else {
            system.callSystem("/bin/sh -c \"(sleep 1; pkill -f '[C]EPHtmlEngine.*com[.]arg[.]workflow') >/dev/null 2>&1 &\"");
        }
        return "OK";
    } catch (e) {
        return "ERR|" + e.message;
    }
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
