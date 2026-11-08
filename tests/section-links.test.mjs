import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../assets/section-links.js', import.meta.url), 'utf8');
const legacy = await readFile(new URL('../assets/docs-legacy.js', import.meta.url), 'utf8');

function page(address, ids = []) {
  const url = new URL(address);
  const calls = { replaced: [], pushed: [] };
  const location = { href: url.href, hash: url.hash, pathname: url.pathname, search: url.search, origin: url.origin };
  const history = {
    state: null,
    replaceState: (_state, _title, next) => { calls.replaced.push(next); location.href = url.origin + next; location.hash = ''; },
    pushState: (_state, _title, next) => { calls.pushed.push(next); }
  };
  const elements = new Map(ids.map(id => [id, {
    id, style: {}, focused: false, scrolled: 0,
    hasAttribute: () => false,
    focus() { this.focused = true; },
    scrollIntoView() { this.scrolled++; }
  }]));
  const listeners = {};
  const on = (type, listener) => { (listeners[type] ??= []).push(listener); };
  const document = { addEventListener: on, getElementById: id => elements.get(id) ?? null };
  const window = { addEventListener: on };
  runInNewContext(source, { location, history, document, window, URL });
  const click = (href, options = {}) => {
    const link = { href: new URL(href, location.href).href, target: options.target ?? '', hasAttribute: () => false };
    const event = { button: 0, target: { closest: () => link }, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...options.event };
    for (const listener of listeners.click) listener(event);
    return event.defaultPrevented;
  };
  return { calls, window, elements, listeners, click };
}

test('removes the hash from the address and keeps the query', () => {
  const { calls, window } = page('https://www.infrayard.eu/?enquiry=demo#demo');
  assert.deepEqual(calls.replaced, ['/?enquiry=demo']);
  assert.equal(window.__initialSection, 'demo');
});

test('leaves an address without a hash alone', () => {
  const { calls, window } = page('https://www.infrayard.eu/docs/operations/');
  assert.deepEqual(calls.replaced, []);
  assert.equal(window.__initialSection, '');
});

test('a link to a section of the open page scrolls without a hash', () => {
  const { calls, elements, click } = page('https://www.infrayard.eu/docs/operations/', ['backups']);
  assert.equal(click('#backups'), true);
  assert.deepEqual(calls.pushed, ['/docs/operations/']);
  assert.equal(elements.get('backups').scrolled, 1);
  assert.equal(elements.get('backups').focused, true);
});

test('other links keep their normal behaviour', () => {
  const { calls, click } = page('https://www.infrayard.eu/docs/operations/', ['backups']);
  assert.equal(click('/docs/security/#kubernetes-access'), false);
  assert.equal(click('#missing'), false);
  assert.equal(click('#backups', { event: { ctrlKey: true } }), false);
  assert.equal(click('#backups', { target: '_blank' }), false);
  assert.deepEqual(calls.pushed, []);
});

test('old hash-routed documentation links still forward', () => {
  let forwarded;
  const location = { hash: '', replace: target => { forwarded = target; } };
  runInNewContext(legacy, { location, window: { __initialSection: 'kubeconfig' } });
  assert.equal(forwarded, '/docs/security/#kubernetes-access');
});
