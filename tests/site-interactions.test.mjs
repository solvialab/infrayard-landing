import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { pricing } from '../content/site.mjs';

const source = (await readFile(new URL('../assets/site.js', import.meta.url), 'utf8')).replace(/^import[^\n]+\n/, '');

// A small DOM adapter exercises the actual event handlers without a browser or network.
function fixture({ hostname = 'www.infrayard.eu', sender = async () => ({ success: true }), lang = 'en' } = {}) {
  class Element {
    constructor() { this.dataset = {}; this.attributes = {}; this.listeners = {}; this.hidden = false; this.checked = false; this.value = ''; this.textContent = ''; this.classList = { toggle() {}, remove() {} }; }
    addEventListener(type, listener) { (this.listeners[type] ??= []).push(listener); }
    setAttribute(name, value) { this.attributes[name] = value; }
    getAttribute(name) { return this.attributes[name]; }
    async fire(type) { for (const listener of this.listeners[type] || []) await listener({ target: this, preventDefault() {} }); }
    showModal() { this.open = true; }
    close() { this.open = false; }
    focus() {}
  }
  const ids = new Map();
  for (const id of ['pricing-data', 'founding-pricing', 'business-price', 'business-unit', 'business-billing-note', 'founding-period-note', 'contact-dialog', 'contact-form', 'form-status', 'contact-title', 'contact-description', 'company-field', 'message-label', 'message-optional', 'form-selection', 'preview-note', 'contact-email', 'close-contact']) ids.set(id, new Element());
  ids.get('pricing-data').textContent = JSON.stringify(pricing);
  const submit = new Element();
  const form = ids.get('contact-form');
  form.elements = Object.fromEntries(['name', 'email', 'company', 'message', 'website'].map(name => [name, new Element()]));
  Object.assign(form.elements.name, { value: 'Local test' });
  Object.assign(form.elements.email, { value: 'test@example.com' });
  Object.assign(form.elements.company, { value: 'Example company' });
  Object.assign(form.elements.message, { value: 'Please keep this message on failure.' });
  form.querySelector = () => submit;
  form.reportValidity = () => true;
  form.resetCount = 0;
  form.reset = () => { form.resetCount++; Object.values(form.elements).forEach(element => { element.value = ''; }); };
  const billing = ['monthly', 'annual'].map(period => Object.assign(new Element(), { dataset: { billing: period } }));
  const contacts = Object.fromEntries(['demo', 'business', 'enterprise', 'evaluation', 'support'].map(context => [context, Object.assign(new Element(), { dataset: { contact: context } })]));
  class FormValues {
    constructor(element) { this.values = new Map(Object.entries(element.elements).map(([name, value]) => [name, value.value])); }
    set(name, value) { this.values.set(name, value); }
    delete(name) { this.values.delete(name); }
    get(name) { return this.values.get(name); }
  }
  const document = {
    documentElement: Object.assign(new Element(), { lang }), activeElement: new Element(),
    getElementById: id => ids.get(id) || null,
    querySelector: () => null,
    querySelectorAll: selector => selector === '[data-billing]' ? billing : selector === '[data-contact]' ? Object.values(contacts) : [],
  };
  runInNewContext(source, { document, Intl, FormData: FormValues, URLSearchParams, location: { hostname, protocol: 'https:', search: '' }, sendContactRequest: sender });
  return { ids, billing, contacts, form, submit };
}

test('pricing controls show all four real billing combinations correctly', async () => {
  const { ids, billing } = fixture();
  assert.equal(ids.get('business-price').textContent, '€3,000');
  await billing[1].fire('click');
  assert.equal(ids.get('business-price').textContent, '€2,500');
  assert.match(ids.get('business-billing-note').textContent, /€30,000 paid upfront/);
  const founding = ids.get('founding-pricing');
  founding.checked = true;
  await founding.fire('change');
  assert.equal(ids.get('business-price').textContent, '€1,500');
  assert.match(ids.get('business-billing-note').textContent, /€18,000 paid upfront/);
  assert.equal(ids.get('founding-period-note').hidden, false);
  await billing[0].fire('click');
  assert.equal(ids.get('business-price').textContent, '€1,800');
  assert.match(ids.get('business-billing-note').textContent, /Billed monthly/);
  founding.checked = false;
  await founding.fire('change');
  assert.equal(ids.get('business-price').textContent, '€3,000');
  assert.equal(ids.get('founding-period-note').hidden, true);
});

