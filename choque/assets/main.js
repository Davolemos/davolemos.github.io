// chóque — interacciones compartidas
document.documentElement.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Rotating phrase
const words = [...document.querySelectorAll('.rotator > span')];
if (words.length > 1) {
  let w = 0;
  setInterval(() => {
    if (document.hidden) return;
    const cur = words[w], nxt = words[(w = (w + 1) % words.length)];
    cur.classList.add('out'); cur.setAttribute('aria-hidden', 'true');
    nxt.classList.remove('out'); nxt.removeAttribute('aria-hidden');
    setTimeout(() => cur.classList.remove('out'), 260);
  }, 2800);
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
