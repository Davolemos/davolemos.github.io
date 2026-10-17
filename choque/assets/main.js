// choque — interacciones compartidas
document.documentElement.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Language (ES / EN). Texts carry their English version in data-en (innerHTML),
// data-en-alt (image alt) and data-en-aria (aria-label). Visitors whose browser
// isn't in Spanish get English by default; their choice is remembered.
const STRINGS = {
  es: {
    menu: 'Menú', close: 'Cerrar', pause: 'Pausar', play: 'Reproducir', viewProject: 'Ver proyecto', copied: 'Correo copiado',
    pauseAnim: 'Pausar animación', playAnim: 'Reproducir animación',
    needName: 'Escribe tu nombre.', needContact: 'Déjanos un email o un WhatsApp para responderte.', badEmail: 'Revisa el email, parece incompleto.',
    sending: 'Enviando…', sendError: 'No se pudo enviar. Intenta de nuevo o escríbenos por WhatsApp.',
  },
  en: {
    menu: 'Menu', close: 'Close', pause: 'Pause', play: 'Play', viewProject: 'View project', copied: 'Email copied',
    pauseAnim: 'Pause animation', playAnim: 'Play animation',
    needName: 'Write your name.', needContact: 'Leave an email or a WhatsApp number so we can reply.', badEmail: 'Check the email, it looks incomplete.',
    sending: 'Sending…', sendError: "Couldn't send it. Try again or message us on WhatsApp.",
  },
};
const LANG_KEY = 'choque-lang';
let lang = (() => { try { return localStorage.getItem(LANG_KEY); } catch { return null; } })()
  || ((navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en');
const t = (key) => STRINGS[lang][key];
const applyLang = (next) => {
  lang = next;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-en]').forEach((el) => {
    if (el.dataset.es === undefined) el.dataset.es = el.innerHTML;
    el.innerHTML = lang === 'en' ? el.dataset.en : el.dataset.es;
  });
  for (const [attr, sel, en, es] of [['alt', 'en-alt', 'enAlt', 'esAlt'], ['aria-label', 'en-aria', 'enAria', 'esAria'], ['placeholder', 'en-ph', 'enPh', 'esPh']]) {
    document.querySelectorAll(`[data-${sel}]`).forEach((el) => {
      if (el.dataset[es] === undefined) el.dataset[es] = el.getAttribute(attr);
      el.setAttribute(attr, lang === 'en' ? el.dataset[en] : el.dataset[es]);
    });
  }
  document.querySelectorAll('.lang [data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  document.dispatchEvent(new CustomEvent('langchange'));
};
// Page id and visit source, shared by the visit counter, WhatsApp messages and the brief form
const PAGE = (() => {
  const m = location.pathname.match(/\/(proyectos|servicios)\/([a-z0-9-]+)/);
  return m ? `${m[1]}~${m[2]}` : 'inicio';
})();
const SOURCES = [['google', 'google'], ['bing', 'bing'], ['instagram', 'instagram'], ['facebook', 'facebook'], ['fb.', 'facebook'],
  ['behance', 'behance'], ['linkedin', 'linkedin'], ['lnkd.in', 'linkedin'], ['tiktok', 'tiktok'], ['whatsapp', 'whatsapp'], ['wa.me', 'whatsapp']];
let newVisit = false;
const SOURCE = (() => {
  try { const saved = sessionStorage.getItem('choque-fuente'); if (saved) return saved; } catch {}
  newVisit = true;
  let ref = new URLSearchParams(location.search).get('utm_source') || '';
  if (!ref && document.referrer) {
    try { const host = new URL(document.referrer).hostname; if (host !== location.hostname) ref = host; } catch {}
  }
  ref = ref.toLowerCase();
  const found = !ref ? 'directo' : (SOURCES.find(([needle]) => ref.includes(needle)) || [, 'otro'])[1];
  try { sessionStorage.setItem('choque-fuente', found); } catch {}
  return found;
})();

