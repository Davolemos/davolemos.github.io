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
  load();
});

load();
