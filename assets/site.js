import { sendContactRequest } from './contact-request.js';

// Interface text for English and Slovak pages; the page language comes from <html lang>.
const text = {
  en: {
    locale: 'en-IE', themeLight: 'Switch to light theme', themeDark: 'Switch to dark theme',
    unitAnnual: '/month, billed annually', unitMonthly: '/month',
    noteAnnual: (total, savings) => `${total} paid upfront for 12 months. Save ${savings} compared with monthly billing.`,
    noteMonthly: 'Billed monthly. Cancel at the end of your billing period.',
    founding: 'Founding Business', business: 'Business', annually: total => `${total} annually, paid upfront`, monthly: total => `${total} monthly`, firstYear: ' · first 12 months',
    contexts: {
      demo: { title: 'Request your Infrayard demo', description: 'See the product in action and discuss your OCI environment in a 30-minute call.', submit: 'Request a demo' },
      business: { title: 'Start with Business', description: 'Discuss your environment, onboarding and the subscription that fits your team.', submit: 'Discuss Business' },
      enterprise: { title: 'Discuss your requirements', description: 'Tell us about your rollout, support and procurement requirements.', submit: 'Send enquiry' },
      evaluation: { title: 'Discuss an evaluation', description: 'Agree the prerequisites and success criteria for an optional guided evaluation in your tenancy.', submit: 'Discuss an evaluation' },
      support: { title: 'Contact support', description: 'Describe the issue and affected release. Keep credentials, tokens and customer data out of this form.', submit: 'Send support request' },
    },
    messageSupport: 'How can we help?', messageDefault: 'What would you like to improve?',
    preview: 'Local preview: no message has been sent. Your entries have been kept so you can review this form.',
    sending: 'Sending…', successSupport: 'Your support request has been received. We’ll reply by email.', success: 'Your request has been received. We’ll email you to arrange the next step.',
    error: email => `We couldn’t send your request. Please try again or email ${email}. Your entries have been kept.`,
  },
  sk: {
    locale: 'sk-SK', themeLight: 'Prepnúť na svetlý motív', themeDark: 'Prepnúť na tmavý motív',
    unitAnnual: '/mesiac pri ročnej platbe', unitMonthly: '/mesiac',
    noteAnnual: (total, savings) => `${total} vopred za 12 mesiacov. Oproti mesačnej platbe ušetríte ${savings}.`,
    noteMonthly: 'Fakturované mesačne. Zrušiť môžete ku koncu fakturačného obdobia.',
    founding: 'Business pre zakladajúcich zákazníkov', business: 'Business', annually: total => `${total} ročne, vopred`, monthly: total => `${total} mesačne`, firstYear: ' · prvých 12 mesiacov',
    contexts: {
      demo: { title: 'Vyžiadajte si demo Infrayard', description: 'Pozrite si produkt v akcii a prejdime spolu vaše prostredie OCI na 30-minútovom hovore.', submit: 'Vyžiadať demo' },
      business: { title: 'Začnite s Business', description: 'Prejdeme si vaše prostredie, onboarding a predplatné, ktoré sedí vášmu tímu.', submit: 'Mám záujem o Business' },
      enterprise: { title: 'Vaše požiadavky', description: 'Napíšte nám, aké máte požiadavky na zavedenie, podporu a obstarávanie.', submit: 'Odoslať dopyt' },
      evaluation: { title: 'Dohodnúť evaluáciu', description: 'Dohodnime si predpoklady a kritériá úspechu pre voliteľnú sprevádzanú evaluáciu vo vašej tenancy.', submit: 'Dohodnúť evaluáciu' },
      support: { title: 'Kontaktovať podporu', description: 'Opíšte problém a dotknuté vydanie. Do formulára nevkladajte prístupové údaje, tokeny ani dáta zákazníkov.', submit: 'Odoslať požiadavku na podporu' },
    },
    messageSupport: 'Ako vám môžeme pomôcť?', messageDefault: 'Čo by ste chceli zlepšiť?',
    preview: 'Lokálny náhľad: nič sa neodoslalo. Vyplnené údaje zostali zachované, aby ste si formulár mohli skontrolovať.',
    sending: 'Odosiela sa…', successSupport: 'Vašu požiadavku na podporu sme prijali. Odpovieme e-mailom.', success: 'Vašu požiadavku sme prijali. Ozveme sa e-mailom a dohodneme ďalší krok.',
    error: email => `Požiadavku sa nepodarilo odoslať. Skúste to znova alebo napíšte na ${email}. Vyplnené údaje zostali zachované.`,
  },
};
// The e-mail subjects stay in English for the team's inbox; [SK] marks an enquiry from the Slovak page.
const subjects = { demo: 'Infrayard demo request', business: 'Infrayard Business enquiry', enterprise: 'Infrayard Enterprise enquiry', evaluation: 'Infrayard evaluation enquiry', support: 'Infrayard support request' };