// Anonymous visit counter: no cookies and nothing personal, only page, visit source
// and type of contact. The studio's own devices are skipped (the admin panel marks them).
const count = (type) => {
  try { if (localStorage.getItem('choque-yo') === '1') return; } catch {}
  if (navigator.webdriver || !navigator.sendBeacon) return;
  try { navigator.sendBeacon('/api/evento', JSON.stringify({ t: type, f: SOURCE, p: PAGE })); } catch {}
};
count(newVisit ? 'entrada' : 'vista');
document.addEventListener('click', (e) => {
  const a = e.target instanceof Element && e.target.closest('a[href]');
  if (!a) return;
  if (a.href.includes('wa.me/')) count('whatsapp');
  else if (a.href.startsWith('mailto:') && a.classList.contains('btn')) count('email');
}, true);

// Brief form ("Cuéntanos tu proyecto"): a dialog opened by any [data-brief] button.
// It is sent to Netlify Forms (form "brief"; the static copy Netlify detects is in __forms.html).
const briefBtns = document.querySelectorAll('[data-brief]');
if (briefBtns.length) {
  const X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>';
  const chip = (value, es, en) => `<label><input type="checkbox" name="servicio" value="${value}"><span${en ? ` data-en="${en}"` : ''}>${es}</span></label>`;
  const opt = (value, en) => `<option value="${value}" data-en="${en}">${value}</option>`;
  document.body.insertAdjacentHTML('beforeend', `
<dialog class="brief" id="brief" aria-labelledby="brief-title">
  <form name="brief" method="post" netlify-honeypot="bot-field" novalidate>
    <input type="hidden" name="form-name" value="brief">
    <p class="brief-hp" aria-hidden="true"><label>No llenar <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
    <div class="brief-head">
      <h2 id="brief-title" data-en="Tell us about your project">Cuéntanos tu proyecto</h2>
      <button class="brief-close" type="button" aria-label="Cerrar" data-en-aria="Close">${X}</button>
    </div>
    <p class="brief-sub" data-en="Two minutes. We reply within 48 hours.">Dos minutos. Te respondemos en menos de 48 horas.</p>
    <fieldset class="brief-chips">
      <legend data-en="What do you need?">¿Qué necesitas?</legend>
      <div>${chip('Branding', 'Branding')}${chip('Logo', 'Logo')}${chip('Empaque', 'Empaque', 'Packaging')}${chip('Diseño gráfico', 'Diseño gráfico', 'Graphic design')}${chip('Web', 'Web')}${chip('Otro', 'Otro', 'Other')}</div>
    </fieldset>
    <div class="brief-row">
      <label class="field"><span data-en="Your name">Tu nombre</span><input name="nombre" autocomplete="name" required></label>
      <label class="field"><span data-en="Brand or company">Marca o empresa</span><input name="marca" autocomplete="organization"></label>
    </div>
    <div class="brief-row">
      <label class="field"><span>Email</span><input type="email" name="email" autocomplete="email" spellcheck="false" aria-describedby="brief-hint"></label>
      <label class="field"><span>WhatsApp</span><input type="tel" name="whatsapp" autocomplete="tel" aria-describedby="brief-hint"></label>
    </div>
    <p class="brief-hint" id="brief-hint" data-en="Leave at least one so we can reply.">Deja al menos uno para poder responderte.</p>
    <div class="brief-row">
      <label class="field"><span data-en="Budget (USD)">Presupuesto (USD)</span><select name="presupuesto">
        ${opt('Aún no lo sé', 'Not sure yet')}${opt('Menos de $1,000', 'Under $1,000')}${opt('$1,000 – $3,000', '$1,000 – $3,000')}${opt('$3,000 – $6,000', '$3,000 – $6,000')}${opt('Más de $6,000', 'Over $6,000')}
      </select></label>
      <label class="field"><span data-en="When">Para cuándo</span><select name="tiempo">
        ${opt('Lo antes posible', 'As soon as possible')}${opt('En 1 a 3 meses', 'In 1 to 3 months')}${opt('Más adelante', 'Later on')}
      </select></label>
    </div>
    <label class="field"><span data-en="About your brand">Cuéntanos de tu marca</span><textarea name="mensaje" rows="4" placeholder="Qué hacen, qué necesitan, alguna referencia que te guste…" data-en-ph="What you do, what you need, a reference you like…"></textarea></label>
    <button class="btn btn-dark" type="submit" data-en="Send brief">Enviar brief</button>
    <p class="brief-msg" role="status" aria-live="polite"></p>
    <p class="brief-legal" data-en="We only use this information to reply to you about your project. No advertising, no mailing lists. Details in our privacy policy.">Solo usaremos estos datos para responderte sobre tu proyecto. Nada de publicidad ni listas de correo. Más detalles en nuestra política de privacidad.</p>
  </form>
  <div class="brief-done" hidden tabindex="-1">
    <svg class="brief-check" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M5 12.5l4.5 4.5L19 7.5"/></svg>
    <h2 data-en="Got it!">¡Recibido!</h2>
    <p data-en="Thanks. We'll write to you within 48 hours. If it's urgent, message us on WhatsApp.">Gracias. Te escribimos en menos de 48 horas. Si es urgente, escríbenos por WhatsApp.</p>
    <div class="actions">
      <a class="btn btn-dark" href="https://wa.me/50764228672" target="_blank" rel="noopener">WhatsApp</a>
      <button class="btn btn-ghost" type="button" data-close data-en="Close">Cerrar</button>
    </div>
  </div>
</dialog>`);

  const dialog = document.getElementById('brief');
  const form = dialog.querySelector('form');
  const done = dialog.querySelector('.brief-done');
  const msg = dialog.querySelector('.brief-msg');
  const send = form.querySelector('[type="submit"]');
  const PRESELECT = {
    'servicios~branding-panama': 'Branding', 'servicios~diseno-de-logos-panama': 'Logo', 'servicios~diseno-de-empaques-panama': 'Empaque',
    'servicios~diseno-grafico-panama': 'Diseño gráfico', 'servicios~diseno-web-panama': 'Web',
  };
  const reset = () => {
    form.reset(); form.hidden = false; done.hidden = true; msg.textContent = '';
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    const pre = form.querySelector(`[name="servicio"][value="${PRESELECT[PAGE]}"]`);
    if (pre) pre.checked = true;
  };
  briefBtns.forEach((b) => b.addEventListener('click', () => {
    if (!done.hidden) reset();
    dialog.showModal();
  }));
  reset();
  const close = () => dialog.close();
  dialog.querySelector('.brief-close').addEventListener('click', close);
  done.querySelector('[data-close]').addEventListener('click', close);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); }); // click on the backdrop

  const fail = (field, key) => {
    field.setAttribute('aria-invalid', 'true');
    msg.textContent = t(key); msg.className = 'brief-msg err';
    field.focus();
  };
  form.addEventListener('input', (e) => e.target.removeAttribute?.('aria-invalid'));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = form.elements;
    const name = f.nombre.value.trim(), email = f.email.value.trim(), phone = f.whatsapp.value.trim();
    if (!name) return fail(f.nombre, 'needName');
    if (!email && !phone) return fail(f.email, 'needContact');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(f.email, 'badEmail');

    const data = new FormData(form);
    data.set('servicio', data.getAll('servicio').join(', ') || '—');
    data.set('subject', `Nuevo brief: ${name}${f.marca.value.trim() ? ` (${f.marca.value.trim()})` : ''}`);
    data.set('pagina', PAGE); data.set('fuente', SOURCE); data.set('idioma', lang);
    send.disabled = true; msg.textContent = t('sending'); msg.className = 'brief-msg';
    try {
      const r = await fetch('/', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
      });
      if (!r.ok) throw new Error(r.status);
      count('brief');
      form.hidden = true; done.hidden = false; done.focus();
    } catch {
      msg.textContent = t('sendError'); msg.className = 'brief-msg err';
    } finally { send.disabled = false; }
  });
}

