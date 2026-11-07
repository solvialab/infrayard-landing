import { site } from '../content/site.mjs';
import { demo } from '../content/seo.mjs';
import { skDemo } from '../content/sk.mjs';
import { escapeHtml as e, jsonScript } from './templates.mjs';

export const absolute = path => new URL(path, site.origin + '/').href;
export const organization = {
  '@type': 'Organization', '@id': absolute('/#organization'),
  name: site.company, legalName: site.company, url: 'https://solvialab.tech/',
  email: site.email,
  logo: { '@type': 'ImageObject', url: absolute('/assets/infrayard-mark.svg') },
};
const website = {
  '@type': 'WebSite', '@id': absolute('/#website'), name: site.name, alternateName: 'Infrayard by Solvia Lab',
  url: absolute('/'), inLanguage: ['en', 'sk'], publisher: { '@id': organization['@id'] },
};
const locales = { en: 'en_GB', sk: 'sk_SK' };
const imageAlt = {
  en: 'Infrayard — self-service Kubernetes on Oracle Cloud inside your tenancy',
  sk: 'Infrayard — samoobslužný Kubernetes v Oracle Cloud vo vašej tenancy',
};

// The recorded walkthrough appears on the English and the Slovak demo page; the video itself has no narration.
const videos = { [demo.path]: { ...demo, id: '/#product-video' }, [skDemo.path]: { ...demo, ...skDemo, id: skDemo.path + '#product-video' } };

export function graph({ path, title, description, type = 'WebPage', crumbs = [], article, modified = site.updated, extra = [], lang = 'en' }) {
  const url = absolute(path);
  const page = {
    '@type': type, '@id': url + '#webpage', url, name: title, description,
    inLanguage: lang, isPartOf: { '@id': website['@id'] },
    publisher: { '@id': organization['@id'] }, dateModified: modified,
    primaryImageOfPage: { '@type': 'ImageObject', url: absolute('/assets/og-image.png'), width: 1200, height: 630 },
  };
  const nodes = [organization, website, page];
  if (crumbs.length) {
    page.breadcrumb = { '@id': url + '#breadcrumb' };
    nodes.push({ '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', itemListElement: crumbs.map(([name, href], index) => ({ '@type': 'ListItem', position: index + 1, name, item: absolute(href) })) });
  }
  if (article) {
    page.mainEntity = { '@id': url + '#article' };
    nodes.push({
      '@type': article.type || 'Article', '@id': url + '#article', headline: article.headline,
      description, url, mainEntityOfPage: { '@id': page['@id'] }, inLanguage: lang,
      author: { '@id': organization['@id'] }, publisher: { '@id': organization['@id'] },
      image: absolute('/assets/og-image.png'), dateModified: modified,
      ...(article.published ? { datePublished: article.published } : {}),
    });
  }
  const video = videos[path];
  if (video && demo.publishedAt) {
    if (!/^\d{4}-\d{2}-\d{2}(?:T.*(?:Z|[+-]\d{2}:\d{2}))?$/.test(demo.publishedAt) || Number.isNaN(Date.parse(demo.publishedAt))) throw new Error('Use the real ISO publication date for the demo');
    page.mainEntity = { '@id': absolute(video.id) };
    nodes.push({
      '@type': 'VideoObject', '@id': absolute(video.id), name: video.name,
      description: video.description, thumbnailUrl: [absolute(demo.thumbnailPath)],
      contentUrl: absolute(demo.contentPath), url, uploadDate: demo.publishedAt,
      duration: demo.duration, inLanguage: 'en', publisher: { '@id': organization['@id'] },
    });
  }
  return { '@context': 'https://schema.org', '@graph': [...nodes, ...extra] };
}

// `alternates` ({ en, sk } paths) marks a page that exists in both languages; it adds the hreflang links.
export function head({ path, title, description, type = 'website', data, preloadPoster = false, lang = 'en', alternates }) {
  const other = lang === 'sk' ? 'en' : 'sk';
  const languageLinks = alternates
    ? [...['en', 'sk'].map(code => `<link rel="alternate" hreflang="${code}" href="${absolute(alternates[code])}">`), `<link rel="alternate" hreflang="x-default" href="${absolute(alternates.en)}">`].join('\n  ')
    : '';
  return `<title>${e(title)}</title>
  <meta name="description" content="${e(description)}">
  <link rel="canonical" href="${absolute(path)}">
  ${languageLinks}
  <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">
  <meta name="author" content="${e(site.company)}">
  <meta name="theme-color" content="#f7f9fa">
  <link rel="preload" href="/assets/fonts/inter-variable-4.1.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/fonts.css">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon-48x48.png" type="image/png" sizes="48x48">
  <link rel="apple-touch-icon" href="/favicon-192x192.png" sizes="192x192">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="alternate" type="text/plain" href="/llms.txt" title="Infrayard AI summary">
  <link rel="alternate" type="text/plain" href="/llms-full.txt" title="Infrayard full documentation context">
  <link rel="alternate" type="text/markdown" href="/ai.md" title="Infrayard product facts">
  <meta property="og:type" content="${type}">
  <meta property="og:locale" content="${locales[lang]}">
  ${alternates ? `<meta property="og:locale:alternate" content="${locales[other]}">` : ''}
  <meta property="og:title" content="${e(title)}">
  <meta property="og:description" content="${e(description)}">
  <meta property="og:url" content="${absolute(path)}">
  <meta property="og:site_name" content="${site.name}">
  <meta property="og:image" content="${absolute('/assets/og-image.png')}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${imageAlt[lang]}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${e(title)}">
  <meta name="twitter:description" content="${e(description)}">
  <meta name="twitter:image" content="${absolute('/assets/og-image.png')}">
  <meta name="twitter:image:alt" content="${imageAlt[lang]}">
  ${preloadPoster ? `<link rel="preload" as="image" href="${demo.thumbnailPath}" fetchpriority="high">` : ''}
  <script type="application/ld+json">${jsonScript(data)}</script>`.replace(/[\t ]+$/gm, '').replace(/\n{2,}/g, '\n');
}

export function breadcrumb(crumbs, className = 'docs-breadcrumb', label = 'Breadcrumb') {
  return `<nav class="${className}" aria-label="${label}">${crumbs.map(([name, href], index) => `${index ? '<span aria-hidden="true">/</span>' : ''}${index === crumbs.length - 1 ? `<span aria-current="page">${e(name)}</span>` : `<a href="${href}">${e(name)}</a>`}`).join('')}</nav>`;
}

const credit = {
  en: ['Music', 'Trimmed, volume adjusted and faded.'],
  sk: ['Hudba', 'Skrátené, s upravenou hlasitosťou a postupným stlmením.'],
};
export const videoCredit = (lang = 'en') => `<span class="video-music-credit">${credit[lang][0]}: <a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1300046">Dream Culture — Kevin MacLeod</a> · <a href="https://creativecommons.org/licenses/by/4.0/" rel="license">CC BY 4.0</a>. ${credit[lang][1]}</span>`;
