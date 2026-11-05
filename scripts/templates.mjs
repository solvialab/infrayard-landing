import { site } from '../content/site.mjs';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
export const jsonScript = value => JSON.stringify(value).replaceAll('<', '\\u003c');
export const brand = `<a class="brand" href="/" aria-label="Infrayard home"><img src="/assets/infrayard-mark.svg" alt="" width="36" height="36">Infrayard</a>`;
export const themeToggle = `<button class="icon-button theme-toggle" type="button" aria-label="Switch theme"><svg class="theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20.5 13.2A8.7 8.7 0 0 1 10.8 3.5a8.7 8.7 0 1 0 9.7 9.7Z"/></svg><svg class="theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg></button>`;
const menuIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`;

export const header = `<header class="site-header"><div class="container header-inner">${brand}<nav class="nav-links" id="main-navigation" aria-label="Main navigation"><a href="#product">Product</a><a href="#how-it-works">How it works</a><a href="#pricing">Pricing</a><a href="/docs/">Docs</a></nav><div class="header-actions">${themeToggle}<button class="button compact" data-contact="demo">Request a demo</button><button class="icon-button menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false" aria-controls="main-navigation">${menuIcon}</button></div></div></header>`;

const docsProductLinks = `<a class="small" href="/">Product</a><a class="button compact" href="/?enquiry=demo#demo">Request a demo</a>`;

export const docsHeader = `<header class="site-header docs-header"><div class="container header-inner">
  <div class="docs-brand">${brand}<a class="docs-brand-label" href="/docs/">Documentation</a></div>
  <div class="header-actions"><div class="docs-header-links">${docsProductLinks}</div>${themeToggle}<button class="icon-button docs-menu-toggle" id="docs-menu-toggle" type="button" aria-label="Toggle documentation navigation" aria-expanded="false" aria-controls="docs-navigation">${menuIcon}<span>Docs</span></button></div>
</div></header>`;

export const docsSidebarLinks = `<nav class="docs-sidebar-links" aria-label="Product links">${docsProductLinks}</nav>`;

export const docsFooter = `<footer class="docs-footer">
  <p>Infrayard by Solvia Lab</p>
  <nav aria-label="Documentation footer"><ul>
    <li><a href="/">Product</a></li>
    <li><a href="/docs/subscription/">Plans and licensing</a></li>
    <li><a href="mailto:${site.supportEmail}">Support</a></li>
    <li><a href="/legal/privacy.html">Privacy</a></li>
  </ul></nav>
</footer>`;

export const footer = `<footer class="site-footer"><div class="container"><div class="footer-top"><div>${brand}<p class="footer-description">Self-service OKE provisioning and lifecycle workflows inside your OCI tenancy.</p></div><nav class="footer-links" aria-label="Footer navigation"><a href="/docs/">Documentation</a><a href="/resources/">Resources</a><button type="button" class="text-link footer-support" data-contact="support" style="padding:0;border:0;background:none;color:var(--muted);font:inherit">Support</button><a href="https://solvialab.tech/">Solvia Lab</a><a href="mailto:${site.email}">Contact</a></nav></div><div class="footer-bottom"><span>© 2026 Solvia Lab s.r.o.</span><nav class="footer-legal" aria-label="Legal links"><a href="/legal/privacy.html">Privacy</a><a href="/legal/terms.html">Terms</a><a href="/legal/cookies.html">Cookies</a></nav></div></div></footer>`;

export const contactDialog = `<dialog id="contact-dialog" aria-labelledby="contact-title" aria-describedby="contact-description"><div class="dialog-heading"><h2 id="contact-title">Request your Infrayard demo</h2><button type="button" class="icon-button" id="close-contact" aria-label="Close contact form">×</button></div><p class="dialog-description" id="contact-description">See the product in action and discuss your OCI environment.</p><form id="contact-form" class="contact-form" action="https://formsubmit.co/hello@infrayard.eu" method="post"><p class="form-selection" id="form-selection" hidden></p><div class="field"><label for="contact-name">Full name</label><input id="contact-name" name="name" autocomplete="name" maxlength="150" required></div><div class="field"><label for="contact-email-input">Work email</label><input id="contact-email-input" name="email" type="email" autocomplete="email" maxlength="254" required></div><div class="field" id="company-field"><label for="contact-company">Company</label><input id="contact-company" name="company" autocomplete="organization" maxlength="180" required></div><div class="field"><label for="contact-message"><span id="message-label">What would you like to improve?</span> <span id="message-optional">(optional)</span></label><textarea id="contact-message" name="message" rows="3" maxlength="5000" placeholder="For example: cluster provisioning, access, resource limits or day-to-day OKE operations."></textarea></div><div class="honeypot" aria-hidden="true"><label for="contact-website">Leave this field empty</label><input id="contact-website" name="website" tabindex="-1" autocomplete="off"></div><p id="preview-note" class="preview-note" hidden>Local preview: this form does not send email.</p><p id="form-status" class="form-status" role="status" aria-live="polite" hidden></p><button class="button" type="submit">Request a demo</button><p class="form-privacy">We use these details to respond to your request. <a href="/legal/privacy.html">Privacy policy</a>. You can also email <a id="contact-email" href="mailto:${site.email}">${site.email}</a>.</p></form></dialog>`;
