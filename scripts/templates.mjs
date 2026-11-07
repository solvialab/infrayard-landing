import { site } from '../content/site.mjs';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
export const jsonScript = value => JSON.stringify(value).replaceAll('<', '\\u003c');
const e = escapeHtml;

// Interface text of the shared page parts. Page content lives in src/*.html, src/sk/*.html and content/*.mjs.
export const ui = {
  en: {
    home: '/', homeLabel: 'Infrayard home', skip: 'Skip to content', theme: 'Switch theme', menu: 'Toggle navigation',
    mainNavigation: 'Main navigation', nav: [['#product', 'Product'], ['#how-it-works', 'How it works'], ['#pricing', 'Pricing']],
    docs: 'Docs', documentation: 'Documentation', resources: 'Resources', demo: 'Request a demo', support: 'Support', contact: 'Contact',
    language: 'Language', breadcrumb: 'Breadcrumb', footerNavigation: 'Footer navigation', legalLinks: 'Legal links',
    footerDescription: 'Self-service OKE provisioning and lifecycle workflows inside your OCI tenancy.',
    company: 'https://solvialab.tech/',
    legal: [['/legal/privacy.html', 'Privacy'], ['/legal/terms.html', 'Terms'], ['/legal/cookies.html', 'Cookies']],
  },
  sk: {
    home: '/sk/', homeLabel: 'Infrayard – úvodná stránka', skip: 'Preskočiť na obsah', theme: 'Prepnúť motív', menu: 'Otvoriť alebo zavrieť navigáciu',
    mainNavigation: 'Hlavná navigácia', nav: [['#product', 'Produkt'], ['#how-it-works', 'Ako to funguje'], ['#pricing', 'Cenník']],
    docs: 'Dokumentácia', documentation: 'Dokumentácia', resources: 'Návody', demo: 'Vyžiadať demo', support: 'Podpora', contact: 'Kontakt',
    language: 'Jazyk', breadcrumb: 'Navigačná cesta', footerNavigation: 'Navigácia v pätičke', legalLinks: 'Právne informácie',
    footerDescription: 'Samoobslužné vytváranie a správa OKE klastrov vo vašej OCI tenancy.',
    company: 'https://www.solvialab.tech/sk/',
    legal: [['/sk/legal/privacy.html', 'Ochrana súkromia'], ['/sk/legal/terms.html', 'Podmienky'], ['/sk/legal/cookies.html', 'Cookies']],
  },
};

// Marks a link to an English-only page (docs, guides) on a Slovak page.
export const englishTag = '<small class="lang-tag" title="V angličtine">EN</small>';
const englishLink = (lang, href, label, attributes = '') => lang === 'sk'
  ? `<a href="${href}" hreflang="en"${attributes}>${e(label)} ${englishTag}</a>`
  : `<a href="${href}"${attributes}>${e(label)}</a>`;

// The note on the SK link of pages that exist only in English.
export const skOnlyLandingNote = 'Slovenská verzia webu. Dokumentácia a návody sú len v angličtine.';
const languageNames = { en: 'English', sk: 'Slovenčina' };

// EN/SK switch. The current language is plain text; the other one links to its version of the page,
// or to the Slovak landing page when the page exists only in English.
export const langSwitch = (lang, otherHref, { note, className = '' } = {}) => {
  const item = code => code === lang
    ? `<span lang="${code}" aria-current="true" title="${languageNames[code]}">${code.toUpperCase()}</span>`
    : `<a href="${otherHref}" hreflang="${code}" lang="${code}" title="${e(note || languageNames[code])}">${code.toUpperCase()}</a>`;
  return `<div class="lang-switch${className ? ' ' + className : ''}" role="group" aria-label="${ui[lang].language}">${item('en')}${item('sk')}</div>`;
};

