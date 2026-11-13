/* Parses every inline script in the studio and the examples.
 * Catches a broken build before it reaches Pages.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = ['studio/kinemotif.html'];
if (existsSync(join(root, 'examples'))) {
  for (const f of readdirSync(join(root, 'examples'))) {
    if (f.endsWith('.html')) files.push('examples/' + f);
  }
}

let total = 0;
const problems = [];
for (const file of files) {
  const html = readFileSync(join(root, file), 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  scripts.forEach((src, i) => {
    total++;
    try { new Function(src); }
    catch (err) { problems.push(`${file} script #${i + 1}: ${err.message}`); }
  });
  if (!scripts.length) problems.push(`${file} has no inline scripts`);
}

if (problems.length) {
  problems.forEach((p) => console.error('  ' + p));
  process.exit(1);
}
console.log(`OK — ${total} inline scripts parse across ${files.length} pages.`);
