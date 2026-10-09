// chóque — interacciones compartidas
document.documentElement.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Language (ES / EN). Texts carry their English version in data-en (innerHTML),
// data-en-alt (image alt) and data-en-aria (aria-label). Visitors whose browser
// isn't in Spanish get English by default; their choice is remembered.
const STRINGS = {
  es: { menu: 'Menú', close: 'Cerrar', pause: 'Pausar', play: 'Reproducir', viewProject: 'Ver proyecto' },
  en: { menu: 'Menu', close: 'Close', pause: 'Pause', play: 'Play', viewProject: 'View project' },
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
  for (const [attr, en, es] of [['alt', 'enAlt', 'esAlt'], ['aria-label', 'enAria', 'esAria']]) {
    document.querySelectorAll(`[data-${attr === 'alt' ? 'en-alt' : 'en-aria'}]`).forEach((el) => {
      if (el.dataset[es] === undefined) el.dataset[es] = el.getAttribute(attr);
      el.setAttribute(attr, lang === 'en' ? el.dataset[en] : el.dataset[es]);
    });
  }
  document.querySelectorAll('.lang [data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  document.dispatchEvent(new CustomEvent('langchange'));
};
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
  matchMedia('(min-width: 721px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}
