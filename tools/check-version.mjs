/* The shipped version must equal the newest changelog entry and the newest tag.
 *
 *   node tools/check-version.mjs
 *
 * Guards the failure this repo actually hit: two versions shipped while the
 * changelog still stopped at the previous one.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];

const changelog = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8');
const top = changelog.match(/^## \[([0-9]+\.[0-9]+\.[0-9]+)\]/m);
if (!top) problems.push('CHANGELOG.md has no versioned section');

const built = readFileSync(resolve(root, 'studio/kinemotif.html'), 'utf8');
const shipped = built.match(/<meta name="version" content="([^"]+)"/);
if (!shipped) problems.push('studio/kinemotif.html has no version meta — rebuild it');

if (top && shipped && top[1] !== shipped[1]) {
  problems.push(`changelog says ${top[1]}, the built studio says ${shipped[1]} — rebuild`);
}

let tag = null;
try {
  tag = execSync('git describe --tags --abbrev=0', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] })
    .toString().trim().replace(/^v/, '');
} catch {
  /* no tags yet is not a failure */
}

if (tag && top && tag !== top[1]) {
  problems.push(`newest tag is v${tag} but the changelog's top entry is ${top[1]}`);
}

if (problems.length) {
  console.error('version check failed:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}

console.log(`OK — version ${top[1]} agrees with the build${tag ? ' and the newest tag' : ''}.`);
