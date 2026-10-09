/* ================================================================
   LIGHTBOX — view a memory bigger.

   Lightbox.open(items, index, returnFocusEl)
     items: [{ src, alt, caption, date, label }]

   • Mouse, touch and keyboard: Esc closes, ←/→ move, Tab stays
     inside (plus the music mini-player, which stays usable above it).
   • Swipe left/right on touch; vertical gestures are left alone.
   • Never touches the music.
================================================================= */
window.Lightbox = (() => {
  let root, card, mediaBox, capEl, dateEl, countEl, prevBtn, nextBtn, closeBtn;
  let items = [];
  let index = 0;
  let returnTo = null;
  let isOpen = false;
  let busy = false;
  let tilt = '0deg';

  const pad = (n) => String(n).padStart(2, '0');

  function icon(id){
    return `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
  }

  function build(){
    root = document.createElement('div');
    root.className = 'lightbox';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-labelledby', 'lightbox-caption');

    root.innerHTML = `
      <div class="lightbox__backdrop"></div>
      <div class="lightbox__stage">
        <button class="lightbox__arrow lightbox__prev" type="button" aria-label="Previous photo">${icon('i-prev')}</button>
        <figure class="lightbox__card">
          <span class="tape"></span>
          <div class="lightbox__media"></div>
          <figcaption class="lightbox__meta">
            <span id="lightbox-caption" class="lightbox__caption hand"></span>
            <span class="lightbox__date"></span>
          </figcaption>
          <button class="lightbox__close" type="button" aria-label="Close">${icon('i-close')}</button>
        </figure>
        <button class="lightbox__arrow lightbox__next" type="button" aria-label="Next photo">${icon('i-next')}</button>
        <p class="lightbox__count" aria-hidden="true"></p>
      </div>`;
    document.body.append(root);

    card     = root.querySelector('.lightbox__card');
    mediaBox = root.querySelector('.lightbox__media');
    capEl    = root.querySelector('.lightbox__caption');
    dateEl   = root.querySelector('.lightbox__date');
    countEl  = root.querySelector('.lightbox__count');
    prevBtn  = root.querySelector('.lightbox__prev');
    nextBtn  = root.querySelector('.lightbox__next');
    closeBtn = root.querySelector('.lightbox__close');

    root.querySelector('.lightbox__backdrop').addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', () => go(-1));
    nextBtn.addEventListener('click', () => go(1));

    // swipe (touch / pen only — the mouse just clicks)
    let sx = 0, sy = 0, tracking = false;
    card.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      tracking = true; sx = e.clientX; sy = e.clientY;
    });
    card.addEventListener('pointerup', (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
    });
    card.addEventListener('pointercancel', () => { tracking = false; });
  }

  /* ---------- rendering ---------- */
  function placeholder(item){
    const ph = document.createElement('div');
    ph.className = 'ph lightbox__ph';
    const strong = document.createElement('strong');
    strong.textContent = item.label;
    const span = document.createElement('span');
    span.textContent = 'add it in config.js';
    ph.append(strong, span);
    return ph;
  }

  function render(){
    const item = items[index];
    mediaBox.replaceChildren();
    if (item.src){
      const el = U.media(item.src, item.alt, 'lightbox__img');
      el.addEventListener('error', () => el.replaceWith(placeholder(item)), { once: true });
      mediaBox.append(el);
    } else {
      mediaBox.append(placeholder(item));
    }
    capEl.textContent = item.caption || '';
    dateEl.textContent = item.date || '';
    dateEl.hidden = !item.date;
    countEl.textContent = `${pad(index + 1)} / ${pad(items.length)}`;
    const single = items.length < 2;
    prevBtn.hidden = single;
    nextBtn.hidden = single;
    tilt = `${[-1.5, 1.2, -0.8, 1.6][index % 4]}deg`;
    card.style.setProperty('--tilt', tilt);
    Cats.say(`photo ${index + 1} of ${items.length}${item.caption ? ': ' + item.caption : ''}`);
  }

  async function go(step){
    if (busy || items.length < 2) return;
    busy = true;
    await U.animate(card, [
      { opacity: 1, transform: `translateX(0) rotate(${tilt})` },
      { opacity: 0, transform: `translateX(${step * -40}px) rotate(${step * -4}deg)` }
    ], { duration: 180, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    index = (index + step + items.length) % items.length;
    render();
    await U.animate(card, [
      { opacity: 0, transform: `translateX(${step * 40}px) rotate(${step * 4}deg)` },
      { opacity: 1, transform: `translateX(0) rotate(${tilt})` }
    ], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
    card.getAnimations().forEach((a) => a.cancel());
    busy = false;
  }

  /* ---------- focus: dialog controls + the mini-player ---------- */
  function focusables(){
    const inDialog = [...root.querySelectorAll('button')].filter((b) => !b.hidden);
    const mini = document.querySelector('.mini:not([hidden])');
    const inMini = mini ? [...mini.querySelectorAll('button, input')].filter((b) => !b.hidden && !b.disabled) : [];
    return [...inDialog, ...inMini];
  }

  function onKey(e){
    if (!isOpen) return;
    if (e.key === 'Escape'){ e.preventDefault(); close(); return; }
    const inRange = e.target instanceof HTMLInputElement && e.target.type === 'range';
    if (!inRange && e.key === 'ArrowRight'){ e.preventDefault(); go(1); }
    if (!inRange && e.key === 'ArrowLeft'){ e.preventDefault(); go(-1); }
    if (e.key === 'Tab'){
      const list = focusables();
      if (!list.length) return;
      const i = list.indexOf(document.activeElement);
      e.preventDefault();
      const next = e.shiftKey ? (i <= 0 ? list.length - 1 : i - 1) : (i === list.length - 1 ? 0 : i + 1);
      list[next].focus();
    }
  }

  /* ---------- open / close ---------- */
  async function open(list, start = 0, from = null){
    if (!list || !list.length) return;
    if (!root) build();
    items = list;
    index = start;
    returnTo = from || document.activeElement;
    isOpen = true;
    render();
    root.hidden = false;
    // lock page scroll; pad by the scrollbar's width so nothing shifts
    const html = document.documentElement;
    html.style.setProperty('--sbw', `${window.innerWidth - html.clientWidth}px`);
    html.classList.add('is-locked');
    document.addEventListener('keydown', onKey);
    closeBtn.focus({ preventScroll: true });

    U.animate(root.querySelector('.lightbox__backdrop'), [{ opacity: 0 }, { opacity: 1 }], { duration: 260, fill: 'none' });
    U.animate(countEl, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: 120, fill: 'none' });
    await U.animate(card, [
      { opacity: 0, transform: 'translateY(26px) rotate(-5deg) scale(.92)' },
      { opacity: 1, transform: `translateY(0) rotate(${tilt}) scale(1)` }
    ], { duration: 460, easing: 'cubic-bezier(.34,1.36,.64,1)', fill: 'none' });
  }

  async function close(){
    if (!isOpen) return;
    isOpen = false;
    document.removeEventListener('keydown', onKey);
    await Promise.all([
      U.animate(root.querySelector('.lightbox__backdrop'), [{ opacity: 1 }, { opacity: 0 }], { duration: 200 }),
      U.animate(card, [
        { opacity: 1, transform: `translateY(0) rotate(${tilt}) scale(1)` },
        { opacity: 0, transform: 'translateY(16px) rotate(-3deg) scale(.96)' }
      ], { duration: 220, easing: 'cubic-bezier(.65,0,.35,1)' })
    ]);
    root.hidden = true;
    root.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    document.documentElement.classList.remove('is-locked');
    document.documentElement.style.removeProperty('--sbw');
    returnTo?.focus({ preventScroll: true });
  }

  return { open, close, get isOpen(){ return isOpen; } };
})();