export const brand = (lang = 'en') => `<a class="brand" href="${ui[lang].home}" aria-label="${e(ui[lang].homeLabel)}"><img src="/assets/infrayard-mark.svg" alt="" width="36" height="36">Infrayard</a>`;
export const themeToggle = (lang = 'en') => `<button class="icon-button theme-toggle" type="button" aria-label="${ui[lang].theme}"><svg class="theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20.5 13.2A8.7 8.7 0 0 1 10.8 3.5a8.7 8.7 0 1 0 9.7 9.7Z"/></svg><svg class="theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg></button>`;
const menuIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`;

// Landing and demo header. `base` prefixes the section anchors on pages other than the landing page.
export const header = ({ lang = 'en', base = '', other }) => {
  const t = ui[lang];
  const links = t.nav.map(([hash, label]) => `<a href="${base}${hash}">${e(label)}</a>`).join('') + englishLink(lang, '/docs/', t.docs);
  return `<header class="site-header"><div class="container header-inner">${brand(lang)}<nav class="nav-links" id="main-navigation" aria-label="${t.mainNavigation}">${links}${langSwitch(lang, other, { className: 'lang-switch-menu' })}</nav><div class="header-actions">${langSwitch(lang, other)}${themeToggle(lang)}<button class="button compact" data-contact="demo">${t.demo}</button><button class="icon-button menu-toggle" type="button" aria-label="${t.menu}" aria-expanded="false" aria-controls="main-navigation">${menuIcon}</button></div></div></header>`;
};

// Docs exist only in English; their SK link leads to the Slovak landing page.
const docsProductLinks = `<a class="small" href="/">Product</a><a class="button compact" href="/?enquiry=demo#demo">Request a demo</a>`;
const docsLangSwitch = langSwitch('en', '/sk/', { note: skOnlyLandingNote });

export const docsHeader = `<header class="site-header docs-header"><div class="container header-inner">
  <div class="docs-brand">${brand()}<a class="docs-brand-label" href="/docs/">Documentation</a></div>
  <div class="header-actions"><div class="docs-header-links">${docsProductLinks}</div>${docsLangSwitch}${themeToggle()}<button class="icon-button docs-menu-toggle" id="docs-menu-toggle" type="button" aria-label="Toggle documentation navigation" aria-expanded="false" aria-controls="docs-navigation">${menuIcon}<span>Docs</span></button></div>
</div></header>`;

export const docsSidebarLinks = `<nav class="docs-sidebar-links" aria-label="Product links">${docsProductLinks}${docsLangSwitch}</nav>`;

export const docsFooter = `<footer class="docs-footer">
  <p>Infrayard by Solvia Lab</p>
  <nav aria-label="Documentation footer"><ul>
    <li><a href="/">Product</a></li>
    <li><a href="/docs/subscription/">Plans and licensing</a></li>
    <li><a href="mailto:${site.supportEmail}">Support</a></li>
    <li><a href="/legal/privacy.html">Privacy</a></li>
  </ul></nav>
