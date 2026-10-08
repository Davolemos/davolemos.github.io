// Render driver. Headless Chrome steps t = n/fps, calls window.seek(t), pipes frames to ffmpeg.
//   node tools/render.mjs video  --fmt 16x9 [--reduced] [--fps 60] [--scale 1] [--out out/master_16x9.mp4] [--audio out/tmp/audio.wav]
//   node tools/render.mjs stills --fmt 16x9 --beats 0,5,12 [--reduced] [--dir stills/16x9]
//   node tools/render.mjs audio  --out out/tmp/bed_raw.wav
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const args = process.argv.slice(2);
const mode = args[0];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : args[i + 1]; };
const flag = (k) => args.includes('--' + k);
const FMT = opt('fmt', '16x9');
const REDUCED = flag('reduced');
const SIZES = { '16x9': [1920, 1080], '9x16': [1080, 1920], '1x1': [1080, 1080] };
const [W, H] = SIZES[FMT];
const TIMELINE = require(path.join(SRC, 'timeline.js'));

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.otf': 'font/otf', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(SRC, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(SRC) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb'] });
const scale = Number(opt('scale', 1));
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: scale });
await page.goto(`http://127.0.0.1:${port}/index.html?fmt=${FMT}&reduced=${REDUCED ? 1 : 0}`);
await page.evaluate(() => window.ready);

const shot = async (t) => {
  await page.evaluate((t) => window.seek(t), t);
  return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
};

if (mode === 'audio') {
  const out = path.resolve(ROOT, opt('out', 'out/tmp/bed_raw.wav'));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const b64 = await page.evaluate(() => window.renderAudio());
  fs.writeFileSync(out, Buffer.from(b64, 'base64'));
  console.log('audio ->', path.relative(ROOT, out));
} else if (mode === 'stills') {
  const dir = path.resolve(ROOT, opt('dir', `stills/${FMT}${REDUCED ? '_reduced' : ''}`));
  fs.mkdirSync(dir, { recursive: true });
  for (const b of opt('beats', '0').split(',').map(Number)) {
    const png = await shot(b * TIMELINE.BEAT);
    const name = `b${String(b.toFixed(1)).padStart(5, '0')}.png`;
    fs.writeFileSync(path.join(dir, name), png);
  }
  console.log('stills ->', path.relative(ROOT, dir));
} else if (mode === 'video') {
  const fps = Number(opt('fps', 60));
  const out = path.resolve(ROOT, opt('out', `out/master_${FMT}.mp4`));
  const audio = opt('audio', null);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const n = Math.round(TIMELINE.DURATION * fps);
  const ff = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-'];
  if (audio) ff.push('-i', path.resolve(ROOT, audio));
  if (scale !== 1) ff.push('-vf', `scale=${W}:${H}:flags=lanczos`);
  ff.push('-c:v', 'libx264', '-crf', opt('crf', '16'), '-preset', opt('preset', 'medium'), '-pix_fmt', 'yuv420p', '-r', String(fps));
  if (audio) ff.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
  ff.push('-movflags', '+faststart', out);
  const proc = spawn('ffmpeg', ff, { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const png = await shot(i / fps);
    if (!proc.stdin.write(png)) await new Promise((r) => proc.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`${FMT}${REDUCED ? ' reduced' : ''}: frame ${i}/${n} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  proc.stdin.end();
  await new Promise((r, j) => proc.on('close', (c) => (c === 0 ? r() : j(new Error('ffmpeg ' + c)))));
  console.log('video ->', path.relative(ROOT, out));
}
await browser.close();
server.close();
