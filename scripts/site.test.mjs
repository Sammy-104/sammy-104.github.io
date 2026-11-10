import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { build, root, loadPages, documentFor } from './build.mjs';

build();
const { pages, config } = loadPages();
const expected = {
  '/': 'Studying Mechatronics Engineering',
  '/about/': 'Making the tallest tower',
  '/projects/': 'Digital Music Library',
  '/projects/vollo/': 'Let the receiver accept or decline',
  '/projects/library/': 'Bring music library records'
};
test('every direct URL contains its content, unique metadata, and working asset paths without JavaScript', () => {
  const titles = new Set(), descriptions = new Set();
  for (const route of pages.routes) {
    const html = fs.readFileSync(new URL(route.slice(1) + 'index.html', root), 'utf8');
    const result = pages.render(config, route);
    assert.equal(html, documentFor(result));
    assert.ok(html.includes(expected[route]), route);
    assert.match(html, /<h1\b/);
    assert.equal((html.match(/<main\b/g) || []).length, 1);
    assert.ok(html.includes('href="https://samuelshaw.ca' + route + '"'));
    assert.ok(!html.includes('href="#/'));
    for (const [, href] of html.matchAll(/href="(\/[^\"]*)"/g)) {
      if (href.endsWith('/')) assert.ok(pages.routes.includes(href), href);
    }
    for (const [, asset] of html.matchAll(/(?:src|poster)="([^\"]+)"/g)) {
      assert.ok(asset.startsWith('/'), asset);
      assert.ok(fs.existsSync(new URL(asset.slice(1).split('?')[0], root)), asset);
    }
    titles.add(result.title); descriptions.add(result.description);
  }
  assert.equal(titles.size, 5); assert.equal(descriptions.size, 5);
});
test('unknown routes have an error document and are excluded from the sitemap', () => {
  assert.equal(pages.render(config, '/does-not-exist/').notFound, true);
  assert.match(fs.readFileSync(new URL('404.html', root), 'utf8'), /content="noindex"/);
  const sitemap = fs.readFileSync(new URL('sitemap.xml', root), 'utf8');
  assert.equal((sitemap.match(/<loc>/g) || []).length, 5);
  assert.ok(!sitemap.includes('#'));
  assert.ok(!sitemap.includes('404'));
});

