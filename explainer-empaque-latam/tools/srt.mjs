// Writes out/captions.srt from TIMELINE.text (the on-screen words are the captions; there is no voice-over).
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const T = require('../src/timeline.js');
const ts = (s) => {
  const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
};
const cues = [];
for (const e of T.text) {
  cues.push([e.in, e.l2in, e.l1]);
  const l2 = e.l1 + '\n' + e.l2 + (e.src ? '\n' + e.src : '');
  if (e.strike !== undefined) {
    cues.push([e.l2in, e.strike, l2]);
    cues.push([e.strike, e.out, e.l1 + '\n[tachado] ' + e.l2]);
  } else cues.push([e.l2in, e.out, l2]);
}
const body = cues.map(([a, b, txt], i) => `${i + 1}\n${ts(a * T.BEAT)} --> ${ts(b * T.BEAT)}\n${txt}\n`).join('\n');
fs.writeFileSync(new URL('../out/captions.srt', import.meta.url), body);
console.log(`${cues.length} cues`);
