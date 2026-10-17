const $ = (id) => document.getElementById(id);
let courses = {};   // subtítulos, escritos por content.js
let frames = {};    // índice de capturas por curso, escrito por background.js

function fmt(t) {
  if (t == null) return "--:--";
  const m = Math.floor(t / 60), s = t % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function slug(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "curso";
}

// Une subtítulos y capturas de un curso en una lista ordenada de lecciones.
function lessonsOf(key) {
  const course = courses[key] || { lessons: {} };
  const index = frames[key] || { lessons: {} };
  const keys = new Set([...Object.keys(course.lessons), ...Object.keys(index.lessons)]);
  return [...keys].map((k) => {
    const sub = course.lessons[k], img = index.lessons[k];
    return {
      title: sub?.title || img?.title || k,
      url: sub?.url || img?.url || "",
      order: sub ? sub.order : Infinity,
      lines: sub?.lines || [],
      images: img?.items || []
    };
  }).sort((a, b) => a.order - b.order);
}

function courseTitle(key) {
  return courses[key]?.title || frames[key]?.title || key;
}

// Agrupa las líneas en párrafos de ~1 minuto e intercala las capturas en su
// minuto. imageName(lessonIndex, item) devuelve la ruta de la imagen, o null
// para exportar solo texto.
function toMarkdown(key, imageName) {
  const out = [
    `# ${courseTitle(key)}`,
    "",
    "> Apuntes recogidos para estudio personal. Para destilar en una skill.",
    ""
  ];
  lessonsOf(key).forEach((lesson, li) => {
    out.push(`## ${li + 1}. ${lesson.title}`, "", `<${lesson.url}>`, "");

    const events = [
      ...lesson.lines.map((l) => ({ t: l.t ?? 0, line: l })),
      ...(imageName ? lesson.images.map((i) => ({ t: i.t, image: i })) : [])
    ].sort((a, b) => a.t - b.t || (a.image ? -1 : 1));

    let para = [], start = null;
    const close = () => {
      if (para.length) out.push(`**[${fmt(start)}]** ${para.join(" ")}`, "");
      para = []; start = null;
    };
    for (const e of events) {
      if (e.image) {
        close();
        out.push(`![${fmt(e.t)}](${imageName(li, e.image)})`, "");
        continue;
      }
      if (start != null && e.t - start >= 60) close();
      if (start == null) start = e.t;
      para.push(e.line.text);
    }
    close();
  });
  return out.join("\n");
}

function selectedKey() { return $("course").value; }

function render() {
  const key = selectedKey();
  const list = $("lessons");
  list.innerHTML = "";
  ["copy", "zip", "clear"].forEach((id) => ($(id).disabled = !key));
  if (!key) {
    list.innerHTML = '<li class="empty">Aún no hay nada. Abre una lección, activa los subtítulos y dale play.</li>';
    return;
  }
  for (const lesson of lessonsOf(key)) {
    const li = document.createElement("li");
    const name = document.createElement("span");
    const count = document.createElement("span");
    name.textContent = lesson.title;
    count.textContent = `${lesson.lines.length} líneas · ${lesson.images.length} img`;
    li.append(name, count);
    list.append(li);
  }
}

async function load() {
  const all = await chrome.storage.local.get(null);
  courses = all.courses || {};
  frames = {};
  for (const [k, v] of Object.entries(all)) {
    if (k.startsWith("frames:")) frames[k.slice(7)] = v;
  }
  $("autoFrames").checked = all.settings?.autoFrames !== false;

  const updated = (k) => courses[k]?.updatedAt || 0;
  const keys = [...new Set([...Object.keys(courses), ...Object.keys(frames)])]
    .sort((a, b) => updated(b) - updated(a));
  const sel = $("course");
  sel.innerHTML = "";
  for (const key of keys) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = courseTitle(key);
    sel.append(opt);
  }
  if (all.lastCourseKey && keys.includes(all.lastCourseKey)) sel.value = all.lastCourseKey;
  render();
}

function status(msg) { $("status").textContent = msg; }

// --- ZIP sin compresión (las imágenes ya son JPEG) ------------------------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function makeZip(files) {
  const enc = new TextEncoder();
  const parts = [], central = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);          // nombres en UTF-8
    local.setUint32(14, crc, true);
    local.setUint32(18, f.data.length, true);
    local.setUint32(22, f.data.length, true);
    local.setUint16(26, name.length, true);
    parts.push(local, name, f.data);

    const dir = new DataView(new ArrayBuffer(46));
    dir.setUint32(0, 0x02014b50, true);
    dir.setUint16(4, 20, true);
    dir.setUint16(6, 20, true);
    dir.setUint16(8, 0x0800, true);
    dir.setUint32(16, crc, true);
    dir.setUint32(20, f.data.length, true);
    dir.setUint32(24, f.data.length, true);
    dir.setUint16(28, name.length, true);
    dir.setUint32(42, offset, true);
    central.push(dir, name);
    offset += 30 + name.length + f.data.length;
  }
  const size = central.reduce((n, p) => n + p.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, size, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end], { type: "application/zip" });
}