</footer>`;

const legalNavigation = lang => `<nav class="footer-legal" aria-label="${ui[lang].legalLinks}">${ui[lang].legal.map(([href, label]) => `<a href="${href}">${e(label)}</a>`).join('')}</nav>`;

export const footer = (lang = 'en') => {
  const t = ui[lang];
  return `<footer class="site-footer"><div class="container"><div class="footer-top"><div>${brand(lang)}<p class="footer-description">${e(t.footerDescription)}</p></div><nav class="footer-links" aria-label="${t.footerNavigation}">${englishLink(lang, '/docs/', t.documentation)}${englishLink(lang, '/resources/', t.resources)}<button type="button" class="text-link footer-support" data-contact="support" style="padding:0;border:0;background:none;color:var(--muted);font:inherit">${t.support}</button><a href="${t.company}">Solvia Lab</a><a href="mailto:${site.email}">${t.contact}</a></nav></div><div class="footer-bottom"><span>© 2026 Solvia Lab s.r.o.</span>${legalNavigation(lang)}</div></div></footer>`;
};

// Header and footer of the legal pages and the not-found page.
export const legalHeader = (lang, other, options) => {
  const t = ui[lang];
  return `<header class="site-header legal-header"><div class="container header-inner">${brand(lang)}<div class="header-actions"><nav class="nav-links" aria-label="${t.mainNavigation}">${englishLink(lang, '/docs/', t.docs)}<a href="mailto:${site.email}">${t.contact}</a>${langSwitch(lang, other, options)}</nav>${themeToggle(lang)}</div></div></header>`;
};
export const legalFooter = (lang = 'en') => `<footer class="site-footer"><div class="container footer-bottom" style="margin-top:0;padding-top:0;border:0"><span>© 2026 Solvia Lab s.r.o.</span>${legalNavigation(lang)}</div></footer>`;

const dialogText = {
  en: { title: 'Request your Infrayard demo', close: 'Close contact form', description: 'See the product in action and discuss your OCI environment.', name: 'Full name', email: 'Work email', company: 'Company', message: 'What would you like to improve?', optional: '(optional)', placeholder: 'For example: cluster provisioning, access, resource limits or day-to-day OKE operations.', honeypot: 'Leave this field empty', preview: 'Local preview: this form does not send email.', submit: 'Request a demo', privacy: 'We use these details to respond to your request.', privacyLink: 'Privacy policy', privacyHref: '/legal/privacy.html', alsoEmail: 'You can also email' },
  sk: { title: 'Vyžiadajte si demo Infrayard', close: 'Zavrieť kontaktný formulár', description: 'Pozrite si produkt v akcii a prejdime spolu vaše prostredie OCI.', name: 'Meno a priezvisko', email: 'Pracovný e-mail', company: 'Spoločnosť', message: 'Čo by ste chceli zlepšiť?', optional: '(nepovinné)', placeholder: 'Napríklad: vytváranie klastrov, prístupy, limity zdrojov alebo každodenná prevádzka OKE.', honeypot: 'Toto pole nechajte prázdne', preview: 'Lokálny náhľad: tento formulár neodosiela e-maily.', submit: 'Vyžiadať demo', privacy: 'Tieto údaje použijeme na odpoveď na vašu požiadavku.', privacyLink: 'Ochrana osobných údajov', privacyHref: '/sk/legal/privacy.html', alsoEmail: 'Môžete nám aj napísať na' },
};

export const contactDialog = (lang = 'en') => {
  const t = dialogText[lang];
  return `<dialog id="contact-dialog" aria-labelledby="contact-title" aria-describedby="contact-description"><div class="dialog-heading"><h2 id="contact-title">${e(t.title)}</h2><button type="button" class="icon-button" id="close-contact" aria-label="${e(t.close)}">×</button></div><p class="dialog-description" id="contact-description">${e(t.description)}</p><form id="contact-form" class="contact-form" action="https://formsubmit.co/hello@infrayard.eu" method="post"><p class="form-selection" id="form-selection" hidden></p><div class="field"><label for="contact-name">${e(t.name)}</label><input id="contact-name" name="name" autocomplete="name" maxlength="150" required></div><div class="field"><label for="contact-email-input">${e(t.email)}</label><input id="contact-email-input" name="email" type="email" autocomplete="email" maxlength="254" required></div><div class="field" id="company-field"><label for="contact-company">${e(t.company)}</label><input id="contact-company" name="company" autocomplete="organization" maxlength="180" required></div><div class="field"><label for="contact-message"><span id="message-label">${e(t.message)}</span> <span id="message-optional">${e(t.optional)}</span></label><textarea id="contact-message" name="message" rows="3" maxlength="5000" placeholder="${e(t.placeholder)}"></textarea></div><div class="honeypot" aria-hidden="true"><label for="contact-website">${e(t.honeypot)}</label><input id="contact-website" name="website" tabindex="-1" autocomplete="off"></div><p id="preview-note" class="preview-note" hidden>${e(t.preview)}</p><p id="form-status" class="form-status" role="status" aria-live="polite" hidden></p><button class="button" type="submit">${e(t.submit)}</button><p class="form-privacy">${e(t.privacy)} <a href="${t.privacyHref}">${e(t.privacyLink)}</a>. ${e(t.alsoEmail)} <a id="contact-email" href="mailto:${site.email}">${site.email}</a>.</p></form></dialog>`;
};