document.querySelectorAll('.lang [data-lang]').forEach((b) => b.addEventListener('click', () => {
  applyLang(b.dataset.lang);
  try { localStorage.setItem(LANG_KEY, lang); } catch {}
}));
applyLang(lang);

document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Rotating phrase: on the home page it advances with every reel photo
// (event "reel:change"); other pages rotate on their own timer
const words = [...document.querySelectorAll('.rotator > span')];
if (words.length > 1) {
  let w = 0;
  const nextWord = () => {
    const cur = words[w], nxt = words[(w = (w + 1) % words.length)];
    cur.classList.add('out'); cur.setAttribute('aria-hidden', 'true');
    nxt.classList.remove('out'); nxt.removeAttribute('aria-hidden');
    setTimeout(() => cur.classList.remove('out'), 160);
  };
  if (document.getElementById('reel')) document.addEventListener('reel:change', nextWord);
  else setInterval(() => { if (!document.hidden) nextWord(); }, 2800);
}

// Carousel
const track = document.getElementById('track');
if (track) {
  const cards = [...track.children];
  const prev = document.getElementById('prev'), next = document.getElementById('next');
  const cur = document.getElementById('cur');
  const pad = (n) => String(n).padStart(2, '0');
  document.getElementById('tot').textContent = pad(cards.length);
  const index = () => {
    const start = cards[0].offsetLeft;
    let best = 0, d = Infinity;
    cards.forEach((c, i) => { const k = Math.abs(c.offsetLeft - start - track.scrollLeft); if (k < d) { d = k; best = i; } });
    return best;
  };
  const update = () => {
    cur.textContent = pad(index() + 1);
    prev.disabled = track.scrollLeft < 4;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  };
  const go = (dir) => {
    const i = Math.max(0, Math.min(cards.length - 1, index() + dir));
    track.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  addEventListener('resize', update);
  update();

  // Deep link to a project card (#chavela, #mansa-galleta…)
  const target = location.hash && track.querySelector(location.hash);
  if (target) track.scrollLeft = target.offsetLeft - cards[0].offsetLeft;
}

// Reel: flips through project photos; the link always points to the visible project
const reel = document.getElementById('reel');
if (reel) {
  const INTERVAL = 700; // ms por foto (la frase del titular cambia al mismo tiempo)
  const imgs = [...reel.querySelectorAll('img')];
  const name = document.getElementById('reel-name');
  const cur = document.getElementById('reel-cur');
  const toggle = document.getElementById('reel-toggle');
  const toggleLabel = document.getElementById('reel-toggle-label');
  const pad = (n) => String(n).padStart(2, '0');
  document.getElementById('reel-tot').textContent = pad(imgs.length);
  let i = 0, userPaused = reduce, hover = false, timer;

  const show = (n) => {
    imgs[i].classList.remove('on');
    i = (n + imgs.length) % imgs.length;
    const img = imgs[i];
    img.classList.add('on');
    reel.href = img.dataset.href;
    name.textContent = img.dataset.name;
    cur.textContent = pad(i + 1);
    reel.setAttribute('aria-label', `${t('viewProject')} ${img.dataset.name}`);
  };
  const tick = () => {
    if (userPaused || hover || document.hidden) return;
    show(i + 1);
    document.dispatchEvent(new CustomEvent('reel:change'));
  };
  const sync = () => {
    toggle.setAttribute('aria-pressed', String(userPaused));
    toggleLabel.textContent = userPaused ? t('play') : t('pause');
  };
  toggle.addEventListener('click', () => { userPaused = !userPaused; sync(); });
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    reel.addEventListener('pointerenter', () => { hover = true; });
    reel.addEventListener('pointerleave', () => { hover = false; });
  }
  reel.addEventListener('focus', () => { hover = true; });
  reel.addEventListener('blur', () => { hover = false; });
  show(0); sync();
  document.addEventListener('langchange', () => { sync(); reel.setAttribute('aria-label', `${t('viewProject')} ${imgs[i].dataset.name}`); });
  timer = setInterval(tick, INTERVAL);
}

