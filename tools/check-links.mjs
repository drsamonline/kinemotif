/* Verifies that every local href/src resolves, that PAGES.json points at real
 * files, and that the studio stays a genuinely self-contained single file.
 * No browser, no dependencies — runs in CI in about a second.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const strip = (v) => v.split('?')[0].split('#')[0];

const examples = existsSync(join(root, 'examples'))
  ? readdirSync(join(root, 'examples')).filter((f) => f.endsWith('.html')).map((f) => 'examples/' + f)
  : [];
const pages = ['index.html', '404.html', 'studio/kinemotif.html', ...examples];

let checked = 0;
for (const page of pages) {
  const file = join(root, page);
  if (!existsSync(file)) { problems.push(`${page} is missing`); continue; }
  const html = readFileSync(file, 'utf8');
  for (const [, raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|data:|#|\/)/.test(raw)) continue;
    const target = strip(raw);
    if (!target) continue;
    checked++;
    if (!existsSync(resolve(dirname(file), target))) problems.push(`${page} → ${raw}`);
  }
}

/* The single-file promise: the studio must not reach out to the network. */
const studio = readFileSync(join(root, 'studio/kinemotif.html'), 'utf8');
const external = [...studio.matchAll(/<(?:script|link|img|iframe|audio|video)[^>]*(?:src|href)="(https?:[^"]+)"/g)];
if (external.length) external.forEach((m) => problems.push(`studio is not self-contained → ${m[1]}`));
if (/@import\s+url\(\s*['"]?https?:/.test(studio)) problems.push('studio CSS imports a remote stylesheet');

/* PAGES.json must describe real files. */
const pagesJson = JSON.parse(readFileSync(join(root, 'PAGES.json'), 'utf8'));
for (const entry of pagesJson.pages) {
  if (!existsSync(join(root, entry.file))) problems.push(`PAGES.json → ${entry.file} does not exist`);
}

/* Every example must carry its own project data. */
for (const ex of examples) {
  const html = readFileSync(join(root, ex), 'utf8');
  if (!html.includes('window.__SHOW__=')) problems.push(`${ex} has no embedded project`);
  if (!html.includes('__PLAY__')) problems.push(`${ex} is not in play mode`);
}

if (problems.length) {
  console.error(`Problems (${problems.length}):`);
  problems.forEach((p) => console.error('  ' + p));
  process.exit(1);
}
console.log(`OK — ${pages.length} pages, ${checked} local references, ${external.length} external references, ${pagesJson.pages.length} declared pages.`);