test('a Business enquiry carries the selected founding annual price', async () => {
  let sent;
  const ui = fixture({ sender: async (email, values) => { sent = { email, values }; } });
  await ui.billing[1].fire('click');
  ui.ids.get('founding-pricing').checked = true;
  await ui.ids.get('founding-pricing').fire('change');
  await ui.contacts.business.fire('click');
  await ui.form.fire('submit');
  assert.match(sent.values.get('selected_subscription'), /Founding Business.*€18,000 annually.*first 12 months/);
  assert.equal(sent.email, 'hello@infrayard.eu');
  assert.equal(ui.ids.get('form-status').dataset.state, 'success');
  assert.equal(ui.form.resetCount, 1);
});

test('form failure retains data and never shows success', async () => {
  const ui = fixture({ sender: async () => { throw new Error('processor unavailable'); } });
  await ui.contacts.demo.fire('click');
  await ui.form.fire('submit');
  assert.equal(ui.form.resetCount, 0);
  assert.equal(ui.form.elements.message.value, 'Please keep this message on failure.');
  assert.equal(ui.ids.get('form-status').dataset.state, 'error');
  assert.equal(ui.submit.disabled, false);
});

test('localhost never invokes the production sender', async () => {
  let calls = 0;
  const ui = fixture({ hostname: '127.0.0.1', sender: async () => { calls++; } });
  await ui.contacts.demo.fire('click');
  await ui.form.fire('submit');
  assert.equal(calls, 0);
  assert.equal(ui.form.resetCount, 0);
  assert.equal(ui.ids.get('form-status').dataset.state, 'preview');
});

test('support uses its own destination and excludes hidden sales fields', async () => {
  let sent;
  const ui = fixture({ sender: async (email, values) => { sent = { email, values }; } });
  await ui.contacts.support.fire('click');
  assert.equal(ui.form.elements.company.required, false);
  assert.equal(ui.form.elements.message.required, true);
  await ui.form.fire('submit');
  assert.equal(sent.email, 'support@infrayard.eu');
  assert.equal(sent.values.get('company'), undefined);
  assert.equal(sent.values.get('selected_subscription'), undefined);
});

test('the Slovak page shows Slovak prices and texts and marks the enquiry', async () => {
  let sent;
  const ui = fixture({ lang: 'sk', sender: async (email, values) => { sent = { email, values }; } });
  assert.match(ui.ids.get('business-price').textContent, /^3\s000\s€$/u);
  assert.equal(ui.ids.get('business-unit').textContent, '/mesiac');
  await ui.billing[1].fire('click');
  assert.match(ui.ids.get('business-price').textContent, /^2\s500\s€$/u);
  assert.match(ui.ids.get('business-billing-note').textContent, /30\s000\s€ vopred za 12 mesiacov/u);
  await ui.contacts.business.fire('click');
  assert.equal(ui.ids.get('contact-title').textContent, 'Začnite s Business');
  assert.equal(ui.submit.textContent, 'Mám záujem o Business');
  await ui.form.fire('submit');
  assert.equal(sent.values.get('_subject'), 'Infrayard Business enquiry [SK]');
  assert.equal(sent.values.get('language'), 'sk');
  assert.match(sent.values.get('selected_subscription'), /^Business · 30\s000\s€ ročne, vopred$/u);
  assert.match(ui.ids.get('form-status').textContent, /Vašu požiadavku sme prijali/);
});

test('the English page keeps English subjects without a language mark', async () => {
  let sent;
  const ui = fixture({ sender: async (email, values) => { sent = { email, values }; } });
  await ui.contacts.demo.fire('click');
  await ui.form.fire('submit');
  assert.equal(sent.values.get('_subject'), 'Infrayard demo request');
  assert.equal(sent.values.get('language'), 'en');
});