(() => {
  const doc = document;
  const lang = doc.documentElement.lang === 'sk' ? 'sk' : 'en';
  const t = text[lang];
  const themeButton = doc.querySelector('.theme-toggle');
  const updateThemeLabel = () => {
    if (themeButton) themeButton.setAttribute('aria-label', doc.documentElement.dataset.theme === 'dark' ? t.themeLight : t.themeDark);
  };
  updateThemeLabel();
  themeButton?.addEventListener('click', () => {
    const theme = doc.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    doc.documentElement.dataset.theme = theme;
    doc.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('infrayard-theme', theme); } catch { /* Storage can be disabled. */ }
    updateThemeLabel();
  });

  const menu = doc.getElementById('main-navigation');
  const menuButton = doc.querySelector('.menu-toggle');
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menu?.classList.toggle('is-open', open);
  });
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menu.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }));

  const priceData = doc.getElementById('pricing-data');
  const prices = priceData ? JSON.parse(priceData.textContent) : null;
  const formatMoney = value => new Intl.NumberFormat(t.locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  let billing = 'monthly';
  const foundingInput = doc.getElementById('founding-pricing');
  const renderPrice = () => {
    if (!prices) return;
    const founding = Boolean(foundingInput?.checked);
    const plan = founding ? prices.founding : prices.business;
    const annual = billing === 'annual';
    doc.getElementById('business-price').textContent = formatMoney(annual ? plan.annual / 12 : plan.monthly);
    doc.getElementById('business-unit').textContent = annual ? t.unitAnnual : t.unitMonthly;
    const note = doc.getElementById('business-billing-note');
    note.textContent = annual ? t.noteAnnual(formatMoney(plan.annual), formatMoney(plan.monthly * 12 - plan.annual)) : t.noteMonthly;
    doc.getElementById('founding-period-note').hidden = !founding;
    doc.querySelectorAll('[data-billing]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.billing === billing)));
  };
  doc.querySelectorAll('[data-billing]').forEach(button => button.addEventListener('click', () => {
    billing = button.dataset.billing;
    renderPrice();
  }));
  foundingInput?.addEventListener('change', renderPrice);
  renderPrice();

  const dialog = doc.getElementById('contact-dialog');
  const form = doc.getElementById('contact-form');
  if (!dialog || !form) return;
  const status = doc.getElementById('form-status');
  const submit = form.querySelector('[type=submit]');
  const preview = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) || location.protocol === 'file:';
  let context = 'demo';
  let previousFocus;
  let requestInFlight = false;
  const contexts = t.contexts;
  const setStatus = (message, state) => {
    status.textContent = message;
    status.dataset.state = state;
    status.hidden = false;
  };
  const selectionText = () => {
    if (!prices || context !== 'business') return '';
    const founding = Boolean(foundingInput?.checked);
    const plan = founding ? prices.founding : prices.business;
    const label = founding ? t.founding : t.business;
    return `${label} · ${billing === 'annual' ? t.annually(formatMoney(plan.annual)) : t.monthly(formatMoney(plan.monthly))}${founding ? t.firstYear : ''}`;
  };
  const openContact = requested => {
    if (requestInFlight) return;
    context = Object.hasOwn(contexts, requested) ? requested : 'demo';
    const config = contexts[context];
    previousFocus = doc.activeElement;
    doc.getElementById('contact-title').textContent = config.title;
    doc.getElementById('contact-description').textContent = config.description;
    submit.textContent = config.submit;
    status.hidden = true;
    const support = context === 'support';
    doc.getElementById('company-field').hidden = support;
    form.elements.company.required = !support;
    form.elements.message.required = support;
    doc.getElementById('message-label').textContent = support ? t.messageSupport : t.messageDefault;
    doc.getElementById('message-optional').hidden = support;
    const selection = doc.getElementById('form-selection');
    selection.textContent = selectionText();
    selection.hidden = !selection.textContent;
    doc.getElementById('preview-note').hidden = !preview;
    const email = support ? 'support@infrayard.eu' : 'hello@infrayard.eu';
    const fallback = doc.getElementById('contact-email');
    fallback.textContent = email;
    fallback.href = `mailto:${email}`;
    if (!dialog.open) dialog.showModal();
  };
  const closeContact = () => { if (!requestInFlight) dialog.close(); };
  doc.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click', () => openContact(button.dataset.contact)));
  doc.getElementById('close-contact').addEventListener('click', closeContact);
  dialog.addEventListener('click', event => { if (event.target === dialog) {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeContact();
  } });
  dialog.addEventListener('cancel', event => { if (requestInFlight) event.preventDefault(); });
  dialog.addEventListener('close', () => previousFocus?.focus());
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (requestInFlight || !form.reportValidity()) return;
    if (form.elements.website.value) return;
    if (preview) {
      setStatus(t.preview, 'preview');
      return;
    }
    const email = context === 'support' ? 'support@infrayard.eu' : 'hello@infrayard.eu';
    const data = new FormData(form);
    data.delete('website');
    if (context === 'support') data.delete('company');
    data.set('_subject', subjects[context] + (lang === 'sk' ? ' [SK]' : ''));
    data.set('_template', 'table');
    data.set('request_type', context);
    data.set('language', lang);
    if (selectionText()) data.set('selected_subscription', selectionText());
    const originalLabel = submit.textContent;
    requestInFlight = true;
    submit.disabled = true;
    submit.textContent = t.sending;
    status.hidden = true;
    try {
      await sendContactRequest(email, data);
      setStatus(context === 'support' ? t.successSupport : t.success, 'success');
      form.reset();
    } catch {
      setStatus(t.error(email), 'error');
    } finally {
      requestInFlight = false;
      submit.disabled = false;
      submit.textContent = originalLabel;
    }
  });
  const requested = new URLSearchParams(location.search).get('enquiry');
  if (requested && Object.hasOwn(contexts, requested)) openContact(requested);
})();
