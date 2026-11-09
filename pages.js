/* Shared renderer: used by the static build and browser navigation. */
(() => {
  'use strict';
  const routes = ['/', '/about/', '/projects/', '/projects/vollo/', '/projects/library/'];
  function normalizePath(value) {
    let path = value.replace(/\/index\.html$/, '/').replace(/\/+$/, '') || '/';
    if (path === '/projects/drift') path = '/projects/vollo';
    return path === '/' ? '/' : path + '/';
  }
  function render(config, rawPath, state = {}) {
    const { editingCaptions = false, captionSaveState = '', captionEdits = {} } = state;
    const aboutPhoto = index => ({ ...config.aboutPhotos[index], ...(captionEdits[index] || {}) });
    const canonicalPath = normalizePath(rawPath);
    const publicPath = canonicalPath.replace(/\/$/, '') || '/';
    const path = publicPath === '/projects/vollo' ? '/projects/drift' : publicPath;
    let notFound = false;
  function captionFields(index) {
    const photo = aboutPhoto(index);
    return '<div class="caption-editor"><label for="photo-title-' + index + '">Window label<input id="photo-title-' + index + '" type="text" maxlength="80" data-caption-index="' + index + '" data-caption-field="title" value="' + escape(photo.title || '') + '"></label><label for="photo-caption-' + index + '">Caption <span class="caption-optional">(optional)</span><textarea id="photo-caption-' + index + '" maxlength="300" rows="2" data-caption-index="' + index + '" data-caption-field="caption" placeholder="Write a caption...">' + escape(photo.caption || '') + '</textarea></label></div>';
  }
  function aboutPhotoWindow(index) {
    const photo = { ...aboutPhoto(index), priority: index === 0 };
    let html = mediaWindow('photo-' + String(index + 1).padStart(2, '0') + '.jpg', photo, 'about-photo about-photo-' + (index + 1));
    if (editingCaptions) html = html.replace('</section>', captionFields(index) + '</section>');
    return html;
  }
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const arrow = '<span aria-hidden="true">&#8599;</span>';
  const bullets = items => `<ul class="notes-list">${items.map(x=>x === 'Searching for spring 2027 internships.' ? `<li class="internship-highlight"><span>${escape(x)}</span></li>` : `<li>${escape(x)}</li>`).join('')}</ul>`;

  function frame(title, body, className = '', label = title) {
    return `<section class="window ${className}" aria-label="${escape(label)}"><div class="window-chrome"><span class="window-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="window-title">${escape(title)}</span><span class="window-corner" aria-hidden="true">&#8599;</span></div>${body}</section>`;
  }

  function mediaWindow(title, item, className = '', kind = 'photo') {
    let content;
    if (item?.type === 'image' && item.src) {
      const dimensions = item.width && item.height ? ` width="${item.width}" height="${item.height}"` : '';
      const candidates = item.previews ? [...item.previews, { src: item.src, width: item.width }] : [];
      const sizes = className.includes('about-photo')
        ? '(max-width: 720px) calc(100vw - 52px), (max-width: 960px) calc((100vw - 84px) / 2), 350px'
        : '(max-width: 720px) calc(100vw - 52px), 600px';
      const responsive = candidates.length
        ? ` srcset="${candidates.map(image => escape(image.src) + ' ' + image.width + 'w').join(', ')}" sizes="${sizes}"`
        : '';
      const loading = item.priority ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
      content = `<figure class="media-figure"><button class="media-image-link" type="button" data-full-image="${escape(item.src)}" aria-label="Open full size: ${escape(item.alt || item.title || title)}"><img src="${escape(item.src)}"${responsive}${dimensions} alt="${escape(item.alt || '')}" ${loading} decoding="async"><span class="image-open-hint">open full size &#8599;</span></button>${item.caption ? `<figcaption>${escape(item.caption)}</figcaption>` : ''}</figure>`;
    } else if (item?.type === 'video' && item.src) {
      content = `<figure class="media-figure"><video controls preload="metadata" ${item.poster ? `poster="${escape(item.poster)}"` : ''}><source src="${escape(item.src)}" type="video/mp4">Your browser cannot play this video.</video>${item.caption ? `<figcaption>${escape(item.caption)}</figcaption>` : ''}</figure>`;
    } else {
      content = `<div class="empty-media ${kind === 'video' ? 'empty-video' : ''}"><span class="placeholder-symbol" aria-hidden="true">${kind === 'video' ? '▷' : '＋'}</span><span>${kind === 'video' ? 'video' : kind === 'screenshot' ? 'screenshot' : 'photo'} to come</span></div>`;
    }
    return frame(item?.title || title, content, `media-window ${className}`);
  }

  function projectGlyph(id) {
    if (id === 'drift') {
      return '<span class="project-glyph vollo-glyph" aria-hidden="true"><span class="vollo-logo-mark" style="background-image:url(&quot;' + escape(config.projects.drift.logo.src) + '&quot;)"></span></span>';
    }
    return '<span class="project-glyph peach" aria-hidden="true">&#9835;</span>';
  }

  function recent() {
    return frame('recent-projects', `<div class="recent-body"><p class="small-label">a couple things i've made</p><a class="recent-project" href="/projects/vollo/">${projectGlyph('drift')}<span><strong>Vollo</strong><small>files, minus the fuss</small></span>${arrow}</a><a class="recent-project" href="/projects/library/">${projectGlyph('library')}<span><strong>Digital Music Library</strong><small>sheet music, organized</small></span>${arrow}</a><a class="text-link all-projects" href="/projects/">all projects <span aria-hidden="true">→</span></a></div>`, 'recent-window');
  }

  function home() {
    return `<div class="desktop home-desktop">${frame('hello.txt', `<div class="intro-body"><h1>hey, i'm <span class="name-highlight">sam.</span></h1>${bullets([
      'Studying Mechatronics Engineering at the University of Waterloo.',
      'Into software, robotics, and learning how things work.',
      'Searching for spring 2027 internships.',
      'Currently working on Vollo, a file and message sharing app.'
    ])}<a class="button" href="/about/">more about me <span aria-hidden="true">↗</span></a></div>`, 'intro-window', 'Introduction')}${recent()}</div>`;
  }


  function about() {
    return '<div class="about-toolbar"><a class="back-link" href="/">&#8592; back home</a><h1 class="sr-only">About</h1><div class="caption-toolbar"><button type="button" class="caption-button" data-caption-action="toggle" aria-pressed="' + editingCaptions + '">' + (editingCaptions ? 'Done' : 'Edit captions') + '</button><button type="button" class="caption-button secondary" data-caption-action="download">Download captions</button></div></div><div class="caption-status" data-caption-status role="status" aria-live="polite">' + escape(captionSaveState) + '</div><div class="desktop about-desktop">' + config.aboutPhotos.map((photo, index) => aboutPhotoWindow(index)).join('') + '</div>';
  }


  function projectCard(id) {
    const p = config.projects[id];
    return frame(`${p.filename}.project`, `<div class="project-card-body"><div class="card-head">${projectGlyph(id)}<span class="small-label">${escape(p.category)}</span></div><h2><a href="/projects/${id === 'drift' ? 'vollo' : id}/">${escape(p.name)}</a></h2><p>${escape(p.description)}</p><a class="card-preview has-image" href="/projects/${id === 'drift' ? 'vollo' : id}/" aria-label="View ${escape(p.name)}"><img src="${escape(p.media[0].previews?.[1]?.src || p.media[0].src)}" width="${p.media[0].width}" height="${p.media[0].height}" alt="${escape(p.media[0].alt)}" loading="lazy" decoding="async"></a><a class="text-link" href="/projects/${id === 'drift' ? 'vollo' : id}/">take a look ${arrow}</a></div>`, `project-card ${id}-card`);
  }

  function projects() {
    return `${frame('projects.txt', '<div class="page-heading"><a class="back-link" href="/">&#8592; back home</a><h1>a few things <em>i&#39;ve made.</em></h1></div>', 'heading-window', 'Projects')}<div class="desktop projects-desktop">${projectCard('library')}${projectCard('drift')}</div>`;
  }

  function detail(id) {
    const p = config.projects[id];
    return `<div class="project-desktop project-desktop-${id === 'drift' ? 'vollo' : 'library'}">${frame(`${p.filename}.txt`, `<div class="page-heading detail-heading"><a class="back-link" href="/projects/">&#8592; all projects</a><h1>${escape(p.name)}<span class="heading-period">.</span></h1><p>${escape(p.introduction)}</p></div>`, 'heading-window', p.name)}<div class="desktop detail-desktop">${frame('the-short-version.txt', `<div class="detail-notes"><p class="eyebrow">what it is</p><h2>${id === 'drift' ? 'Send it over.' : 'A place for every score.'}</h2>${bullets(p.overview)}</div>`, 'overview-window')}${mediaWindow(`${p.filename}-01.png`, p.media[0], 'detail-photo-one', 'screenshot')}${frame(id === 'drift' ? 'project-lessons.txt' : 'behind-the-project.txt', `<div class="detail-notes"><p class="eyebrow">${id === 'drift' ? 'looking back' : 'a few notes'}</p><h2>${id === 'drift' ? 'Things I learned from this project.' : 'From scores to records.'}</h2>${bullets(p.notes)}</div>`, 'process-window')}${p.video ? mediaWindow(`${p.filename}-demo.mp4`, p.video, 'detail-video', 'video') : ''}${mediaWindow(`${p.filename}-02.png`, p.media[1], p.media[1].title === 'microsoft-store.png' ? 'detail-photo-two store-photo' : 'detail-photo-two', 'screenshot')}${p.media.slice(2).map((item, index) => mediaWindow(`${p.filename}-${index + 3}.png`, item, 'detail-extra-photo', 'screenshot')).join('')}</div></div>`;
  }


    let page = 'home';
    let html;
    let title = 'Samuel Shaw | Mechatronics Engineering at Waterloo';
    if (path === '/') html = home();
    else if (path === '/about') { page = 'about'; html = about(); title = 'About — Samuel Shaw'; }
    else if (path === '/projects') { page = 'projects'; html = projects(); title = 'Projects — Samuel Shaw'; }
    else if (path.startsWith('/projects/') && Object.hasOwn(config.projects, path.split('/')[2]) && path.split('/').length === 3) {
      page = 'projects'; const id = path.split('/')[2]; html = detail(id); title = id === 'drift' ? 'Vollo File Sharing App | Samuel Shaw' : 'Digital Music Library and Sheet Music Catalogue | Samuel Shaw';
    } else { notFound = true; title = 'Page not found | Samuel Shaw'; html = `<div class="page-heading"><h1>that tab is <em>missing.</em></h1><p>Let's get you back to somewhere familiar.</p><a class="button" href="/">back home →</a></div>`; }

    const descriptions = {
      '/': "Explore Samuel Shaw's software and robotics projects, including Vollo and a digital music library. Mechatronics engineering student at the University of Waterloo.",
      '/about': 'Meet Samuel Shaw, a University of Waterloo mechatronics engineering student. Photos from projects, music, travel, and life outside the classroom.',
      '/projects': 'Explore software projects by Samuel Shaw, including Vollo wireless file sharing and the Digital Music Library searchable catalogue.'
    };
    const id = path.split('/')[2];
    const description = descriptions[path] || (config.projects[id] ? config.projects[id].introduction + ' A project by Samuel Shaw, mechatronics engineering student at Waterloo.' : 'This page could not be found.');
    return { html, page, title, description, canonicalPath, notFound };
  }
  globalThis.PortfolioPages = { routes, normalizePath, render };
})();
