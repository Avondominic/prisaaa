/* ================================================================
   UTILS — small shared helpers (no dependencies)
================================================================= */
window.U = (() => {
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const reduced = () => motionQuery.matches;

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* Web Animations wrapper. Resolves when finished.
     With reduced motion, the end state is applied with a short fade
     (or instantly if `essential` is false). */
  function animate(el, keyframes, opts = {}){
    if (!el) return Promise.resolve();
    const { essential = true, ...timing } = opts;
    const options = { duration: 400, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both', ...timing };

    if (reduced()){
      if (!essential) return Promise.resolve();
      const last = keyframes[keyframes.length - 1] || {};
      const first = keyframes[0] || {};
      const fadeOnly = 'opacity' in last
        ? [{ opacity: first.opacity ?? 1 }, { opacity: last.opacity }]
        : null;
      if (!fadeOnly) return Promise.resolve();
      keyframes = fadeOnly;
      Object.assign(options, { duration: 180, delay: 0, easing: 'linear' });
    }

    if (!el.animate) return Promise.resolve();
    return el.animate(keyframes, options).finished.catch(() => {});
  }

  /* Image or muted looping video, picked by file extension. */
  function media(src, alt, className = ''){
    const isVideo = /\.(mp4|webm)$/i.test(src);
    const el = document.createElement(isVideo ? 'video' : 'img');
    if (className) el.className = className;
    if (isVideo){
      Object.assign(el, { muted: true, loop: true, playsInline: true, autoplay: !reduced() });
      el.setAttribute('muted', '');
      el.setAttribute('playsinline', '');
      el.setAttribute('aria-label', alt);
      el.setAttribute('role', 'img');
    } else {
      el.alt = alt;
      el.decoding = 'async';
    }
    el.src = src;
    return el;
  }

  /* Swap an existing <img>/<video> to a new source in place. */
  function swapMedia(oldEl, src, alt){
    const sameKind = (oldEl.tagName === 'VIDEO') === /\.(mp4|webm)$/i.test(src);
    if (sameKind && oldEl.tagName === 'IMG'){
      oldEl.src = src;
      oldEl.alt = alt;
      return oldEl;
    }
    const next = media(src, alt, oldEl.className);
    if (oldEl.id) next.id = oldEl.id;
    oldEl.replaceWith(next);
    return next;
  }

  /* Warm the cache so swaps are instant. */
  function preload(srcs){
    srcs.filter(Boolean).forEach((src) => {
      if (/\.(mp4|webm)$/i.test(src)) return;
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
    });
  }

  /* Fill every [data-text="path.to.value"] from the config as plain text. */
  function bindText(config, root = document){
    $$('[data-text]', root).forEach((el) => {
      const value = el.dataset.text.split('.').reduce((o, k) => (o == null ? o : o[k]), config);
      if (typeof value === 'string') el.textContent = value;
    });
  }

  return { $, $$, reduced, wait, animate, media, swapMedia, preload, bindText, motionQuery };
})();
