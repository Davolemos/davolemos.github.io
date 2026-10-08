// Scene renderer. window.seek(t) paints the frame at time t (seconds); pure function of t.
(function () {
  const T = window.TIMELINE;
  const params = new URLSearchParams(location.search);
  const FMT = params.get('fmt') || '16x9';
  const REDUCED = params.get('reduced') === '1';
  const SIZES = { '16x9': [1920, 1080], '9x16': [1080, 1920], '1x1': [1080, 1080] };
  const [W, H] = SIZES[FMT];

  // ---- Tokens ----------------------------------------------------------------
  const C = {
    bg: '#F2EDE4', ink: '#1E1A16', ink2: '#4B443C', muted: '#6B635A',
    strip: '#B9AE9E', counter: '#DCD2C3', counterEdge: '#C8BCAA',
    accent: '#C9501C', accentDeep: '#A8401A', blue: '#2148A0', blueDeep: '#18377D',
    chips: '#C9A05A', chipsDeep: '#B48A45', white: '#FFFDF8',
  };
  const F = { display: '"Inter Display"', mono: '"Plex Mono"' };

  const canvas = document.getElementById('c');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const off = document.createElement('canvas');
  const octx = off.getContext('2d');

  // ---- Layout per format -------------------------------------------------------
  const L = (() => {
    let S, sx, sy, tx, tw, ty, anchor, maxFont, ui;
    if (FMT === '16x9') {
      S = H * 0.8; sx = W - S - W * 0.05; sy = (H - S) / 2;
      tx = W * 0.065; tw = sx - tx - W * 0.03; ty = H * 0.47; anchor = 'center'; maxFont = 58; ui = 1.0;
    } else if (FMT === '9x16') {
      S = W * 0.92; sx = (W - S) / 2; sy = H * 0.31;
      tx = W * 0.075; tw = W * 0.85; ty = H * 0.12; anchor = 'top'; maxFont = 66; ui = 1.4;
    } else {
      S = H * 0.70; sx = (W - S) / 2; sy = H * 0.275;
      tx = W * 0.075; tw = W * 0.85; ty = H * 0.065; anchor = 'top'; maxFont = 50; ui = 1.25;
    }
    return { S, sx, sy, u: S / 1000, tx, tw, ty, anchor, maxFont, ui };
  })();
  off.width = Math.ceil(L.S); off.height = Math.ceil(L.S * 0.9);

  // ---- Math ------------------------------------------------------------------------
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  // Custom cubic-bezier(0.22, 0, 0, 1): quick start, long settle, no overshoot.
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dsx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) { const d = dsx(t); if (Math.abs(d) < 1e-6) break; t -= (sx(t) - x) / d; }
      t = clamp(t);
      return sy(t);
    };
  }
  const ease = bezier(0.22, 0, 0, 1);
  const easeIO = bezier(0.6, 0, 0.2, 1); // camera
  const prog = (b, a, z) => clamp((b - a) / (z - a));
  const ramp = (b, a, z, e = ease) => e(prog(b, a, z));
  // Reduced motion: positional moves snap at the midpoint.
  const move = (b, a, z, e = ease) => (REDUCED ? (b >= (a + z) / 2 ? 1 : 0) : ramp(b, a, z, e));

  // Seeded randomness only.
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---- World: a strip wall behind a shop counter. 1000 x 900 units. --------------
  const COLS = 6, ROWS = 4;
  const slot = (c, r) => ({ x: 125 + c * 150, y: 135 + r * 195 });
  const A_SLOT = [2, 1], B_SLOT = [4, 2];
  const bases = ['#E6DAC4', '#DEDCCB', '#E9DFC0', '#E2D6BF', '#E3DFD8', '#E0D3C6', '#DDD8C4', '#E8DCC8'];
  const logos = ['#8A5A3B', '#5E6B4E', '#9A7A3A', '#6B5A7A', '#7A4E3A', '#4E5E6B'];
  const names = ['Crocante', 'Doradas', 'Maízal', 'Tostí', 'Ricas', 'Sabrosí', 'Crujitos', 'Totopo', 'Nachí',
    'Horneadas', 'Del Campo', 'Papitas', 'Chicha', 'Maní Sol', 'Lomitos', 'Ondas', 'Tostón', 'Yuquí', 'Rueditas', 'Palitos', 'Coco'];
  const claimWords = ['NUEVO', 'NATURAL', '+FIBRA', 'LIGHT', 'SIN GLUTEN', 'ORIGINAL', 'HORNEADO', 'EXTRA', 'CON SAL', '-GRASA', 'PICANTE', 'CLÁSICO'];

  const packs = [];
  (function buildPacks() {
    const rnd = mulberry32(20261008);
    let n = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const { x, y } = slot(c, r);
      const isA = c === A_SLOT[0] && r === A_SLOT[1];
      const isB = c === B_SLOT[0] && r === B_SLOT[1];
      const p = { c, r, x, y, isA, isB };
      if (isA) {
        Object.assign(p, { base: '#EADFCB', logo: '#7A4E3A', name: 'Crujís', claims: [
          { t: 'NUEVO', kind: 'dot', x: 39, y: -22 },
          { t: '+FIBRA', kind: 'pill', x: -30, y: -24, w: 38 },
          { t: 'SIN GLUTEN', kind: 'pill', x: -24, y: -9, w: 50 },
          { t: 'NATURAL', kind: 'dot', x: -42, y: 58 },
          { t: 'HORNEADO', kind: 'pill', x: 22, y: 62, w: 46 },
        ] });
      } else if (isB) {
        Object.assign(p, { base: C.blue, deep: C.blueDeep, name: 'ZAS', claims: [] });
      } else {
        const k = 3 + Math.floor(rnd() * 3);
        const spots = [[38, -22, 'dot'], [-30, -24, 'pill'], [-24, -9, 'pill'], [-42, 58, 'dot'], [22, 62, 'pill'], [40, 2, 'dot']];
        const claims = [];
        for (let i = 0; i < k; i++) {
          const s = spots.splice(Math.floor(rnd() * spots.length), 1)[0];
          const t = claimWords[Math.floor(rnd() * claimWords.length)];
          claims.push({ t, kind: s[2], x: s[0], y: s[1], w: 22 + t.length * 3.6 });
        }
        Object.assign(p, { base: bases[Math.floor(rnd() * bases.length)], logo: logos[Math.floor(rnd() * logos.length)],
          name: names[n % names.length], claims });
        n++;
      }
      packs.push(p);
    }
  })();
  const packA = packs.find((p) => p.isA), packB = packs.find((p) => p.isB);

  function shade(hex, k) { // k<0 darker
    const v = parseInt(hex.slice(1), 16);
    let r = v >> 16, g = (v >> 8) & 255, b = v & 255;
    const f = (x) => Math.round(k < 0 ? x * (1 + k) : x + (255 - x) * k);
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }

  function bagPath(g) {
    g.beginPath();
    g.moveTo(-60, -72); g.lineTo(60, -72);
    g.quadraticCurveTo(64, 0, 60, 72); g.lineTo(-60, 72);
    g.quadraticCurveTo(-64, 0, -60, -72); g.closePath();
  }
  function silhouette(g) { // body + crimps, for tracing the shape
    g.beginPath();
    g.moveTo(-60, -85); g.lineTo(60, -85); g.lineTo(60, -72);
    g.quadraticCurveTo(64, 0, 60, 72); g.lineTo(60, 85); g.lineTo(-60, 85); g.lineTo(-60, 72);
    g.quadraticCurveTo(-64, 0, -60, -72); g.closePath();
  }

  function paintFront(g, p, base, opts) {
    const deep = p.isB ? C.blueDeep : shade(base, -0.1);
    // crimps
    g.fillStyle = deep;
    g.fillRect(-60, -85, 120, 13); g.fillRect(-60, 72, 120, 13);
    g.strokeStyle = shade(base, -0.2); g.lineWidth = 0.8;
    for (let x = -56; x <= 56; x += 6) {
      g.beginPath(); g.moveTo(x, -85); g.lineTo(x, -72); g.moveTo(x, 72); g.lineTo(x, 85); g.stroke();
    }
    // body
    bagPath(g); g.fillStyle = base; g.fill();
    g.save(); bagPath(g); g.clip();
    g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(36, -72, 30, 144); // side volume
    g.restore();
    // product window
    g.beginPath(); g.ellipse(0, 26, 40, 24, 0, 0, Math.PI * 2); g.fillStyle = C.chips; g.fill();
    g.beginPath(); g.ellipse(-8, 30, 18, 9, -0.3, 0, Math.PI * 2); g.fillStyle = C.chipsDeep; g.fill();
    g.beginPath(); g.ellipse(14, 20, 14, 7, 0.4, 0, Math.PI * 2); g.fillStyle = C.chipsDeep; g.fill();
  }

  function paintBrand(g, p) {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (p.isB) {
      g.fillStyle = C.white; g.font = `900 40px ${F.display}`;
      g.fillText('ZAS', 0, -30);
      return;
    }
    g.fillStyle = p.logo;
    g.beginPath(); g.roundRect(-30, -60, 60, 20, 5); g.fill();
    g.fillStyle = C.white; g.font = `700 10px ${F.display}`;
    g.fillText(p.name, 0, -49.5);
  }

  function paintClaim(g, cl, s) {
    if (s <= 0) return;
    g.save(); g.translate(cl.x, cl.y); g.scale(s, s);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (cl.kind === 'dot') {
      g.beginPath(); g.arc(0, 0, 13, 0, Math.PI * 2); g.fillStyle = '#B4302A'; g.fill();
      g.fillStyle = C.white; g.font = `800 5.6px ${F.display}`;
      const parts = cl.t.split(' ');
      if (parts.length > 1) { g.fillText(parts[0], 0, -3.3); g.fillText(parts[1], 0, 3.3); } else g.fillText(cl.t, 0, 0.3);
    } else {
      const w = cl.w || 40;
      g.beginPath(); g.roundRect(-w / 2, -6.5, w, 13, 6.5); g.fillStyle = '#2F6B3A'; g.fill();
      g.fillStyle = C.white; g.font = `700 6.4px ${F.display}`; g.fillText(cl.t, 0, 0.4);
    }
    g.restore();
  }

  function drawPack(g, p, st) {
    g.save();
    g.translate(p.x, p.y);
    const s = st.scale || 1;
    g.scale(s, s);
    if (st.lift > 0) { // picked: a soft contact shadow, no glow
      g.fillStyle = `rgba(30,26,22,${0.12 * st.lift})`;
      g.beginPath(); g.ellipse(0, 92, 56, 6, 0, 0, Math.PI * 2); g.fill();
    }
    paintFront(g, p, p.base);
    if (p.isA && st.recolor > 0) { // the one variable: a wipe of the owned color
      g.save();
      const top = 85 - st.recolor * 170;
      g.beginPath(); g.rect(-70, top, 140, 200); g.clip();
      paintFront(g, p, C.accent);
      g.restore();
    }
    paintBrand(g, p);
    p.claims.forEach((cl, i) => paintClaim(g, cl, p.isA ? st.claim[i] : 1));
    // hang hole
    g.beginPath(); g.arc(0, -79, 3, 0, Math.PI * 2); g.fillStyle = st.holeColor || C.bg; g.fill();
    g.restore();
  }

  // ---- Camera ---------------------------------------------------------------------
  const HAND = { x: packA.x, y: packA.y, z: 3.3 };
  const WALL = { x: 500, y: 450, z: 1 };
  function camera(b) {
    const m = T.moves;
    const out = move(b, m.cameraOut[0], m.cameraOut[1], easeIO);
    const back = move(b, m.cameraIn[0], m.cameraIn[1], easeIO);
    const k = out * (1 - back);
    // interpolate zoom in log space so the move feels even
    const z = Math.exp(lerp(Math.log(HAND.z), Math.log(WALL.z), k));
    const kk = (HAND.z / z - 1) / (HAND.z / WALL.z - 1); // keep the focal path straight on screen
    return { x: lerp(HAND.x, WALL.x, kk), y: lerp(HAND.y, WALL.y, kk), z };
  }
  // world -> stage units (0..1000)
  const toStage = (cam, x, y) => ({ x: (x - cam.x) * cam.z + 500, y: (y - cam.y) * cam.z + 450 });

  // ---- State at beat b --------------------------------------------------------------
  function state(b) {
    const m = T.moves;
    const enter = ramp(b, m.packEnter[0], m.packEnter[1]);
    const claim = m.claims.map((cb) => (REDUCED ? ramp(b, cb, cb + 0.35) : ramp(b, cb, cb + 0.6, bezier(0.3, 0, 0, 1))));
    const d = ramp(b, m.blurOut[0], m.blurOut[1], easeIO) * (1 - ramp(b, m.blurIn[0], m.blurIn[1], easeIO));
    const wall = ramp(b, m.wallIn[0], m.wallIn[1]) * (1 - ramp(b, m.wallOut[0], m.wallOut[1]));
    const recolor = REDUCED ? ramp(b, m.recolor[0], m.recolor[0] + 0.6) : ramp(b, m.recolor[0], m.recolor[1]);
    const nudge = (q) => (REDUCED ? 0 : ramp(b, q[0], q[1]) * (1 - ramp(b, q[2], q[3])));
    return { enter, claim, d, wall, recolor, nudgeA: nudge(m.nudgeA), nudgeB: nudge(m.nudgeB), cam: camera(b) };
  }

  // ---- Draw world to offscreen, then blur by distance ---------------------------------------
  function drawWorld(b, s) {
    const g = octx, u = L.u;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, off.width, off.height); // transparent, so the blur has no edge
    const cam = s.cam;
    g.setTransform(u * cam.z, 0, 0, u * cam.z, u * (500 - cam.x * cam.z), u * (450 - cam.y * cam.z));

    if (s.wall > 0) {
      g.globalAlpha = s.wall;
      // strips
      g.strokeStyle = C.strip; g.lineWidth = 3;
      for (let c = 0; c < COLS; c++) { const x = slot(c, 0).x; g.beginPath(); g.moveTo(x, 20); g.lineTo(x, 820); g.stroke(); }
      g.fillStyle = C.strip; g.fillRect(40, 16, 920, 6);
      // counter
      g.fillStyle = C.counter; g.fillRect(-400, 845, 1800, 200);
      g.fillStyle = C.counterEdge; g.fillRect(-400, 845, 1800, 5);
      g.globalAlpha = 1;
    }
    for (const p of packs) {
      if (p.isA) continue;
      if (s.wall <= 0) continue;
      // fill outward from the hero: one action, staggered by distance
      const dist = Math.hypot(p.c - A_SLOT[0], p.r - A_SLOT[1]);
      const m = T.moves;
      const inA = REDUCED ? s.wall : ramp(b, m.wallIn[0] + dist * 0.35, m.wallIn[0] + dist * 0.35 + 1.4) * (1 - ramp(b, m.wallOut[0], m.wallOut[1]));
      if (inA <= 0) continue;
      g.globalAlpha = inA;
      drawPack(g, p, { scale: p.isB ? 1 + 0.07 * s.nudgeB : 1, lift: p.isB ? s.nudgeB : 0, holeColor: C.bg });
      g.globalAlpha = 1;
    }
    // hero pack
    g.globalAlpha = s.enter;
    const eScale = REDUCED ? 1 : lerp(0.94, 1, s.enter);
    drawPack(g, packA, { scale: eScale * (1 + 0.07 * s.nudgeA), lift: s.nudgeA, claim: s.claim, recolor: s.recolor });
    g.globalAlpha = 1;
  }

  // ---- Overlays (crisp, not blurred) ---------------------------------------------------------
  function stageRect(cam, c, r, pad = 10) {
    const { x, y } = slot(c, r);
    const a = toStage(cam, x - 60 - pad, y - 85 - pad), z = toStage(cam, x + 60 + pad, y + 85 + pad);
    return { x: a.x, y: a.y, w: z.x - a.x, h: z.y - a.y };
  }

  function ringAt(b, s) {
    const m = T.moves;
    const out = [];
    const path = (q, lost) => {
      if (b < q.from - 0.3 || b > q.to + 0.3) return;
      const a = ramp(b, q.from - 0.3, q.from) * (1 - ramp(b, q.to - 0.3, q.to + 0.3));
      if (REDUCED) { // no wandering: a still dashed frame over the whole wall
        out.push({ rect: { x: 40, y: 30, w: 920, h: 800 }, alpha: a * 0.8, dashed: true });
        return;
      }
      const n = q.path.length, span = (q.to - q.from) / n;
      const i = clamp(Math.floor((b - q.from) / span), 0, n - 1);
      const k = ramp(b - q.from - i * span, 0, span * 0.55, easeIO);
      const p0 = q.path[Math.max(0, i - 1)], p1 = q.path[i];
      const r0 = stageRect(s.cam, p0[0], p0[1]), r1 = stageRect(s.cam, p1[0], p1[1]);
      out.push({ rect: { x: lerp(r0.x, r1.x, i ? k : 1), y: lerp(r0.y, r1.y, i ? k : 1), w: r1.w, h: r1.h }, alpha: a, dashed: true });
    };
    path(m.searchA);
    path(m.searchLost, true);
    const found = (t0, t1, c, r) => {
      if (b < t0 || b > t1) return;
      const a = ramp(b, t0, t0 + 0.25) * (1 - ramp(b, t1 - 0.4, t1));
      const grow = REDUCED ? 1 : lerp(1.18, 1, ramp(b, t0, t0 + 0.9));
      const rc = stageRect(s.cam, c, r, 12);
      const cx = rc.x + rc.w / 2, cy = rc.y + rc.h / 2;
      out.push({ rect: { x: cx - (rc.w * grow) / 2, y: cy - (rc.h * grow) / 2, w: rc.w * grow, h: rc.h * grow }, alpha: a, dashed: false });
    };
    found(m.findB, m.ringBOut, B_SLOT[0], B_SLOT[1]);
    found(m.findA, m.ringAOut, A_SLOT[0], A_SLOT[1]);
    return out;
  }

  function drawOverlays(b, s) {
    const g = ctx, u = L.u;
    g.save();
    g.translate(L.sx, L.sy); g.scale(u, u);

    // rings
    for (const r of ringAt(b, s)) {
      g.globalAlpha = r.alpha; g.strokeStyle = C.ink; g.lineWidth = 3.2;
      g.setLineDash(r.dashed ? [10, 8] : []);
      g.beginPath(); g.roundRect(r.rect.x, r.rect.y, r.rect.w, r.rect.h, 10); g.stroke();
    }
    g.setLineDash([]); g.globalAlpha = 1;

    // survivors: color, forma, nombre (hand view only)
    const sv = T.moves.survivors;
    const out = 1 - ramp(b, sv.out - 0.5, sv.out);
    const fs = 28 * L.ui;
    const label = (txt, x, y, align) => {
      g.font = `500 ${fs}px ${F.mono}`; g.fillStyle = C.ink; g.textAlign = align; g.textBaseline = 'middle';
      g.fillText(txt, x, y);
    };
    const cam = s.cam;
    const P = (x, y) => toStage(cam, packA.x + x, packA.y + y);
    if (b >= sv.color && out > 0) { // color: a swatch pulled from the pack
      const a = ramp(b, sv.color, sv.color + 0.8) * out;
      const k = move(b, sv.color, sv.color + 1.2);
      const from = P(20, 20), to = { x: P(60, 0).x + 70, y: P(0, 40).y };
      g.globalAlpha = a;
      const x = lerp(from.x, to.x, k), y = lerp(from.y, to.y, k);
      g.fillStyle = packA.base; g.strokeStyle = C.ink; g.lineWidth = 2;
      g.beginPath(); g.roundRect(x - 28, y - 28, 56, 56, 6); g.fill(); g.stroke();
      label('color', x + 44, y, 'left');
      g.globalAlpha = 1;
    }
    if (b >= sv.forma && out > 0) { // forma: the silhouette traced crisp
      const k = REDUCED ? 1 : ramp(b, sv.forma, sv.forma + 1.6, easeIO);
      g.globalAlpha = out;
      g.save();
      const o = P(0, 0);
      g.translate(o.x, o.y); g.scale(cam.z, cam.z);
      silhouette(g);
      g.lineWidth = 2.4 / cam.z; g.strokeStyle = C.ink;
      const len = 2 * (120 + 170) + 20;
      g.setLineDash([len * k, len]); g.stroke(); g.setLineDash([]);
      g.restore();
      g.globalAlpha = ramp(b, sv.forma + 0.6, sv.forma + 1.4) * out;
      const lp = P(-60, 0);
      label('forma', lp.x - 26, lp.y, 'right');
      g.globalAlpha = 1;
    }
    if (b >= sv.nombre && out > 0) { // nombre: the logo plate boxed
      const a = ramp(b, sv.nombre, sv.nombre + 0.8) * out;
      g.globalAlpha = a;
      const r0 = P(-34, -64), r1 = P(34, -36);
      g.strokeStyle = C.ink; g.lineWidth = 2.4;
      g.beginPath(); g.roundRect(r0.x, r0.y, r1.x - r0.x, r1.y - r0.y, 6); g.stroke();
      const right = P(60, -50);
      g.beginPath(); g.moveTo(r1.x, (r0.y + r1.y) / 2); g.lineTo(right.x + 40, (r0.y + r1.y) / 2); g.stroke();
      label('nombre', right.x + 54, (r0.y + r1.y) / 2, 'left');
      g.globalAlpha = 1;
    }

    // distance meter (stage band 900..1000)
    const mi = ramp(b, T.moves.meterIn[0], T.moves.meterIn[1]);
    if (mi > 0) {
      g.globalAlpha = mi;
      const x0 = FMT === "16x9" ? 210 : 110, x1 = FMT === "16x9" ? 790 : 890, y = 922;
      g.strokeStyle = C.muted; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
      g.beginPath(); g.moveTo(x0, y - 9); g.lineTo(x0, y + 9); g.moveTo(x1, y - 9); g.lineTo(x1, y + 9); g.stroke();
      const mfs = 26 * L.ui;
      g.font = `400 ${mfs}px ${F.mono}`; g.fillStyle = C.ink2; g.textBaseline = 'top';
      g.textAlign = 'left'; g.fillText('en la mano', x0 - 10, y + 18);
      g.textAlign = 'right'; g.fillText('desde el mostrador', x1 + 10, y + 18);
      g.beginPath(); g.arc(lerp(x0, x1, s.d), y, 11, 0, Math.PI * 2); g.fillStyle = C.ink; g.fill();
      g.globalAlpha = 1;
    }
    g.restore();
  }

  // ---- Words --------------------------------------------------------------------------------
  let FS = null;
  function fontSize() {
    if (FS) return FS;
    ctx.font = `600 100px ${F.display}`;
    let widest = 0;
    for (const e of T.text) for (const l of [e.l1, e.l2]) widest = Math.max(widest, ctx.measureText(l).width);
    FS = Math.min(L.maxFont, (L.tw / widest) * 100);
    return FS;
  }
  function drawText(b) {
    const fs = fontSize(), lh = fs * 1.28;
    const g = ctx;
    for (const e of T.text) {
      if (b < e.in - 0.1 || b > e.out + 0.1) continue;
      const outA = 1 - ramp(b, e.out - 0.5, e.out);
      const lines = [
        { s: e.l1, t: e.in, color: C.ink },
        { s: e.l2, t: e.l2in, color: C.ink2 },
      ];
      let top = L.anchor === 'center' ? L.ty - lh : L.ty;
      lines.forEach((ln, i) => {
        if (b < ln.t) return;
        const a = ramp(b, ln.t, ln.t + 0.6) * outA;
        const dy = REDUCED ? 0 : (1 - ramp(b, ln.t, ln.t + 0.9)) * fs * 0.3;
        g.globalAlpha = a; g.fillStyle = ln.color;
        g.font = `600 ${fs}px ${F.display}`; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
        const y = top + lh * (i + 1) - lh * 0.25 + dy;
        g.fillText(ln.s, L.tx, y);
        if (i === 1 && e.strike !== undefined && b >= e.strike) { // the belief, struck
          const w = g.measureText(ln.s).width;
          const k = REDUCED ? 1 : ramp(b, e.strike, e.strike + 0.8, easeIO);
          g.strokeStyle = C.ink; g.lineWidth = Math.max(3, fs * 0.07);
          g.beginPath(); g.moveTo(L.tx - 4, y - fs * 0.3); g.lineTo(L.tx - 4 + (w + 8) * k, y - fs * 0.3); g.stroke();
        }
      });
      if (e.src && b >= e.l2in) {
        g.globalAlpha = ramp(b, e.l2in + 0.5, e.l2in + 1.1) * outA;
        g.font = `400 ${Math.round(fs * (FMT === '16x9' ? 0.4 : 0.5))}px ${F.mono}`; g.fillStyle = C.muted;
        g.fillText(e.src, L.tx, top + lh * 2 + fs * 0.65);
      }
      g.globalAlpha = 1;
    }
  }

  // ---- Frame --------------------------------------------------------------------------------
  function seek(t) {
    const b = t / T.BEAT;
    const s = state(b);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.filter = 'none';
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);

    drawWorld(b, s);
    const blurPx = s.d * 3.6 * s.cam.z * L.u; // distance blur, in world units scaled to screen
    ctx.save();
    ctx.beginPath(); ctx.rect(L.sx, L.sy, off.width, off.height); ctx.clip();
    ctx.filter = blurPx > 0.05 ? `blur(${blurPx.toFixed(3)}px)` : 'none';
    ctx.drawImage(off, L.sx, L.sy);
    ctx.restore();
    ctx.filter = 'none';

    drawOverlays(b, s);
    drawText(b);

    // reduced motion: camera moves become a dip through the ground color
    if (REDUCED) {
      const dip = (a, z) => { const p = prog(b, a, z); return p > 0 && p < 1 ? 1 - Math.abs(2 * p - 1) : 0; };
      const k = Math.max(dip(T.moves.cameraOut[0], T.moves.cameraOut[1]), dip(T.moves.cameraIn[0], T.moves.cameraIn[1]));
      if (k > 0) { ctx.globalAlpha = k; ctx.fillStyle = C.bg; ctx.fillRect(L.sx, L.sy, L.S, L.S); ctx.globalAlpha = 1; }
    }
    const fo = ramp(b, T.moves.fadeOut[0], T.moves.fadeOut[1]);
    if (fo > 0) { ctx.globalAlpha = fo; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  window.seek = seek;
  window.FRAME = { W, H, FMT, REDUCED };
  window.ready = (async () => {
    const faces = [
      new FontFace('Inter Display', 'url(fonts/InterDisplay-SemiBold.otf)', { weight: '600' }),
      new FontFace('Inter Display', 'url(fonts/InterDisplay-Bold.otf)', { weight: '700' }),
      new FontFace('Inter Display', 'url(fonts/InterDisplay-Black.otf)', { weight: '800 900' }),
      new FontFace('Plex Mono', 'url(fonts/IBMPlexMono-Regular.woff2)', { weight: '400' }),
      new FontFace('Plex Mono', 'url(fonts/IBMPlexMono-Medium.woff2)', { weight: '500' }),
    ];
    for (const f of faces) { await f.load(); document.fonts.add(f); }
    seek(0);
    return true;
  })();
})();
