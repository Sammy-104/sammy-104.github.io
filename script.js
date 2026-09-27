/* Samuel Shaw — portfolio behaviour */
(function () {
  'use strict';

  /* Footer year */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Mobile navigation disclosure */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');

  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      nav.classList.toggle('is-open', open);
    };

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (toggle.getAttribute('aria-expanded') === 'true' && !e.target.closest('.site-header')) {
        setOpen(false);
      }
    });
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealables = document.querySelectorAll('[data-reveal]');

  /* Scroll reveal */
  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -4% 0px', threshold: 0.05 });

    Array.prototype.forEach.call(revealables, function (el) { observer.observe(el); });
  }

  /* Highlight the section currently in view */
  var links = document.querySelectorAll('.site-header nav a[href^="#"]');
  if (links.length && 'IntersectionObserver' in window) {
    var byId = {};
    var sections = [];

    Array.prototype.forEach.call(links, function (link) {
      var section = document.querySelector(link.getAttribute('href'));
      if (section) { byId[section.id] = link; sections.push(section); }
    });

    var inView = [];

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var i = inView.indexOf(entry.target);
        if (entry.isIntersecting && i === -1) inView.push(entry.target);
        else if (!entry.isIntersecting && i !== -1) inView.splice(i, 1);
      });

      var first = null;
      sections.forEach(function (s) {
        if (!first && inView.indexOf(s) !== -1) first = s;
      });

      Array.prototype.forEach.call(links, function (l) { l.removeAttribute('aria-current'); });
      if (first && byId[first.id]) byId[first.id].setAttribute('aria-current', 'true');
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { spy.observe(s); });
  }
})();
