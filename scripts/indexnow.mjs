// Tell IndexNow search engines (Bing, Yandex, Seznam, Naver and others) which
// public URLs changed. Run after a production deploy, not during the build:
//   npm run indexnow              all URLs from the live sitemap
//   npm run indexnow -- /docs/    only URLs that start with the given paths
// Google does not use IndexNow; it reads sitemap.xml (see SEARCH-CONSOLE.md).
import { site } from '../content/site.mjs';
import { indexNowKey } from '../content/seo.mjs';

const host = new URL(site.origin).host;
const keyLocation = `${site.origin}/${indexNowKey}.txt`;
const key = await fetch(keyLocation).then(response => response.ok ? response.text() : '');
if (key.trim() !== indexNowKey) throw new Error(`Deploy first: ${keyLocation} does not serve the current key`);
const sitemap = await fetch(`${site.origin}/sitemap.xml`).then(response => response.text());
const prefixes = process.argv.slice(2);
const urlList = [...sitemap.matchAll(/<url><loc>([^<]+)<\/loc>/g)].map(match => match[1])
  .filter(url => !prefixes.length || prefixes.some(prefix => new URL(url).pathname.startsWith(prefix)));
if (!urlList.length) throw new Error('No sitemap URLs match');
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: indexNowKey, keyLocation, urlList }),
});
console.log(`IndexNow: submitted ${urlList.length} URLs for ${host}, HTTP ${response.status} ${response.statusText}`);
if (!response.ok && response.status !== 202) process.exitCode = 1;