function dataUrlBytes(dataUrl) {
  const bin = atob(dataUrl.split(",")[1]);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function download(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// --- Acciones ------------------------------------------------------------

$("course").addEventListener("change", render);

$("autoFrames").addEventListener("change", async (e) => {
  const { settings = {} } = await chrome.storage.local.get("settings");
  await chrome.storage.local.set({ settings: { ...settings, autoFrames: e.target.checked } });
  status(e.target.checked ? "Capturas automáticas activadas." : "Capturas automáticas desactivadas.");
});

$("copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText(toMarkdown(selectedKey(), null));
  status("Texto copiado. Pégalo en el chat con Claude.");
});

$("zip").addEventListener("click", async () => {
  const key = selectedKey();
  const name = slug(courseTitle(key));
  const imageName = (li, item) =>
    `img/${String(li + 1).padStart(2, "0")}-${fmt(item.t).replace(":", "")}-${item.id.slice(-4)}.jpg`;

  const files = [];
  const lessons = lessonsOf(key);
  const ids = lessons.flatMap((l) => l.images.map((i) => `img:${i.id}`));
  const stored = ids.length ? await chrome.storage.local.get(ids) : {};
  lessons.forEach((lesson, li) => {
    for (const item of lesson.images) {
      const dataUrl = stored[`img:${item.id}`];
      if (dataUrl) files.push({ name: `${name}/${imageName(li, item)}`, data: dataUrlBytes(dataUrl) });
    }
  });
  const md = new TextEncoder().encode(toMarkdown(key, imageName));
  files.unshift({ name: `${name}/${name}.md`, data: md });

  download(makeZip(files), `${name}.zip`);
  status(`ZIP descargado: ${files.length - 1} imágenes.`);
});

$("clear").addEventListener("click", async () => {
  const key = selectedKey();
  if (!confirm(`¿Borrar todo lo recogido de "${courseTitle(key)}"?`)) return;
  const imgKeys = Object.values(frames[key]?.lessons || {})
    .flatMap((l) => l.items.map((i) => `img:${i.id}`));
  delete courses[key];
  await chrome.storage.local.set({ courses });
  await chrome.storage.local.remove([`frames:${key}`, ...imgKeys]);
  status("Curso borrado.");
  load();
});

// Describe cómo está montado el reproductor en la pestaña activa (en todos
// sus frames) para poder ajustar la captura. No incluye datos de la cuenta.
function inspectPlayer() {
  const short = (str, n = 80) => (str || "").replace(/\s+/g, " ").trim().slice(0, n);
  const videos = [...document.querySelectorAll("video")].map((v) => {
    const r = v.getBoundingClientRect();
    const overlay = [];
    for (const el of document.querySelectorAll("body *")) {
      if (el.children.length || el.contains(v)) continue;
      const er = el.getBoundingClientRect();
      const cx = er.left + er.width / 2, cy = er.top + er.height / 2;
      if (!er.width || cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) continue;
      const text = short(el.innerText);
      if (text) overlay.push({ tag: el.tagName.toLowerCase(), cls: short(el.className?.toString(), 60), text });
      if (overlay.length >= 25) break;
    }
    return {
      paused: v.paused,
      time: Math.round(v.currentTime),
      size: `${Math.round(r.width)}x${Math.round(r.height)}`,
      src: short(v.currentSrc, 60),
      tracks: [...v.textTracks].map((t) => ({
        kind: t.kind, label: t.label, lang: t.language, mode: t.mode, cues: t.cues ? t.cues.length : null
      })),
      trackEls: [...v.querySelectorAll("track")].map((t) => short(t.src, 60)),
      overlay
    };
  });
  return {
    frame: location.href.split("?")[0],
    top: window === window.top,
    videos,
    iframes: [...document.querySelectorAll("iframe")].map((f) => short(f.src, 80)).filter(Boolean)
  };
}

$("diagnose").addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: inspectPlayer
    });
    const report = JSON.stringify(results.map((r) => r.result), null, 2);
    await navigator.clipboard.writeText("Diagnóstico Domestika Notes\n```json\n" + report + "\n```");
    status("Diagnóstico copiado. Pégaselo a Claude.");
  } catch (e) {
    status("No se pudo: " + e.message);
  }
});

load();
