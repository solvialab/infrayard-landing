(() => {
  const dialog = document.getElementById('screenshot-dialog');
  const links = [...document.querySelectorAll('[data-screenshot]')];
  if (!dialog || !links.length || typeof dialog.showModal !== 'function') return;

  const image = document.getElementById('screenshot-image');
  const stage = document.getElementById('screenshot-stage');
  const title = document.getElementById('screenshot-title');
  const count = document.getElementById('screenshot-count');
  const original = document.getElementById('screenshot-original');
  const zoom = document.getElementById('screenshot-zoom');
  const status = document.getElementById('screenshot-status');
  // Slovak pages put their labels on the dialog: data-actual, data-fit and data-count.
  const labels = { actual: dialog.dataset?.actual || 'Actual size', fit: dialog.dataset?.fit || 'Fit to screen', count: dialog.dataset?.count || 'SCREENSHOT' };
  let index = 0;
  let zoomed = false;
  let opener;

  const setZoom = value => {
    zoomed = value;
    dialog.classList.toggle('is-zoomed', value);
    zoom.setAttribute('aria-pressed', String(value));
    zoom.textContent = value ? labels.fit : labels.actual;
    stage.scrollTop = 0;
    stage.scrollLeft = 0;
  };
  const show = nextIndex => {
    index = (nextIndex + links.length) % links.length;
    const link = links[index];
    setZoom(false);
    status.hidden = true;
    image.alt = link.querySelector('img').alt;
    image.src = link.href;
    title.textContent = link.dataset.title;
    count.textContent = `${labels.count} ${index + 1} / ${links.length}`;
    original.href = link.href;
  };
  links.forEach((link, linkIndex) => link.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    show(linkIndex);
    dialog.showModal();
    document.documentElement.classList.toggle('screenshot-open', true);
  }));
  document.getElementById('screenshot-close').addEventListener('click', () => dialog.close());
  document.getElementById('screenshot-previous').addEventListener('click', () => show(index - 1));
  document.getElementById('screenshot-next').addEventListener('click', () => show(index + 1));
  zoom.addEventListener('click', () => setZoom(!zoomed));
  image.addEventListener('click', () => setZoom(!zoomed));
  image.addEventListener('error', () => { status.hidden = false; });
  image.addEventListener('load', () => { status.hidden = true; });
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(index + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog || event.target === stage) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.toggle('screenshot-open', false);
    setZoom(false);
    opener?.focus();
  });
})();
