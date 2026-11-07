// Creates a local static artifact only. This script has no deployment/network step.
import { cp, mkdir, readdir, rm, lstat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
if (dirname(output) !== root || output === root) throw new Error('Export must stay inside the project dist directory');
try {
  if ((await lstat(output)).isSymbolicLink()) throw new Error('Refusing to replace a symlink as the export directory');
} catch (error) { if (error.code !== 'ENOENT') throw error; }
await rm(output, { force: true, recursive: true });
await mkdir(output);
const entries = await readdir(root);
const rootFiles = entries.filter(name => /^(?:index\.html|404\.html|robots\.txt|sitemap\.xml|ai\.md|llms(?:-full)?\.txt|site\.webmanifest|favicon[^/]*\.(?:png|ico|svg)|google[a-f0-9]+\.html|[a-f0-9]{32}\.txt)$/.test(name));
for (const name of [...rootFiles, '.well-known', 'assets', 'docs', 'resources', 'legal', 'demo', 'sk']) {
  await cp(resolve(root, name), resolve(output, name), { recursive: true, dereference: false, filter: async path => {
    if ((await lstat(path)).isSymbolicLink()) throw new Error(`Public export must not contain symlinks: ${path}`);
    // Source recordings for scripts/mix-demo.py stay local; only the mixed demo video is published.
    if (/[\\/]assets[\\/]final_hq[^\\/]*\.mp4$/.test(path)) return false;
    return true;
  } });
}
console.log(`Prepared public static files in ${output}. Nothing published.`);
