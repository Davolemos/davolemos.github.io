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

    return { url, courseKey, courseTitle, lessonKey, lessonTitle: heading || url };
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

  // Vía 1: pistas de texto nativas del <video>.
  function watchTextTracks() {
    for (const video of document.querySelectorAll("video")) {
      const tracks = [...video.textTracks].filter(
        (t) => t.kind === "subtitles" || t.kind === "captions"
      );
      if (!tracks.length) continue;

      // Si el usuario ya tiene una pista visible, se usa esa; si no, se
      // activa la primera en modo oculto para que emita cues sin mostrarse.
      const track = tracks.find((t) => t.mode === "showing") || tracks[0];
      if (track.mode === "disabled") track.mode = "hidden";
      if (watchedTracks.has(track)) continue;
      watchedTracks.add(track);

      track.addEventListener("cuechange", () => {
        for (const cue of track.activeCues || []) push(cue.text || "");
      });
    }
  }

  // Vía 2: subtítulos pintados en el DOM por el reproductor.
  const CAPTION_SELECTORS = [
    ".vjs-text-track-display",
    ".jw-captions",
    ".plyr__captions",
    "[class*='caption']",
    "[class*='subtitle']"
  ].join(",");

  const observer = new MutationObserver(() => {
    // Solo mientras hay un video sonando, para no recoger textos estáticos.
    if (!currentVideo() || currentVideo().paused) return;
    const el = document.querySelector(CAPTION_SELECTORS);
    const text = el?.innerText?.trim();
    if (text) push(text);
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
