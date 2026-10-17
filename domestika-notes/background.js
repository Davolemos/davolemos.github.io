// Guarda las capturas que manda content.js. Es el único que escribe las
// claves "frames:<curso>" e "img:<id>", para no competir con content.js,
// que escribe "courses".

const MAX_PER_LESSON = 40; // tope de capturas automáticas por lección
const MAX_WIDTH = 1280;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "frame" || !sender.tab) return;
  saveFrame(msg, sender.tab).then(sendResponse, (e) => sendResponse({ error: e.message }));
  return true;
});

// El atajo da permiso temporal (activeTab) para capturar la pestaña, que se
// usa si el video no se puede leer directamente.
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "capture-now") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) chrome.tabs.sendMessage(tab.id, { type: "capture-now" }).catch(() => {});
});

async function saveFrame(msg, tab) {
  const key = `frames:${msg.info.courseKey}`;
  const index = (await chrome.storage.local.get(key))[key] || { title: msg.info.courseTitle, lessons: {} };
  const lesson = (index.lessons[msg.info.lessonKey] ||= {
    title: msg.info.lessonTitle,
    url: msg.info.url,
    items: []
  });
  lesson.title = msg.info.lessonTitle || lesson.title;
  if (!msg.manual && lesson.items.filter((i) => !i.manual).length >= MAX_PER_LESSON) {
    return { skipped: "limit" };
  }

  const image = msg.image || (await captureTab(tab, msg.rect, msg.dpr));
  if (!image) return { skipped: "no-image" };

  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  lesson.items.push({ id, t: msg.t, manual: !!msg.manual });
  lesson.items.sort((a, b) => a.t - b.t);
  await chrome.storage.local.set({ [`img:${id}`]: image, [key]: index });
  return { saved: id };
}

// Plan B: captura de la pestaña recortada al rectángulo del video.
async function captureTab(tab, rect, dpr) {
  if (!rect) return null;
  const shot = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "jpeg", quality: 90 });
  const bitmap = await createImageBitmap(await (await fetch(shot)).blob());
  const x = Math.max(0, Math.round(rect.x * dpr));
  const y = Math.max(0, Math.round(rect.y * dpr));
  const w = Math.min(bitmap.width - x, Math.round(rect.width * dpr));
  const h = Math.min(bitmap.height - y, Math.round(rect.height * dpr));
  if (w < 20 || h < 20) return null;

  const scale = Math.min(1, MAX_WIDTH / w);
  const canvas = new OffscreenCanvas(Math.round(w * scale), Math.round(h * scale));
  canvas.getContext("2d").drawImage(bitmap, x, y, w, h, 0, 0, canvas.width, canvas.height);
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.82 });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return `data:image/jpeg;base64,${btoa(bin)}`;
}