test('image delivery reserves space, prioritizes the first About photo and keeps original lightbox files', () => {
  const about = pages.render(config, '/about/').html;
  assert.equal((about.match(/loading="eager" fetchpriority="high"/g) || []).length, 1);
  assert.equal((about.match(/loading="lazy"/g) || []).length, 6);
  assert.match(about, /data-full-image="\/media\/about-01.jpg"/);
  assert.match(about, /srcset="\/media\/about-01-640.webp 640w, \/media\/about-01-960.webp 960w/);
  for (const route of ['/about/', '/projects/vollo/', '/projects/library/']) {
    const html = pages.render(config, route).html;
    for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
      assert.match(tag, /width="\d+" height="\d+"/);
    }
    assert.ok(!html.includes('aria-label="Open image full size:'));
    assert.match(html, /aria-label="Open full size:/);
  }
  assert.equal(config.projects.drift.logo.src, '/media/vollo-logo.webp');
});

function browser(pathname, hash = '', { prerendered = false, savedCaptions = null } = {}) {
  const listeners = { document: {}, window: {}, main: {} };
  const main = { innerHTML: '', dataset: {}, focus() {}, addEventListener(n, fn) { (listeners.main[n] ||= []).push(fn); } };
  let htmlWrites = 0;
  let html = prerendered ? pages.render(config, pathname).html : '';
  if (prerendered) main.dataset.route = pages.normalizePath(pathname);
  Object.defineProperty(main, 'innerHTML', { get: () => html, set(value) { html = value; htmlWrites++; } });
  const nav = ['home', 'about', 'projects'].map(name => ({ dataset: { nav: name }, setAttribute(k, v) { this[k] = v; }, removeAttribute(k) { delete this[k]; } }));
  const metadata = { description: {}, canonical: {} };
  const location = { pathname, hash, search: '', origin: 'https://samuelshaw.ca', get href() { return this.origin + this.pathname + this.search + this.hash; }, replace(path) { this.replaced = path; } };
  const stack = [];
  function move(_, __, path) { const url = new URL(path, location.origin); Object.assign(location, { pathname: url.pathname, search: url.search, hash: url.hash }); }
  const context = vm.createContext({ URL, location, history: { replaceState: move, pushState(...args) { stack.push(location.pathname); move(...args); } }, localStorage: { getItem: () => savedCaptions }, document: {
    querySelector(s) { return s === 'main' ? main : s.includes('description') ? metadata.description : s.includes('canonical') ? metadata.canonical : null; },
    querySelectorAll: () => nav,
    addEventListener(n, fn) { listeners.document[n] = fn; }
  }, window: { scrollTo() {}, addEventListener(n, fn) { listeners.window[n] = fn; } } });
  context.window.PortfolioPages = pages;
  vm.runInContext(fs.readFileSync(new URL('content.js', root), 'utf8'), context);
  vm.runInContext(fs.readFileSync(new URL('app.js', root), 'utf8'), context);
  return { context, location, main, nav, metadata, listeners, stack, htmlWrites };
}
test('first load keeps static content unless a legacy bookmark or saved caption needs rendering', () => {
  assert.equal(browser('/projects/vollo/', '', { prerendered: true }).htmlWrites, 0);
  const legacy = browser('/', '#/projects/vollo', { prerendered: true });
  assert.equal(legacy.htmlWrites, 1);
  assert.match(legacy.main.innerHTML, /Let the receiver accept or decline/);
  const about = browser('/about/', '', { prerendered: true, savedCaptions: JSON.stringify({ 0: { caption: 'My saved caption' } }) });
  assert.equal(about.htmlWrites, 1);
  assert.match(about.main.innerHTML, /My saved caption/);
});
test('browser loads nested routes and migrates legacy hash links including Drift alias', () => {
  for (const route of pages.routes) {
    const b = browser(route);
    assert.ok(b.main.innerHTML.includes(expected[route]), route);
    assert.equal(b.metadata.canonical.href, 'https://samuelshaw.ca' + route);
  }
  for (const [hash, path] of [['#/about', '/about/'], ['#/projects/vollo', '/projects/vollo/'], ['#/projects/drift', '/projects/vollo/'], ['#/', '/']]) {
    const b = browser('/', hash);
    assert.equal(b.location.pathname, path); assert.equal(b.location.hash, '');
    assert.ok(b.main.innerHTML.includes(expected[path]));
  }
});
test('normal navigation and Back update content, metadata and active tab; modified and skip clicks stay native', () => {
  const b = browser('/');
  function click(href, extra = {}) {
    const link = { href: new URL(href, b.location.origin).href, target: '', hasAttribute: () => false };
    const event = { button: 0, target: { closest: () => link }, preventDefault() { this.prevented = true; }, ...extra };
    b.listeners.document.click(event); return event;
  }
  assert.ok(click('/projects/vollo/').prevented);
  assert.equal(b.location.pathname, '/projects/vollo/');
  assert.match(b.context.document.title, /Vollo/);
  assert.equal(b.nav.find(n => n.dataset.nav === 'projects')['aria-current'], 'page');
  assert.ok(!click('/about/', { ctrlKey: true }).prevented);
  assert.ok(!click('/projects/', { button: 1 }).prevented);
  assert.ok(!click('#main').prevented);
  assert.ok(!click('https://github.com/samuelrshaw').prevented);
  b.location.pathname = b.stack.pop(); b.listeners.window.popstate();
  assert.ok(b.main.innerHTML.includes(expected['/']));
  assert.equal(b.metadata.canonical.href, 'https://samuelshaw.ca/');
});
