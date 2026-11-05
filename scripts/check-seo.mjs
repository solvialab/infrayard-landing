import { readFile, stat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { site, docs } from '../content/site.mjs';
import { demo, robotsRules } from '../content/seo.mjs';

export async function checkSEO(htmlByPath, root) {
  const errors = [];
  const text = path => readFile(resolve(root, path), 'utf8');
  const exists = async path => { try { return (await stat(path)).isFile(); } catch { return false; } };
  const unescape = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
  const metas = html => new Map([...html.matchAll(/<meta\s+(?:name|property)="([^"]+)"\s+content="([^"]*)"/g)].map(match => [match[1], unescape(match[2])]));
  const urls = new Map(), titles = new Set(), descriptions = new Set();
  const edges = new Map();
  for (const [path, html] of htmlByPath) {
    const file = relative(root, path).replaceAll('\\', '/');
    const route = '/' + file.replace(/(?:^|\/)index\.html$/, match => match.startsWith('/') ? '/' : '');
    const canonical = `${site.origin}${route}`;
    const title = unescape(html.match(/<title>([^<]+)<\/title>/)?.[1] || '');
    const metadata = metas(html);
    const description = metadata.get('description');
    if (titles.has(title)) errors.push(`${file}: duplicate search title`);
    if (descriptions.has(description)) errors.push(`${file}: duplicate search description`);
    titles.add(title); descriptions.add(description);
    if (!/<html\b[^>]*\slang="en"[^>]*>/.test(html)) errors.push(`${file}: missing document language`);
    if (!description || description.length < 50 || description.length > 170) errors.push(`${file}: search description must be 50-170 characters (now ${description?.length ?? 0})`);
    if (!html.includes(`<link rel="canonical" href="${canonical}">`)) errors.push(`${file}: canonical must match the public route ${route}`);
    if (metadata.get('og:url') !== canonical || metadata.get('og:title') !== title || metadata.get('twitter:title') !== title) errors.push(`${file}: inconsistent canonical/social title`);
    if (metadata.get('og:description') !== description || metadata.get('twitter:description') !== description) errors.push(`${file}: inconsistent search/social description`);
    if (metadata.get('og:image') !== `${site.origin}/assets/og-image.png` || !metadata.get('og:image:alt') || !metadata.get('twitter:image:alt')) errors.push(`${file}: incomplete social image`);
    if (!metadata.get('robots')?.includes('max-image-preview:large') || /noindex|nofollow|nosnippet/.test(metadata.get('robots') || '')) errors.push(`${file}: public search previews blocked or restricted`);
    for (const href of ['/llms.txt', '/llms-full.txt', '/ai.md']) if (!html.includes(`href="${href}"`)) errors.push(`${file}: missing crawler reference ${href}`);
    const graphs = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
    const nodes = graphs.flatMap(data => data['@graph'] || [data]);
    const page = nodes.find(node => ['WebPage', 'CollectionPage'].includes(node['@type']));
    if (!page || page.url !== canonical || page.dateModified !== site.updated) errors.push(`${file}: missing or inconsistent WebPage identity/date`);
    if (!nodes.some(node => node['@type'] === 'Organization' && node['@id'] === `${site.origin}/#organization`)) errors.push(`${file}: missing publisher identity`);
    const crumbs = nodes.find(node => node['@type'] === 'BreadcrumbList');
    if (route !== '/' && (!crumbs || crumbs.itemListElement.at(-1).item !== canonical || !html.includes('aria-label="Breadcrumb"'))) errors.push(`${file}: missing matching visible and structured breadcrumbs`);
    for (const node of nodes) {
      if (node.datePublished && node.datePublished > node.dateModified) errors.push(`${file}: publication is after modification`);
      if (['Article', 'TechArticle'].includes(node['@type']) && (!node.headline || !node.author || !node.mainEntityOfPage)) errors.push(`${file}: incomplete article identity`);
      if (node['@type'] === 'VideoObject' && (!node.uploadDate || !node.thumbnailUrl?.length || !node.contentUrl || !node.duration)) errors.push(`${file}: incomplete published video metadata`);
    }
    for (const match of JSON.stringify(graphs).matchAll(/https:\/\/www\.infrayard\.eu\/[^"\s]*/g)) {
      const url = new URL(match[0]);
      const filePath = resolve(root, '.' + url.pathname, ...(url.pathname.endsWith('/') ? ['index.html'] : []));
      if (!await exists(filePath)) errors.push(`${file}: structured data points to missing ${url.pathname}`);
    }
    urls.set(canonical, { path, html, page });
    edges.set(canonical, [...html.matchAll(/\bhref="([^"]+)"/g)].map(match => new URL(unescape(match[1]), canonical).href.split('#')[0].split('?')[0]).filter(url => url.startsWith(site.origin)));
  }
  const sitemap = await text('sitemap.xml');
  const entries = [...sitemap.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>([\s\S]*?)<\/url>/g)];
  const sitemapURLs = entries.map(match => unescape(match[1]));
  if (new Set(sitemapURLs).size !== sitemapURLs.length || sitemapURLs.length !== urls.size) errors.push('Sitemap must contain every canonical HTML page exactly once');
  for (const [, rawURL, modified] of entries) {
    const url = unescape(rawURL);
    if (!urls.has(url) || url.includes('#') || url.includes('?')) errors.push(`Invalid/non-canonical sitemap URL: ${url}`);
    if (modified !== urls.get(url)?.page?.dateModified) errors.push(`Sitemap lastmod differs from page metadata: ${url}`);
  }
  for (const url of urls.keys()) if (!sitemapURLs.includes(url)) errors.push(`Public page missing from sitemap: ${url}`);
  const seen = new Set(), queue = [`${site.origin}/`];
  while (queue.length) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    queue.push(...(edges.get(url) || []).filter(target => urls.has(target) && !seen.has(target)));
  }
  for (const url of urls.keys()) if (!seen.has(url)) errors.push(`Page has no crawlable path from the homepage: ${url}`);
  const videoEntry = entries.find(match => match[1] === `${site.origin}${demo.path}`)?.[3] || '';
  for (const value of [`<video:content_loc>${site.origin}${demo.contentPath}</video:content_loc>`, `<video:thumbnail_loc>${site.origin}${demo.thumbnailPath}</video:thumbnail_loc>`, `<video:duration>${demo.seconds}</video:duration>`]) if (!videoEntry.includes(value)) errors.push('Video sitemap differs from the current demo');
  if (!demo.publishedAt && /<video:publication_date>|"uploadDate"/.test(sitemap + urls.get(site.origin + demo.path)?.html)) errors.push('Unpublished demo must not claim a public upload date');
  const robots = await text('robots.txt');
  if ((robots.match(/^User-agent:/gm) || []).length !== 1 || !robots.includes('User-agent: *\nAllow: /') || !robots.includes(`Sitemap: ${site.origin}/sitemap.xml`)) errors.push('Crawler policy must consistently allow public pages for all bots');
  for (const path of robotsRules.disallow) if (!robots.includes(`Disallow: ${path}\n`)) errors.push(`Missing source-only crawl exclusion: ${path}`);
  for (const path of ['/docs/', '/resources/', '/assets/', demo.path, '/llms.txt', '/llms-full.txt', '/ai.md']) if (robotsRules.disallow.some(prefix => path.startsWith(prefix))) errors.push(`Public asset/page blocked for crawlers: ${path}`);
  const full = await text('llms-full.txt'), facts = await text('ai.md'), short = await text('llms.txt');
  if (full.length < facts.length * 2) errors.push('llms-full.txt must include the complete public documentation');
  for (const page of docs) {
    const url = `${site.origin}/docs/${page.slug ? page.slug + '/' : ''}`;
    if (!full.includes(`Canonical page: ${url}`) || !short.includes(url) || !facts.includes(url)) errors.push(`AI context is missing current documentation: ${url}`);
  }
  for (const match of (full + short + facts).matchAll(/\]\((https:\/\/www\.infrayard\.eu\/[^)]+)\)/g)) {
    const url = new URL(match[1]);
    if (!await exists(resolve(root, '.' + url.pathname, ...(url.pathname.endsWith('/') ? ['index.html'] : [])))) errors.push(`AI context links to missing page: ${url.pathname}`);
  }
  const manifest = JSON.parse(await text('site.webmanifest'));
  if (manifest.name !== site.name || manifest.start_url !== '/') errors.push('Manifest brand or start URL differs');
  const verification = await text('googlebfff5ec03fea908c.html');
  if (verification.trim() !== 'google-site-verification: googlebfff5ec03fea908c.html') errors.push('Existing Google verification token changed');
  return errors;
}
