(() => {
  const sidebar = document.getElementById('docs-navigation');
  const toggle = document.getElementById('docs-menu-toggle');
  const backdrop = document.getElementById('docs-backdrop');
  const main = document.getElementById('main');
  const narrowScreen = matchMedia('(max-width: 780px)');
  const menuIsOpen = () => toggle?.getAttribute('aria-expanded') === 'true';
  const setMenuOpen = (open, restoreFocus = true) => {
    toggle.setAttribute('aria-expanded', String(open));
    sidebar.classList.toggle('is-open', open);
    if (backdrop) backdrop.hidden = !open;
    main.inert = open;
    if (open) sidebar.focus({ preventScroll: true });
    else if (restoreFocus) toggle.focus({ preventScroll: true });
  };
  toggle?.addEventListener('click', () => {
    setMenuOpen(!menuIsOpen());
  });
  backdrop?.addEventListener('click', () => setMenuOpen(false));
  sidebar?.addEventListener('click', event => {
    if (menuIsOpen() && event.target.closest('a[href]')) setMenuOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuIsOpen()) setMenuOpen(false);
  });
  narrowScreen.addEventListener('change', event => {
    if (!event.matches && menuIsOpen()) setMenuOpen(false, false);
  });
  document.querySelectorAll('.docs-content pre').forEach(pre => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code';
    button.textContent = 'Copy command';
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pre.querySelector('code').textContent);
        button.textContent = 'Copied';
        setTimeout(() => { button.textContent = 'Copy command'; }, 1800);
      } catch { button.textContent = 'Select and copy the command'; }
    });
    pre.prepend(button);
  });

  const search = document.getElementById('docs-search');
  const panel = document.getElementById('search-results');
  let index;
  let pending;
  let generation = 0;
  const loadIndex = () => pending ??= fetch('/docs/search-index.json').then(response => {
    if (!response.ok) throw new Error('Search unavailable');
    return response.json();
  }).then(data => index = data).catch(error => { pending = undefined; throw error; });
  const escape = text => text.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  search?.addEventListener('input', async () => {
    const revision = ++generation;
    const query = search.value.trim().toLowerCase();
    if (query.length < 2) { panel.hidden = true; return; }
    try {
      const records = index || await loadIndex();
      if (revision !== generation) return;
      const words = query.split(/\s+/);
      const matches = records.map(record => {
        const haystack = `${record.title} ${record.heading} ${record.text}`.toLowerCase();
        const score = words.every(word => haystack.includes(word)) ? words.reduce((total, word) => total + (record.heading.toLowerCase().includes(word) ? 4 : 0) + (record.title.toLowerCase().includes(word) ? 2 : 0) + 1, 0) : 0;
        return { ...record, score };
      }).filter(record => record.score).sort((a, b) => b.score - a.score).slice(0, 8);
      panel.innerHTML = '<h2>Search results</h2>' + (matches.length ? matches.map(record => {
        const lower = record.text.toLowerCase();
        const position = Math.max(0, lower.indexOf(words[0]));
        const start = Math.max(0, position - 45);
        const snippet = (start ? '…' : '') + record.text.slice(start, start + 180) + (record.text.length > start + 180 ? '…' : '');
        return `<a class="search-result" href="${escape(record.url)}"><strong>${escape(record.title)} · ${escape(record.heading)}</strong><span>${escape(snippet)}</span></a>`;
      }).join('') : '<p class="search-empty">No matching sections. Try a shorter phrase, or contact support.</p>');
      panel.hidden = false;
    } catch {
      if (revision !== generation) return;
      panel.innerHTML = '<p class="search-empty">Search is temporarily unavailable. Use the page navigation or contact support.</p>';
      panel.hidden = false;
    }
  });
})();
