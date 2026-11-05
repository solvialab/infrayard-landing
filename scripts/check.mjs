import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname, extname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { docs, pricing } from '../content/site.mjs';
import { checkSEO } from './check-seo.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
for (const script of ['assets/site.js', 'assets/image-viewer.js', 'assets/docs.js', 'assets/docs-legacy.js', 'assets/theme.js', 'assets/contact-request.js', 'scripts/build.mjs', 'scripts/templates.mjs', 'scripts/preview.mjs', 'scripts/seo.mjs', 'scripts/check-seo.mjs', 'scripts/export.mjs', 'scripts/indexnow.mjs']) {
  const result = spawnSync(process.execPath, ['--check', resolve(root, script)], { encoding: 'utf8' });
  if (result.status !== 0) errors.push(`JavaScript syntax error in ${script}: ${result.stderr}`);
}
const walk = async directory => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') || ['node_modules', 'src', 'content', 'scripts', 'tests', 'vendor', 'dist'].includes(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path)); else files.push(path);
  }
  return files;
};
const files = (await walk(root)).filter(path => extname(path) === '.html' && !/^google[a-f0-9]+\.html$/.test(basename(path)) && path !== resolve(root, '404.html'));
const htmlByPath = new Map(await Promise.all(files.map(async path => [path, await readFile(path, 'utf8')])));
const exists = async path => { try { return await stat(path); } catch { return null; } };
let checkedLinks = 0;
for (const [path, html] of htmlByPath) {
  const name = relative(root, path);
  if ((html.match(/<h1\b/g) || []).length !== 1) errors.push(`${name}: expected one h1`);
  if (/\{\{\w+\}\}/.test(html)) errors.push(`${name}: unresolved template token`);
  if (!/<meta name="description" content="[^"]+"/.test(html)) errors.push(`${name}: missing description`);
  if (!/<link rel="canonical" href="https:\/\/www\.infrayard\.eu\//.test(html)) errors.push(`${name}: missing canonical URL`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  if (new Set(ids).size !== ids.length) errors.push(`${name}: duplicate id`);
  for (const match of html.matchAll(/<script\b[^>]*type="(?:application\/ld\+json|application\/json)"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(match[1]); } catch { errors.push(`${name}: invalid embedded JSON`); }
  }
  for (const match of html.matchAll(/\b(?:href|src|poster)="([^"]+)"/g)) {
    const value = match[1].replaceAll('&amp;', '&');
    if (/^(?:https?:|mailto:|tel:|data:)/.test(value)) continue;
    checkedLinks++;
    const url = new URL(value, 'https://local.test/' + relative(root, path).replaceAll('\\', '/'));
    let target = resolve(root, '.' + decodeURIComponent(url.pathname));
    let info = await exists(target);
    if (info?.isDirectory()) { target = resolve(target, 'index.html'); info = await exists(target); }
    if (!info) { errors.push(`${name}: missing local target ${value}`); continue; }
    if (url.hash && extname(target) === '.html') {
      const targetHtml = htmlByPath.get(target) || await readFile(target, 'utf8');
      const id = decodeURIComponent(url.hash.slice(1));
      if (!targetHtml.includes(`id="${id}"`)) errors.push(`${name}: missing anchor ${value}`);
    }
  }
}
const search = JSON.parse(await readFile(resolve(root, 'docs/search-index.json'), 'utf8'));
const legacySource = await readFile(resolve(root, 'assets/docs-legacy.js'), 'utf8');
for (const match of legacySource.matchAll(/'(\/docs\/[^']*)'/g)) {
  const url = new URL(match[1], 'https://local.test');
  const target = htmlByPath.get(resolve(root, '.' + url.pathname, 'index.html'));
  if (!target || (url.hash && !target.includes(`id="${url.hash.slice(1)}"`))) errors.push(`Broken legacy docs target: ${match[1]}`);
}
for (const result of search) {
  const url = new URL(result.url, 'https://local.test');
  const path = resolve(root, '.' + url.pathname, 'index.html');
  const html = htmlByPath.get(path);
  if (!html || (url.hash && !html.includes(`id="${url.hash.slice(1)}"`))) errors.push(`Search result has no exact target: ${result.url}`);
}
for (const page of docs) {
  const path = resolve(root, 'docs', page.slug, 'index.html');
  if (!htmlByPath.has(path)) errors.push(`Missing documentation page: ${page.slug}`);
}
if (pricing.founding.monthly !== pricing.business.monthly * .6 || pricing.founding.annual !== pricing.business.annual * .6) errors.push('Founding discount differs between billing periods');
const notFound = await readFile(resolve(root, '404.html'), 'utf8');
if (!notFound.includes('<meta name="robots" content="noindex,follow">') || (notFound.match(/<h1\b/g) || []).length !== 1 || notFound.includes('rel="canonical"')) errors.push('404.html must be a single-h1 noindex page without a canonical URL');
for (const match of notFound.matchAll(/\bhref="(\/[^"#]*)"/g)) if (!await exists(resolve(root, '.' + match[1], ...(match[1].endsWith('/') ? ['index.html'] : [])))) errors.push(`404.html: missing local target ${match[1]}`);
const securityTxt = await readFile(resolve(root, '.well-known/security.txt'), 'utf8');
const securityExpires = Date.parse(securityTxt.match(/^Expires: (.+)$/m)?.[1]);
if (!/^Contact: mailto:/m.test(securityTxt) || !(securityExpires > Date.now())) errors.push('security.txt needs a Contact and an Expires date in the future; update site.updated and rebuild');
const { indexNowKey } = await import('../content/seo.mjs');
if (!/^[a-f0-9]{32}$/.test(indexNowKey) || (await readFile(resolve(root, indexNowKey + '.txt'), 'utf8')).trim() !== indexNowKey) errors.push('IndexNow key file is missing or differs from content/seo.mjs');
const publicText = [...htmlByPath.values()].join('\n');
errors.push(...await checkSEO(htmlByPath, root));
if (/list-rate anchor|16,500|39,000|14-day|14 days|first 12 months, paid upfront before access|Get in before the rest/.test(publicText)) errors.push('Stale commercial wording remains');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Checked ${files.length} HTML pages, ${checkedLinks} local references, ${search.length} search targets, canonical/social metadata, crawlability, sitemap, structured data, AI context and pricing consistency.`);
