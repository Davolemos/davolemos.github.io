// Procedural soundtrack, rendered offline with Web Audio. Tempo-locked to TIMELINE (96 BPM).
// window.renderAudio() -> base64 16-bit stereo WAV at 48 kHz.
(function () {
  const T = window.TIMELINE;
  const SR = 48000;
  const at = (beat) => beat * T.BEAT;
  const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  async function renderAudio() {
    const len = Math.ceil(T.DURATION * SR);
    const ac = new OfflineAudioContext(2, len, SR);
    const master = ac.createGain(); master.gain.value = 0.9;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
    master.connect(comp).connect(ac.destination);

    // seeded noise buffer
    const rnd = mulberry32(96);
    const nb = ac.createBuffer(1, SR * 2, SR);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    const noise = (t, dur) => { const s = ac.createBufferSource(); s.buffer = nb; s.start(t, 0, dur); return s; };

    const pan = (v) => { const p = ac.createStereoPanner(); p.pan.value = v; p.connect(master); return p; };
    const busBed = ac.createGain(); busBed.gain.value = 1; busBed.connect(master);
    // bed fades at the very end
    busBed.gain.setValueAtTime(1, at(T.moves.fadeOut[0]) - 1.5);
    busBed.gain.linearRampToValueAtTime(0.0001, T.DURATION);

    // ---- Pad: one chord every 8 beats (D, Bm7, Gmaj7, A) ----
    const chords = [
      [50, 57, 64, 66], [47, 54, 57, 62], [43, 50, 54, 59], [45, 52, 57, 61],
    ];
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.4;
    const padGain = ac.createGain(); padGain.gain.value = 0.055; lp.connect(padGain).connect(busBed);
    for (let k = 0; k * 8 < T.BEATS; k++) {
      const t0 = at(k * 8), t1 = Math.min(T.DURATION, at(k * 8 + 8) + 1.2);
      const ch = k * 8 >= 96 ? chords[0] : chords[k % 4]; // resolve home for the payoff
      ch.forEach((n, i) => {
        for (const det of [-4, 4]) {
          const o = ac.createOscillator(); o.type = i === 0 ? 'sine' : 'triangle';
          o.frequency.value = hz(n); o.detune.value = det;
          const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0);
          g.gain.linearRampToValueAtTime(1, t0 + 1.2);
          g.gain.setValueAtTime(1, Math.max(t0 + 1.2, t1 - 1.4));
          g.gain.linearRampToValueAtTime(0.0001, t1);
          o.connect(g).connect(lp); o.start(t0); o.stop(t1 + 0.05);
        }
      });
    }

    // ---- Bass: root on every bar ----
    for (let bar = 0; bar * 4 < T.BEATS - 4; bar++) {
      const k = Math.floor(bar / 2);
      const root = (bar * 4 >= 96 ? chords[0] : chords[k % 4])[0] - 12;
      const t0 = at(bar * 4);
      const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = hz(root);
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.16, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
      o.connect(g).connect(busBed); o.start(t0); o.stop(t0 + 1.7);
    }

    // ---- Pulse: soft off-beat shaker from the model onward ----
    for (let b = 10.5; b < 97; b += 1) {
      const t0 = at(b);
      const s = noise(t0, 0.08);
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 7000; bp.Q.value = 1.2;
      const g = ac.createGain(); g.gain.setValueAtTime(0.025, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.07);
      s.connect(bp).connect(g).connect(pan(0.25));
    }

    // ---- Motif: A4 D5 F#5, returns each time the key idea lands ----
    const pluck = (t0, f, gain, dest) => {
      for (const [type, mul, gg] of [['triangle', 1, 1], ['sine', 2, 0.35]]) {
        const o = ac.createOscillator(); o.type = type; o.frequency.value = f * mul;
        const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(gain * gg, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.1);
        o.connect(g).connect(dest); o.start(t0); o.stop(t0 + 1.2);
      }
    };
    T.cues.motif.forEach((b, i) => {
      const notes = i === T.cues.motif.length - 1 ? [69, 74, 78, 81] : [69, 74, 78];
      notes.forEach((n, j) => pluck(at(b + j * 0.5), hz(n), 0.17, pan(-0.1 + j * 0.1)));
    });

    // ---- UI cues: only on actions that carry meaning ----
    T.cues.stamp.forEach((b) => {
      const t0 = at(b);
      const o = ac.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(1500, t0); o.frequency.exponentialRampToValueAtTime(700, t0 + 0.05);
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.09, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
      o.connect(g).connect(pan(0.15)); o.start(t0); o.stop(t0 + 0.1);
    });
    T.cues.strike.forEach((b) => {
      const t0 = at(b), d = 0.5;
      const s = noise(t0, d);
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2;
      bp.frequency.setValueAtTime(1800, t0); bp.frequency.linearRampToValueAtTime(3200, t0 + d);
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.07, t0 + 0.05); g.gain.linearRampToValueAtTime(0.0001, t0 + d);
      s.connect(bp).connect(g).connect(pan(0));
    });
    T.cues.swoosh.forEach(([a, z, dir]) => { // detail leaves (dir -1) or returns (dir 1)
      const t0 = at(a), t1 = at(z);
      const s = noise(t0, t1 - t0);
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.7;
      f.frequency.setValueAtTime(dir < 0 ? 4000 : 300, t0);
      f.frequency.exponentialRampToValueAtTime(dir < 0 ? 300 : 4000, t1);
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.06, t0 + (t1 - t0) * 0.4); g.gain.linearRampToValueAtTime(0.0001, t1);
      s.connect(f).connect(g).connect(pan(0));
    });
    T.cues.reveal.forEach((b) => {
      const t0 = at(b);
      [hz(38), hz(45)].forEach((f) => {
        const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(0.07, t0 + 1.2); g.gain.linearRampToValueAtTime(0.0001, t0 + 2.6);
        o.connect(g).connect(busBed); o.start(t0); o.stop(t0 + 2.7);
      });
    });
    T.cues.search.forEach((b, i) => {
      const t0 = at(b);
      const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = 2200;
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.035, t0 + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
      o.connect(g).connect(pan(i % 2 ? 0.3 : -0.3)); o.start(t0); o.stop(t0 + 0.06);
    });
    T.cues.ping.forEach((b) => {
      const t0 = at(b);
      [[hz(86), 0.07], [hz(93), 0.035]].forEach(([f, gv]) => {
        const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(gv, t0 + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
        o.connect(g).connect(pan(0.2)); o.start(t0); o.stop(t0 + 1.5);
      });
    });

    const buf = await ac.startRendering();
    // encode 16-bit PCM WAV
    const L = buf.getChannelData(0), R = buf.getChannelData(1), n = buf.length;
    const out = new DataView(new ArrayBuffer(44 + n * 4));
    const str = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); str(8, 'WAVE'); str(12, 'fmt ');
    out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 2, true);
    out.setUint32(24, SR, true); out.setUint32(28, SR * 4, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true);
    str(36, 'data'); out.setUint32(40, n * 4, true);
    for (let i = 0, o = 44; i < n; i++, o += 4) {
      out.setInt16(o, Math.max(-1, Math.min(1, L[i])) * 32767, true);
      out.setInt16(o + 2, Math.max(-1, Math.min(1, R[i])) * 32767, true);
    }
    const bytes = new Uint8Array(out.buffer);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  window.renderAudio = renderAudio;
})();