// Mobile menu
const menuBtn = document.getElementById('menu-btn');
const menu = document.getElementById('menu');
if (menuBtn && menu) {
  const setOpen = (open) => {
    menu.classList.toggle('open', open);
    menu.inert = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.firstChild.textContent = `${open ? t('close') : t('menu')} `;
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) menu.querySelector('a').focus({ preventScroll: true });
  };
  menuBtn.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
  const label = () => { menuBtn.firstChild.textContent = `${menu.classList.contains('open') ? t('close') : t('menu')} `; };
  document.addEventListener('langchange', label); label();
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) { setOpen(false); menuBtn.focus(); }
  });
  matchMedia('(min-width: 1180px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

// Email buttons open the mail app. If no app opens (the page keeps focus),
// the address is copied and the button says so, so the visitor can paste it.
// The copy itself happens on the tap, because browsers only allow it then.
document.querySelectorAll('a.btn[href^="mailto:"]').forEach((btn) => {
  const email = btn.getAttribute('href').slice(7).split('?')[0];
  btn.title = email;
  let timer;
  btn.addEventListener('click', () => {
    const copied = navigator.clipboard?.writeText(email);
    let left = false;
    const leave = () => { left = true; };
    addEventListener('blur', leave, { once: true });
    document.addEventListener('visibilitychange', leave, { once: true });
    setTimeout(() => {
      removeEventListener('blur', leave);
      document.removeEventListener('visibilitychange', leave);
      if (left || !copied) return;
      copied.then(() => {
        if (!timer) btn.dataset.label = btn.innerHTML;
        clearTimeout(timer);
        btn.innerHTML = `<svg class="mail" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M5 12.5l4.5 4.5L19 7.5"/></svg> ${t('copied')}`;
        timer = setTimeout(() => { btn.innerHTML = btn.dataset.label; timer = null; }, 2500);
      }).catch(() => {});
    }, 1000);
  });
});

// WhatsApp opens with a message already written for the page the visitor is on,
// and the email gets a matching subject, so the studio knows what they saw
const PROJECTS = { chavela: 'Chavela', 'mansa-galleta': 'Mansa Galleta', sultavolo: 'Sultavolo', 'fondas-de-colon': 'Fondas de Colón', 'ricketts-lab': 'Ricketts Lab' };
const SERVICES = { // [subject, phrase] in each language
  'branding-panama': { es: ['Branding', 'el branding para mi marca'], en: ['Branding', 'branding for my brand'] },
  'diseno-de-logos-panama': { es: ['Diseño de logo', 'el diseño de un logo'], en: ['Logo design', 'a logo design'] },
  'diseno-de-empaques-panama': { es: ['Diseño de empaque', 'el diseño de empaque para mi producto'], en: ['Packaging design', 'packaging design for my product'] },
  'diseno-grafico-panama': { es: ['Diseño gráfico', 'diseño gráfico para mi marca'], en: ['Graphic design', 'graphic design for my brand'] },
  'diseno-web-panama': { es: ['Diseño web', 'el diseño de una web'], en: ['Web design', 'a website design'] },
};
const contactCopy = () => {
  const [kind, slug] = PAGE.split('~');
  const es = lang === 'es';
  if (kind === 'proyectos' && PROJECTS[slug]) {
    const p = PROJECTS[slug];
    return es
      ? { wa: `Hola choque, vi el proyecto ${p} en su web y quiero algo así para mi marca.`, subject: `Un proyecto como ${p}` }
      : { wa: `Hi choque, I saw the ${p} project on your website and I'd like something like it for my brand.`, subject: `A project like ${p}` };
  }
  if (kind === 'servicios' && SERVICES[slug]) {
    const [subject, phrase] = SERVICES[slug][lang];
    return es
      ? { wa: `Hola choque, me interesa ${phrase}. ¿Me pueden cotizar?`, subject: `Cotización: ${subject}` }
      : { wa: `Hi choque, I'm interested in ${phrase}. Could you send me a quote?`, subject: `Quote: ${subject}` };
  }
  return es
    ? { wa: 'Hola choque, vi su web y quiero contarles sobre un proyecto.', subject: 'Nuevo proyecto' }
    : { wa: "Hi choque, I saw your website and I'd like to tell you about a project.", subject: 'New project' };
};
const setContactLinks = () => {
  const { wa, subject } = contactCopy();
  document.querySelectorAll('a[href*="wa.me/"]').forEach((a) => {
    a.href = `${a.href.split('?')[0]}?text=${encodeURIComponent(wa)}`;
  });
  document.querySelectorAll('a.btn[href^="mailto:"]').forEach((a) => {
    a.href = `${a.getAttribute('href').split('?')[0]}?subject=${encodeURIComponent(subject)}`;
  });
};
setContactLinks();
document.addEventListener('langchange', setContactLinks);

// Google "Add as a preferred source" button in the footer. Google's script is only
// loaded when the visitor gets near the footer, so most visits never contact Google.
const prefSrc = document.querySelector('[google-add-preferred-source-btn]');
if (prefSrc) {
  const loadPrefSrc = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    loadPrefSrc.disconnect();
    prefSrc.dataset.lang = lang;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://news.google.com/swg/js/v1/publisher.js';
    document.head.append(s);
  }, { rootMargin: '600px 0px' });
  loadPrefSrc.observe(prefSrc);
}

