const $ = (id) => document.getElementById(id);
let courses = {};

function fmt(t) {
  if (t == null) return "--:--";
  const m = Math.floor(t / 60), s = t % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function sortedLessons(course) {
  return Object.values(course.lessons).sort((a, b) => a.order - b.order);
}

// Agrupa las líneas en párrafos de ~1 minuto para que el texto se lea bien.
function toMarkdown(course) {
  const out = [
    `# ${course.title}`,
    "",
    "> Subtítulos recogidos para estudio personal. Para destilar en una skill.",
    ""
  ];
  sortedLessons(course).forEach((lesson, i) => {
    out.push(`## ${i + 1}. ${lesson.title}`, "", `<${lesson.url}>`, "");
    let para = [], start = null;
    const close = () => {
      if (para.length) out.push(`**[${fmt(start)}]** ${para.join(" ")}`, "");
      para = []; start = null;
    };
    for (const line of lesson.lines) {
      if (start != null && line.t != null && line.t - start >= 60) close();
      if (start == null) start = line.t;
      para.push(line.text);
    }
    close();
  });
  return out.join("\n");
}

function slug(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "curso";
}

function selected() { return courses[$("course").value]; }

function render() {
  const course = selected();
  const list = $("lessons");
  list.innerHTML = "";
  const disabled = !course;
  ["copy", "download", "clear"].forEach((id) => ($(id).disabled = disabled));
  if (!course) {
    list.innerHTML = '<li class="empty">Aún no hay nada. Abre una lección con subtítulos y dale play.</li>';
    return;
  }
  for (const lesson of sortedLessons(course)) {
    const li = document.createElement("li");
    const name = document.createElement("span");
    const count = document.createElement("span");
    name.textContent = lesson.title;
    count.textContent = `${lesson.lines.length} líneas`;
    li.append(name, count);
    list.append(li);
  }
}

async function load() {
  const data = await chrome.storage.local.get(["courses", "lastCourseKey"]);
  courses = data.courses || {};
  const sel = $("course");
  sel.innerHTML = "";
  const keys = Object.keys(courses).sort((a, b) => (courses[b].updatedAt || 0) - (courses[a].updatedAt || 0));
  for (const key of keys) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = courses[key].title;
    sel.append(opt);
  }
  if (data.lastCourseKey && courses[data.lastCourseKey]) sel.value = data.lastCourseKey;
  render();
}

function status(msg) { $("status").textContent = msg; }

$("course").addEventListener("change", render);

$("copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText(toMarkdown(selected()));
  status("Copiado. Pégalo en el chat con Claude.");
});

$("download").addEventListener("click", () => {
  const course = selected();
  const blob = new Blob([toMarkdown(course)], { type: "text/markdown" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${slug(course.title)}.md`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  status("Descargado.");
});

$("clear").addEventListener("click", async () => {
  const course = selected();
  if (!confirm(`¿Borrar todo lo recogido de "${course.title}"?`)) return;
  delete courses[$("course").value];
  await chrome.storage.local.set({ courses });
  status("Curso borrado.");
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
