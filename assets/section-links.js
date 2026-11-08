// Keeps "#" out of the address bar on every page. A "#section" in the address is removed before the page
// renders, and links to a section of the open page scroll without changing the address. Links with "#"
// in the HTML keep working from other pages, in new tabs and without JavaScript.
(() => {
  const decode = value => { try { return decodeURIComponent(value); } catch { return value; } };
  const cleanUrl = () => location.pathname + location.search;
  const removeHash = () => history.replaceState(history.state, '', cleanUrl());
  const hadHash = location.href.includes('#');
  const initial = hadHash ? decode(location.hash.slice(1)) : '';

  // docs-legacy.js reads this to forward links from the old hash-routed documentation.
  window.__initialSection = initial;
  if (hadHash) removeHash();

  if (initial) {
    // Fonts and images move the sections while the page loads, so align again until the visitor takes over.
    let active = true;
    const align = () => { if (active) document.getElementById(initial)?.scrollIntoView({ block: 'start', behavior: 'instant' }); };
    for (const type of ['wheel', 'touchstart', 'keydown']) window.addEventListener(type, () => { active = false; }, { once: true, passive: true });
    document.addEventListener('DOMContentLoaded', align, { once: true });
    window.addEventListener('load', align, { once: true });
    document.fonts?.ready.then(align);
  }

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    if (!url.hash || url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
    const target = document.getElementById(decode(url.hash.slice(1)));
    if (!target) return;
    event.preventDefault();
    history.pushState(history.state, '', cleanUrl());
    // Keyboard focus moves with the jump, as it does with a real "#section" link.
    if (!target.hasAttribute('tabindex')) { target.tabIndex = -1; target.style.outline = 'none'; }
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start' });
  });

  // A "#section" added to the address of the open page does not reload it.
  window.addEventListener('hashchange', removeHash);
})();