// Privacy policy bubble in the footer
const privacyBtn = document.querySelector('.privacy-btn');
const privacy = document.getElementById('privacy');
if (privacyBtn && privacy) {
  const setPrivacy = (open) => {
    privacy.classList.toggle('open', open);
    privacy.inert = !open;
    privacyBtn.setAttribute('aria-expanded', String(open));
    if (open) privacy.querySelector('.privacy-close').focus({ preventScroll: true });
  };
  const isOpen = () => privacy.classList.contains('open');
  privacyBtn.addEventListener('click', () => setPrivacy(!isOpen()));
  privacy.querySelector('.privacy-close').addEventListener('click', () => { setPrivacy(false); privacyBtn.focus(); });
  document.addEventListener('click', (e) => {
    if (isOpen() && !privacy.contains(e.target) && !privacyBtn.contains(e.target)) setPrivacy(false);
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) { setPrivacy(false); privacyBtn.focus(); }
  });
}

// Animated covers: stay still for visitors who prefer reduced motion, and every one
// gets a pause / play button (moving content must be stoppable, WCAG 2.2.2)
const PAUSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l10.5-6.5z"/></svg>';
document.querySelectorAll('video[autoplay]').forEach((v) => {
  if (reduce) { v.removeAttribute('autoplay'); v.pause(); }
  const link = v.closest('a');
  const host = link ? link.parentElement : v.parentElement;
  host.classList.add('has-vtoggle');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'vtoggle';
  const sync = () => {
    const paused = v.paused;
    btn.innerHTML = paused ? PLAY_ICON : PAUSE_ICON;
    btn.setAttribute('aria-label', paused ? t('playAnim') : t('pauseAnim'));
  };
  btn.addEventListener('click', () => { if (v.paused) v.play().catch(() => {}); else v.pause(); });
  v.addEventListener('play', sync);
  v.addEventListener('pause', sync);
  document.addEventListener('langchange', sync);
  host.append(btn);
  sync();
});

