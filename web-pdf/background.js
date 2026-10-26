// Guarda la pestaña como PDF con Page.printToPDF (protocolo de DevTools):
// texto seleccionable, enlaces que funcionan e imágenes a su resolución.
//
// 1. Recorre la página para que carguen las imágenes perezosas.
// 2. Congela las alturas que dependen de la ventana (100vh y similares),
//    que al imprimir se medirían contra la hoja y se estirarían.
// 3. Imprime con el aspecto de pantalla, no con el CSS de impresión.

const MAX_PAGE_PX = 19200; // ~200 pulgadas, el límite de muchos lectores de PDF
const A4 = { width: 8.27, height: 11.69, margin: 0.4 };

let busy = false;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "save-pdf" && !busy) savePdf(msg.tabId, msg.mode);
});

function report(text, done = false) {
  chrome.runtime.sendMessage({ type: "pdf-status", text, done }).catch(() => {});
  chrome.action.setBadgeText({ text: done ? "" : "…" });
}

async function inPage(tabId, func, args = []) {
  const [res] = await chrome.scripting.executeScript({ target: { tabId }, func, args });
  return res?.result;
}

async function savePdf(tabId, mode) {
  busy = true;
  const target = { tabId };
  let attached = false;
  try {
    report("Cargando imágenes…");
    const page = await inPage(tabId, loadEverything);

    await chrome.debugger.attach(target, "1.3");
    attached = true;
    const cdp = (method, params = {}) => chrome.debugger.sendCommand(target, method, params);

    // Mide con la ventana real, luego con una ventana más alta: lo que
    // cambie de altura depende de la ventana y se congela al valor real.
    report("Ajustando el diseño…");
    await inPage(tabId, measureHeights);
    await cdp("Emulation.setDeviceMetricsOverride", {
      width: page.width, height: page.viewportHeight + 400, deviceScaleFactor: 0, mobile: false
    });
    await new Promise((r) => setTimeout(r, 400));
    const fullHeight = await inPage(tabId, freezeHeights);
    await cdp("Emulation.clearDeviceMetricsOverride");
    await cdp("Emulation.setEmulatedMedia", { media: "screen" });

    report("Generando el PDF…");
    const common = { printBackground: true, preferCSSPageSize: false, generateDocumentOutline: true };
    const options = mode === "a4"
      ? {
          ...common,
          paperWidth: A4.width, paperHeight: A4.height,
          marginTop: A4.margin, marginBottom: A4.margin, marginLeft: A4.margin, marginRight: A4.margin,
          scale: clamp(((A4.width - 2 * A4.margin) * 96) / page.width, 0.1, 2)
        }
      : {
          ...common,
          paperWidth: page.width / 96,
          paperHeight: Math.min(fullHeight, MAX_PAGE_PX) / 96,
          marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0
        };
    const { data } = await cdp("Page.printToPDF", options);

    await chrome.debugger.detach(target);
    attached = false;
    await inPage(tabId, restorePage);

    await chrome.downloads.download({
      url: `data:application/pdf;base64,${data}`,
      filename: `${fileName(page.title)}.pdf`
    });
    report("PDF guardado en Descargas.", true);
  } catch (e) {
    report(friendlyError(e), true);
    if (attached) await chrome.debugger.detach(target).catch(() => {});
    await inPage(tabId, restorePage).catch(() => {});
  } finally {
    busy = false;
  }
}

function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

function fileName(title) {
  const date = new Date().toISOString().slice(0, 10);
  const clean = (title || "web").replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  return `${clean || "web"} ${date}`;
}

function friendlyError(e) {
  const msg = e?.message || String(e);
  if (/cannot (access|be scripted)|chrome:\/\/|webstore/i.test(msg)) {
    return "Chrome no deja guardar esta página (páginas internas o la Web Store).";
  }
  if (/another debugger|already attached/i.test(msg)) {
    return "Cierra las DevTools de esta pestaña y vuelve a intentarlo.";
  }
  return `No se pudo: ${msg}`;
}

// --- Funciones que se ejecutan dentro de la página -------------------------
// Corren en el mundo aislado de la extensión, que conserva sus variables
// entre llamadas, así que comparten estado a través de window.__webPdf.

async function loadEverything() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const scroller = document.scrollingElement || document.documentElement;
  const startY = scrollY;

  // Imágenes perezosas: se piden ya y se rellenan los data-src habituales.
  for (const img of document.images) {
    img.loading = "eager";
    const lazy = img.dataset.src || img.dataset.lazySrc || img.dataset.original;
    if (lazy && (!img.src || img.src.startsWith("data:"))) img.src = lazy;
    const lazySet = img.dataset.srcset || img.dataset.lazySrcset;
    if (lazySet && !img.srcset) img.srcset = lazySet;
  }

  // Bajar poco a poco dispara la carga por scroll; se para a los 45 s
  // para no quedarse atrapado en un scroll infinito.
  const deadline = Date.now() + 45000;
  let y = 0;
  while (y < scroller.scrollHeight && Date.now() < deadline) {
    y += Math.max(200, innerHeight * 0.8);
    scrollTo(0, y);
    await sleep(250);
  }

  const pending = [...document.images].filter((img) => !img.complete);
  await Promise.race([
    Promise.all(pending.map((img) => new Promise((r) => { img.onload = img.onerror = r; }))),
    sleep(8000)
  ]);

  scrollTo(0, 0);
  await sleep(300);
  window.__webPdf = { startY, changes: [] };
  return {
    title: document.title,
    width: document.documentElement.clientWidth,
    viewportHeight: innerHeight
  };
}

function measureHeights() {
  const els = [...document.querySelectorAll("body, body *")];
  window.__webPdf.measured = els.map((el) => [el, el.getBoundingClientRect().height]);
}

function freezeHeights() {
  const state = window.__webPdf;
  const set = (el, prop, value) => {
    state.changes.push([el, prop, el.style.getPropertyValue(prop), el.style.getPropertyPriority(prop)]);
    el.style.setProperty(prop, value, "important");
  };

  for (const [el, before] of state.measured) {
    if (!el.isConnected) continue;
    if (Math.abs(el.getBoundingClientRect().height - before) > 1) {
      set(el, "height", `${before}px`);
      set(el, "min-height", "0px");
      set(el, "max-height", "none");
    }
  }

  // Elementos fijos (cabeceras, botones flotantes): se quedan una sola vez
  // donde se ven arriba, en vez de repetirse en cada hoja. Los sticky no se
  // tocan porque ocupan su sitio en el flujo y al imprimir no se repiten.
  const fixed = [...document.querySelectorAll("body *")]
    .filter((el) => getComputedStyle(el).position === "fixed")
    .map((el) => [el, el.getBoundingClientRect()]);
  for (const [el, r] of fixed) {
    set(el, "position", "absolute");
    const base = el.offsetParent ? el.offsetParent.getBoundingClientRect() : { top: 0, left: 0 };
    set(el, "top", `${r.top - base.top}px`);
    set(el, "left", `${r.left - base.left}px`);
    set(el, "bottom", "auto");
    set(el, "right", "auto");
    set(el, "width", `${r.width}px`);
  }
  state.measured = null;

  return Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0);
}

function restorePage() {
  const state = window.__webPdf;
  if (!state) return;
  for (const [el, prop, value, priority] of state.changes.reverse()) {
    if (value) el.style.setProperty(prop, value, priority);
    else el.style.removeProperty(prop);
  }
  scrollTo(0, state.startY);
  window.__webPdf = null;
}
