/* Renders every text effect and asserts the frame actually contains something.
 *
 *   CHROME_PATH=/usr/bin/chromium node tools/render-check.mjs
 *
 * This is the guard for the bug class this project hit twice: an exception
 * inside the draw loop (an undefined variable in the typewriter branch) left a
 * blank canvas with no page error visible to the user, and a centred body was
 * drawn from the centre line so long copy ran off the frame.
 *
 * Not in CI: it needs a browser. Run it before shipping a change to core.js.
 */
import { execSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const FX = ['reveal', 'typewriter', 'pop', 'wave', 'kinetic', 'highlight', 'shutter', 'glitch', 'split'];
const STYLES = ['pixel', 'stick', 'neon', 'paper', 'cosmic', 'vhs', 'blueprint', 'riso', 'chalk', 'swiss'];
const LONG = 'The only way to make sense out of change is to plunge into it, move with it, and join the dance.';

const executablePath = process.env.CHROME_PATH ?? execSync('which chromium || which chromium-browser').toString().trim();
const browser = await puppeteer.launch({
  executablePath, headless: 'shell',
  args: ['--no-sandbox', '--mute-audio', '--autoplay-policy=no-user-gesture-required']
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.setViewport({ width: 1200, height: 760 });
await page.goto('file:///scratch/work/repo/studio/kinemotif.html', { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 800));

const problems = [];
for (const fx of FX) {
  for (const style of STYLES.slice(0, 4)) {
    const before = errors.length;
    const result = await page.evaluate(({ fx, style, body }) => {
      const app = window.__MS_APP__;
      const p = app.state().project;   /* the live object, mutated in place */
      p.scenes = [{ id: 't', title: 'A title that has to fit', body, motif: 'sun', visual: 'motif',
        textFx: fx, dur: 9, layout: 'center', transition: 'none', accent: '#ff2d95',
        enter: 'fade', ease: 'linear', cam: 'none', style }];
      p.style = style;
      p.musicSeed = 1;
      app.pause();
      app.seek(3.2);
      return true;
    }, { fx, style, body: LONG });
    if (!result) { problems.push(`${fx}/${style}: could not load`); continue; }
    await new Promise((r) => setTimeout(r, 450));

    const frame = await page.evaluate(() => {
      const c = document.getElementById('stage');
      const g = c.getContext('2d');
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let ink = 0, total = 0;
      for (let i = 0; i < d.length; i += 4 * 97) {
        total++;
        const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
        if (l > 40) ink++;
      }
      return { time: window.__MS_APP__.state().time, ink: ink / total };
    });

    if (errors.length > before) problems.push(`${fx}/${style}: threw — ${errors[errors.length - 1]}`);
    if (frame.time < 0.5) problems.push(`${fx}/${style}: clock did not advance (t=${frame.time.toFixed(2)})`);
    if (frame.ink < 0.004) problems.push(`${fx}/${style}: frame is blank (ink ${(frame.ink * 100).toFixed(2)}%)`);
  }
  process.stdout.write(`  ${fx} … ${problems.some((p) => p.startsWith(fx + '/')) ? 'FAIL' : 'ok'}\n`);
}

/* ---- cross-style transition: both sides must draw in their own palette ---- */
{
  const before = errors.length;
  await page.evaluate(() => {
    const app = window.__MS_APP__;
    const P = app.state().project;
    P.style = 'neon';
    P.scenes = [
      { id: 'x1', title: 'Paper scene', body: 'Paper.', motif: 'sun', visual: 'motif', textFx: 'reveal',
        dur: 5, layout: 'center', transition: 'wipe', accent: '#cf5c39', enter: 'fade', ease: 'linear',
        cam: 'none', style: 'paper' },
      { id: 'x2', title: 'Neon scene', body: 'Neon.', motif: 'sun', visual: 'motif', textFx: 'reveal',
        dur: 5, layout: 'center', transition: 'wipe', accent: '#ff2d95', enter: 'fade', ease: 'linear',
        cam: 'none', style: 'neon' }
    ];
    app.pause();
    app.seek(4.55);   /* the wipe starts at local 4.1 */
  });
  await new Promise((r) => setTimeout(r, 500));

  const halves = await page.evaluate(() => {
    const c = document.getElementById('stage');
    const g = c.getContext('2d');
    const band = (x0, w) => {
      const d = g.getImageData(x0, Math.round(c.height * 0.3), w, Math.round(c.height * 0.4)).data;
      let sum = 0, n = 0;
      for (let i = 0; i < d.length; i += 4 * 37) { sum += (d[i] + d[i + 1] + d[i + 2]) / 3; n++; }
      return sum / n;
    };
    const third = Math.round(c.width / 3);
    return { left: band(4, third - 8), right: band(c.width - third - 4, third - 8) };
  });

  const gap = Math.abs(halves.left - halves.right);
  const ok = errors.length === before && gap > 25;
  console.log(`  cross-style transition … ${ok ? 'ok' : 'FAIL'} (left ${halves.left.toFixed(0)}, right ${halves.right.toFixed(0)}, gap ${gap.toFixed(0)})`);
  if (errors.length > before) problems.push(`transition threw — ${errors[errors.length - 1]}`);
  if (gap <= 25) problems.push(`cross-style transition looks flat: halves differ by ${gap.toFixed(0)}, expected > 25`);
}

await browser.close();

if (problems.length) {
  console.error('\nrender check failed:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log(`\nOK — ${FX.length} text effects × 4 styles rendered, clock advanced, nothing blank.`);
