// Recoge los subtítulos de la lección mientras se reproduce y los guarda
// en chrome.storage.local, agrupados por curso y lección.

(() => {
  const FLUSH_MS = 3000;
  const SCAN_MS = 2000;

  let pending = [];
  const watchedTracks = new WeakSet();
  let lastCaptionText = "";
  let activeInfo = null;

  // --- Identificación de curso y lección a partir de la URL ---------------

  function pageInfo() {
    const url = location.href.split("#")[0].split("?")[0];
    const courseMatch = location.pathname.match(/\/courses\/([^/]+)/);
    const unitMatch = location.pathname.match(/\/units\/([^/]+)/);
    const courseKey = courseMatch ? courseMatch[1] : location.hostname + location.pathname;
    const lessonKey = unitMatch ? location.pathname : url;

    const heading =
      document.querySelector("h1")?.textContent?.trim() ||
      document.title.replace(/\s*[|·-]\s*Domestika.*$/i, "").trim();

    const courseTitle = courseMatch
      ? humanize(courseMatch[1].replace(/^\d+-/, ""))
      : heading;

    // En Domestika el h1 es el título del curso; la lección sale de la URL.
    const lessonTitle = unitMatch
      ? humanize(unitMatch[1].replace(/^\d+-/, ""))
      : heading || url;

    return { url, courseKey, courseTitle, lessonKey, lessonTitle };
  }

  function humanize(slug) {
    const s = decodeURIComponent(slug).replace(/[-_]+/g, " ").trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // --- Captura -----------------------------------------------------------

  function currentVideo() {
    const videos = [...document.querySelectorAll("video")];
    return videos.find((v) => !v.paused) || videos[0] || null;
  }

  function push(text) {
    const clean = text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (!clean || clean === lastCaptionText) return;
    lastCaptionText = clean;
    const video = currentVideo();
    pending.push({ t: video ? Math.floor(video.currentTime) : null, text: clean });
  }

  // Vía 1: pistas de texto nativas del <video>. Se sigue una sola pista por
  // video (la visible si la hay) para no mezclar idiomas.
  const chosenTrack = new WeakMap();

  function watchTextTracks() {
    for (const video of document.querySelectorAll("video")) {
      const tracks = [...video.textTracks].filter(
        (t) => t.kind === "subtitles" || t.kind === "captions"
      );
      if (!tracks.length) continue;

      // Si no hay ninguna visible, se activa la primera en modo oculto para
      // que emita cues sin mostrarse.
      const track = tracks.find((t) => t.mode === "showing") || tracks[0];
      if (track.mode === "disabled") track.mode = "hidden";
      chosenTrack.set(video, track);
      if (watchedTracks.has(track)) continue;
      watchedTracks.add(track);

      track.addEventListener("cuechange", () => {
        if (chosenTrack.get(video) !== track) return;
        for (const cue of track.activeCues || []) push(cue.text || "");
      });
    }
  }

  // Vía 2: subtítulos pintados por el reproductor como texto encima del
  // video. Se aceptan textos cortos que cambian mientras el video suena y
  // que caen dentro del rectángulo del video, fuera de los controles.
  const CONTROL_SELECTOR =
    "button, [role='button'], [role='slider'], [role='menu'], [role='menuitem'], input, select, a, time";
  const TIME_RE = /^[\d:\s/.-]+$/;

  function overlapsVideo(el, video) {
    const r = el.getBoundingClientRect();
    const v = video.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    return cx >= v.left && cx <= v.right && cy >= v.top && cy <= v.bottom;
  }

  function overlayText(el, video) {
    if (!el || el === document.body || el.closest(CONTROL_SELECTOR)) return null;
    if (el.contains(video)) return null;
    const text = el.innerText?.trim();
    if (!text || text.length > 300 || TIME_RE.test(text)) return null;
    return overlapsVideo(el, video) ? text : null;
  }

  const observer = new MutationObserver((mutations) => {
    // Solo mientras hay un video sonando, para no recoger textos estáticos.
    const video = currentVideo();
    if (!video || video.paused) return;

    const touched = new Set();
    for (const m of mutations) {
      const node = m.type === "characterData" ? m.target.parentElement : m.target;
      if (node instanceof Element) touched.add(node);
    }
    for (const el of touched) {
      const text = overlayText(el, video);
      if (text) push(text);
    }
  });

  function startObserver() {
    observer.disconnect();
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  // --- Guardado ----------------------------------------------------------

  async function flush(info = activeInfo) {
    if (!pending.length || !info) return;
    const batch = pending;
    pending = [];

    const { courses = {} } = await chrome.storage.local.get("courses");
    const course = (courses[info.courseKey] ||= {
      title: info.courseTitle,
      createdAt: Date.now(),
      lessons: {}
    });
    const lesson = (course.lessons[info.lessonKey] ||= {
      title: info.lessonTitle,
      url: info.url,
      order: Object.keys(course.lessons).length,
      lines: []
    });
    lesson.title = info.lessonTitle || lesson.title;

    const seen = new Set(lesson.lines.map((l) => l.text));
    for (const line of batch) {
      if (!seen.has(line.text)) {
        lesson.lines.push(line);
        seen.add(line.text);
      }
    }
    lesson.lines.sort((a, b) => (a.t ?? 0) - (b.t ?? 0));
    course.updatedAt = Date.now();

    await chrome.storage.local.set({ courses, lastCourseKey: info.courseKey });
  }

  // --- Ciclo de vida (Domestika navega sin recargar la página) -----------

  // Lo pendiente se guarda con la lección donde se capturó, antes de
  // pasar a la siguiente.
  let lastUrl = location.href;
  activeInfo = pageInfo();
  setInterval(() => {
    if (location.href !== lastUrl) {
      flush(activeInfo);
      lastUrl = location.href;
      lastCaptionText = "";
      activeInfo = pageInfo();
    } else {
      // El título puede cargarse tarde en navegación sin recarga.
      activeInfo = pageInfo();
    }
    watchTextTracks();
  }, SCAN_MS);

  setInterval(() => flush(), FLUSH_MS);
  window.addEventListener("pagehide", () => flush());

  if (document.body) startObserver();
  watchTextTracks();
})();
