import test from 'node:test';
import assert from 'node:assert/strict';
import { graph, head } from '../scripts/seo.mjs';
import { demo } from '../content/seo.mjs';
import { alternatesFor } from '../content/sk.mjs';

test('an unpublished demo has no invented public upload date; a released demo has complete metadata', () => {
  const previous = demo.publishedAt;
  try {
    demo.publishedAt = null;
    const options = { path: demo.path, title: demo.title, description: demo.description };
    assert.equal(graph(options)['@graph'].some(node => node['@type'] === 'VideoObject'), false);
    demo.publishedAt = '2026-10-17T12:00:00+02:00';
    const nodes = graph(options)['@graph'];
    const video = nodes.find(node => node['@type'] === 'VideoObject');
    assert.equal(video.uploadDate, demo.publishedAt);
    assert.equal(video.contentUrl, 'https://www.infrayard.eu/assets/infrayard-demo-with-music.mp4');
    assert.equal(nodes.find(node => node['@type'] === 'WebPage').mainEntity['@id'], video['@id']);
    assert.ok(video.thumbnailUrl.length && video.duration && video.name);
    demo.publishedAt = 'not-a-publication-date';
    assert.throws(() => graph(options), /real ISO publication date/);
  } finally { demo.publishedAt = previous; }
});

test('editorial text cannot break out of metadata attributes or JSON-LD scripts', () => {
  const injected = 'Example " & <script>alert(1)</script>';
  const options = { path: '/', title: injected, description: injected };
  const html = head({ ...options, data: graph(options) });
  assert.ok(html.includes('&quot; &amp; &lt;script&gt;'));
  assert.equal((html.match(/<script\b/g) || []).length, 1);
  assert.equal((html.match(/<\/script>/g) || []).length, 1);
  const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(data['@graph'].find(node => node['@type'] === 'WebPage').name, injected);
});

test('a translated page names both language versions and English as the default', () => {
  const options = { path: '/sk/', title: 'Slovenský test', description: 'Popis slovenskej stránky na test', lang: 'sk' };
  const html = head({ ...options, data: graph(options), alternates: alternatesFor('/sk/') });
  assert.ok(html.includes('<link rel="alternate" hreflang="en" href="https://www.infrayard.eu/">'));
  assert.ok(html.includes('<link rel="alternate" hreflang="sk" href="https://www.infrayard.eu/sk/">'));
  assert.ok(html.includes('<link rel="alternate" hreflang="x-default" href="https://www.infrayard.eu/">'));
  assert.ok(html.includes('<meta property="og:locale" content="sk_SK">'));
  assert.ok(html.includes('<meta property="og:locale:alternate" content="en_GB">'));
  assert.equal(graph(options)['@graph'].find(node => node['@type'] === 'WebPage').inLanguage, 'sk');
});

test('an English-only page declares no language versions', () => {
  const options = { path: '/docs/', title: 'Docs test', description: 'English documentation page used in a test' };
  const html = head({ ...options, data: graph(options), alternates: alternatesFor('/docs/') });
  assert.equal(html.includes('hreflang'), false);
  assert.equal(html.includes('og:locale:alternate'), false);
});
