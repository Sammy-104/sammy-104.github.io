(() => {
  'use strict';
  const main = document.querySelector('main');
  const config = window.PORTFOLIO;
  let initial = true;

  const captionStorageKey = 'samuel-shaw.about-captions.' + (config.aboutCaptionRevision || 'v1');
  let editingCaptions = false;
  let captionSaveState = '';
  let captionEdits = {};
  function readCaptionEdits(value) {
    const result = {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
    config.aboutPhotos.forEach((photo, index) => {
      const item = value[index];
      if (!item || typeof item !== 'object') return;
      const edit = {};
      if (typeof item.title === 'string') edit.title = item.title.slice(0, 80);
      if (typeof item.caption === 'string') edit.caption = item.caption.slice(0, 300);
      result[index] = edit;
    });
    return result;
  }
  try {
    captionEdits = readCaptionEdits(JSON.parse(localStorage.getItem(captionStorageKey) || '{}'));
  } catch { /* Browsers can disable storage for local files. Export is still available. */ }
  function aboutPhoto(index) {
    return { ...config.aboutPhotos[index], ...(captionEdits[index] || {}) };
  }
  function saveCaptionEdits() {
    try {
      localStorage.setItem(captionStorageKey, JSON.stringify(captionEdits));
      captionSaveState = 'Saved in this browser';
    } catch {
      captionSaveState = 'Use Download captions to keep your changes';
    }
    const status = main.querySelector('[data-caption-status]');
    if (status) status.textContent = captionSaveState;
  }
  function downloadCaptions() {
    const payload = { version: 1, photos: config.aboutPhotos.map((photo, index) => ({
      photo: 'about-' + String(index + 1).padStart(2, '0') + '.jpg',
      title: aboutPhoto(index).title || '',
      caption: aboutPhoto(index).caption || ''
    })) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Samuel_Shaw_About_Captions.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const { routes, normalizePath } = window.PortfolioPages;
  const description = document.querySelector('meta[name="description"]');
  const canonical = document.querySelector('link[rel="canonical"]');
  function render() {
    const result = window.PortfolioPages.render(config, location.pathname, { editingCaptions, captionSaveState, captionEdits });
    main.innerHTML = result.html;
    main.dataset.page = result.page;
    document.title = result.title;
    description.content = result.description;
    if (canonical) canonical.href = 'https://samuelshaw.ca' + result.canonicalPath;
    document.querySelectorAll('[data-nav]').forEach(link => {
      if (link.dataset.nav === result.page) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    if (!initial) { window.scrollTo({ top: 0, behavior: 'instant' }); main.focus({ preventScroll: true }); }
    initial = false;
  }
  function migrateHash() {
    if (!location.hash.startsWith('#/')) return false;
    const path = normalizePath(location.hash.slice(1));
    // Unknown legacy links go to the real host's 404 response.
    if (!routes.includes(path)) { location.replace(path); return true; }
    history.replaceState(null, '', path + location.search);
    return false;
  }
  document.addEventListener('click', event => {
    // Leave error-page links native so the next request gets fresh indexing metadata.
    if (!canonical) return;
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.hash || !routes.includes(normalizePath(url.pathname))) return;
    event.preventDefault();
    history.pushState(null, '', normalizePath(url.pathname) + url.search);
    render();
  });
  window.addEventListener('popstate', render);
  window.addEventListener('hashchange', () => {
    if (location.hash.startsWith('#/') && !migrateHash()) render();
  });

  main.addEventListener('click', event => {
    const control = event.target.closest('[data-caption-action]');
    if (!control) return;
    if (control.dataset.captionAction === 'toggle') {
      editingCaptions = !editingCaptions;
      if (!editingCaptions) saveCaptionEdits();
      render();
      main.querySelector('[data-caption-action="toggle"]')?.focus();
    } else if (control.dataset.captionAction === 'download') {
      downloadCaptions();
    }
  });
  main.addEventListener('input', event => {
    const field = event.target.closest('[data-caption-field]');
    if (!field) return;
    const index = Number(field.dataset.captionIndex);
    const key = field.dataset.captionField;
    if (!Number.isInteger(index) || index < 0 || index >= config.aboutPhotos.length || !['title', 'caption'].includes(key)) return;
    const value = field.value.slice(0, key === 'title' ? 80 : 300);
    captionEdits[index] = { ...(captionEdits[index] || {}), [key]: value };
    const window = field.closest('.about-photo');
    if (key === 'title') {
      const title = window.querySelector('.window-title');
      title.textContent = value || 'photo-' + String(index + 1).padStart(2, '0') + '.jpg';
      window.setAttribute('aria-label', title.textContent);
    } else {
      let caption = window.querySelector('figcaption');
      if (value) {
        if (!caption) {
          caption = document.createElement('figcaption');
          window.querySelector('figure').append(caption);
        }
        caption.textContent = value;
      } else {
        caption?.remove();
      }
    }
    saveCaptionEdits();
  });

  const lightbox = document.querySelector('#image-lightbox');
  if (lightbox) {
    main.addEventListener('click', event => {
      const trigger = event.target.closest('[data-full-image]');
      if (!trigger) return;
      const source = trigger.querySelector('img');
      const image = lightbox.querySelector('img');
      image.src = trigger.dataset.fullImage;
      image.alt = source.alt;
      lightbox.querySelector('p').textContent = trigger.parentElement?.querySelector('figcaption')?.textContent || source.alt;
      lightbox.showModal();
    });
    lightbox.querySelector('button').addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
  }
  if (!migrateHash()) render();
})();