// Basic image protection: no right-click "Save image" and no drag-to-desktop on photos and videos
const isMedia = (el) => el instanceof Element && el.closest('img, video, .media');
document.addEventListener('contextmenu', (e) => { if (isMedia(e.target)) e.preventDefault(); });
document.addEventListener('dragstart', (e) => { if (isMedia(e.target)) e.preventDefault(); });
document.querySelectorAll('img').forEach((img) => { img.draggable = false; });
document.querySelectorAll('video').forEach((v) => {
  v.setAttribute('controlslist', 'nodownload noplaybackrate noremoteplayback');
  v.disablePictureInPicture = true;
});

// Agenda status pill: the HTML holds a default; when the site runs on Netlify the
// current status set from the admin panel (/api/estado) replaces it.
const statusPills = document.querySelectorAll('.status[data-status]');
if (statusPills.length) {
  const MONTHS = {
    enero: 'January', febrero: 'February', marzo: 'March', abril: 'April', mayo: 'May', junio: 'June',
    julio: 'July', agosto: 'August', septiembre: 'September', octubre: 'October', noviembre: 'November', diciembre: 'December',
  };
  fetch('/api/estado', { cache: 'no-store' })
    .then((r) => (r.ok && (r.headers.get('content-type') || '').includes('json') ? r.json() : null))
    .then((s) => {
      if (!s || typeof s.abierta !== 'boolean' || !MONTHS[s.mes]) return;
      const mesEs = s.mes[0].toUpperCase() + s.mes.slice(1);
      const back = !s.abierta && MONTHS[s.regreso];
      statusPills.forEach((pill) => {
        const label = pill.querySelector('[data-en]');
        label.dataset.es = `${s.abierta ? 'Agenda abierta' : 'Agenda cerrada'} · ${mesEs}${back ? ` · Regresamos en ${s.regreso}` : ''}`;
        label.dataset.en = `${s.abierta ? 'Booking open' : 'Booking closed'} · ${MONTHS[s.mes]}${back ? ` · Back in ${MONTHS[s.regreso]}` : ''}`;
        label.innerHTML = lang === 'en' ? label.dataset.en : label.dataset.es;
        pill.dataset.status = s.abierta ? 'abierta' : 'cerrada';
      });
    })
    .catch(() => {});
}
