// TIMELINE: every beat, move and cue. Times are in beats; 96 BPM, so 1 beat = 0.625 s.
// Everything on screen and in the soundtrack is a pure function of these values.
(function (root) {
  const BPM = 96;
  const BEAT = 60 / BPM;
  const BEATS = 104; // 65 s

  // Scenes (story arc)
  const scenes = [
    { id: 'S1', name: 'Pregunta', from: 0, to: 18 },
    { id: 'S2', name: 'Modelo', from: 18, to: 36 },
    { id: 'S3', name: 'Prueba', from: 36, to: 64 },
    { id: 'S4', name: 'Giro', from: 64, to: 86 },
    { id: 'S5', name: 'Cierre', from: 86, to: 104 },
  ];

  // On-screen words. Max two lines; each line at most 8 words.
  const text = [
    { in: 1, out: 9.5, l1: 'Creemos que el empaque se lee.', l2: '¿Más claims, más ventas?', l2in: 6 },
    { in: 10.5, out: 18, l1: '1 de cada 3 dólares de consumo masivo', l2: 'en Latinoamérica se gasta en la tiendita.', l2in: 12,
      src: 'Fuente: NielsenIQ · canal tradicional' },
    { in: 19, out: 26, l1: 'Míralo desde el mostrador.', l2: 'Los claims se vuelven ruido.', l2in: 23 },
    { in: 26.5, out: 35, l1: 'A esa distancia sobreviven tres cosas:', l2: 'color, forma y nombre.', l2in: 28 },
    { in: 40, out: 46, l1: 'Así lo ve quien compra.', l2: '¿Cuál es el tuyo?', l2in: 42 },
    { in: 46.5, out: 54, l1: 'Alguien pide: «Dame los azules».', l2: 'El azul se encuentra al instante.', l2in: 50 },
    { in: 54.5, out: 64, l1: 'El tuyo se pierde entre iguales.', l2: 'Sus claims nunca llegan a leerse.', l2in: 58 },
    { in: 65, out: 74, l1: 'Cambia una sola cosa: el color.', l2: 'Mismo estante. Misma distancia.', l2in: 70 },
    { in: 74.5, out: 86, l1: 'Alguien pide: «Dame los naranja».', l2: 'Ahora también te encuentran.', l2in: 78 },
    { in: 88, out: 97, l1: 'El frente es para que te encuentren.', l2: 'Los claims, para cuando estás en la mano.', l2in: 91 },
    { in: 97.5, out: 103.5, l1: 'Haz la prueba del mostrador:', l2: 'aléjate y entrecierra los ojos.', l2in: 99 },
  ];

  // Moves. [from, to] in beats.
  const moves = {
    packEnter: [0, 2],
    claims: [3, 4, 5, 6, 7], // one claim stamped per beat
    meterIn: [18, 19],
    blurOut: [20, 23], // hand -> counter distance
    survivors: { color: 28, forma: 30, nombre: 32, out: 34.5 },
    meterOut: [41, 42], // the meter rests while it doesn't change
    meterBack: [85, 86],
    tagA: [[38.5, 42], [58.5, 63]], // which pack is yours
    cameraOut: [36, 40], // hand view -> wall view
    wallIn: [36, 39.5],
    searchA: { from: 42, to: 45.5, path: [[1, 0], [3, 1], [0, 2], [5, 1], [2, 2]] },
    findB: 48, // ring lands on the blue pack
    nudgeB: [48, 50, 53, 54],
    ringBOut: 53.5,
    searchLost: { from: 55, to: 58.5, path: [[1, 1], [3, 1], [2, 0], [1, 2], [3, 0]] },
    recolor: [67, 69], // the one variable that changes
    findA: 76,
    nudgeA: [76, 78, 85, 86],
    ringAOut: 85.5,
    cameraIn: [86, 90],
    blurIn: [86, 89],
    wallOut: [86, 89],
    fadeOut: [103.2, 104],
  };

  // Sound cues (beats). The motif returns each time the key idea lands.
  const cues = {
    motif: [48, 67, 76, 97],
    stamp: [3, 4, 5, 6, 7],
    swoosh: [[20, 23, -1], [86, 89, 1]],
    reveal: [36],
    search: [42, 42.7, 43.4, 44.1, 44.8, 55, 55.7, 56.4, 57.1, 57.8],
    ping: [48, 76],
  };

  const TIMELINE = { BPM, BEAT, BEATS, DURATION: BEATS * BEAT, scenes, text, moves, cues };
  if (typeof module !== 'undefined') module.exports = TIMELINE;
  root.TIMELINE = TIMELINE;
})(typeof window !== 'undefined' ? window : globalThis);
