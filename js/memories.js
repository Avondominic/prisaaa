/* ================================================================
   SCENE 5 — MEMORIES
   Part 1: a scrapbook wall of Polaroids (config.js → memories).
           Click / Enter on one opens it bigger in the lightbox.
   Part 2: OUR ICONIC LORE notebook (js/lore.js).
================================================================= */
Scenes.register('memories', (() => {
  const cfg = window.BIRTHDAY.memories;
  const TILTS = [-4, 3, -2, 5, -3, 2.5];
  const STICKERS = ['heart', null, 'star', null, 'sparkle', null];
  let scene, wall, items = [];

  const pad = (n) => String(n).padStart(2, '0');

  function placeholder(label){
    const ph = document.createElement('div');
    ph.className = 'ph polaroid__media';
    const strong = document.createElement('strong');
    strong.textContent = label;
    const span = document.createElement('span');
    span.textContent = 'add it in config.js';
    ph.append(strong, span);
    return ph;
  }

  function buildPhoto(photo, i){
    const label = `photo ${pad(i + 1)}`;
    const li = document.createElement('li');
    li.className = 'mem';
    li.style.setProperty('--tilt', `${TILTS[i % TILTS.length]}deg`);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'polaroid mem__card';
    btn.setAttribute('aria-label', `Open ${label}${photo.caption ? ': ' + photo.caption : ''}`);

    const tape = document.createElement('span');
    tape.className = i % 3 === 1 ? 'tape tape--b' : 'tape';
    tape.style.setProperty('--tape-tilt', `${i % 2 ? 5 : -4}deg`);

    let media;
    if (photo.src){
      media = U.media(photo.src, photo.alt || label, 'polaroid__media');
      if (media.tagName === 'IMG') media.loading = 'lazy';
      // a configured file that's missing falls back to the placeholder
      media.addEventListener('error', () => media.replaceWith(placeholder(label)), { once: true });
    } else {
      media = placeholder(label);
    }

    const cap = document.createElement('span');
    cap.className = 'polaroid__caption hand';
    cap.textContent = photo.caption || '';

    btn.append(tape, media, cap);
    if (photo.date){
      const date = document.createElement('span');
      date.className = 'mem__date';
      date.textContent = photo.date;
      btn.append(date);
    }

    const sticker = STICKERS[i % STICKERS.length];
    if (sticker){
      li.append(U.doodle(sticker, `mem__sticker ${sticker === 'star' ? '' : 'doodle--filled'} ${sticker === 'heart' ? 'doodle--accent' : ''}`));
    }

    btn.addEventListener('click', () => Lightbox.open(items, i, btn));
    li.prepend(btn);
    return li;
  }

  function buildEmpty(){
    const li = document.createElement('li');
    li.className = 'mem mem--empty';
    const card = document.createElement('div');
    card.className = 'polaroid mem__card mem__empty';
    const tape = document.createElement('span');
    tape.className = 'tape';
    const ph = document.createElement('div');
    ph.className = 'ph polaroid__media';
    const strong = document.createElement('strong');
    strong.textContent = cfg.empty.title;
    const span = document.createElement('span');
    span.textContent = cfg.empty.hint;
    ph.append(strong, span);
    card.append(tape, ph);
    li.append(card, U.doodle('heart', 'mem__sticker doodle--filled doodle--accent'));
    return li;
  }

  /* each Polaroid drops in as it scrolls into view */
  function watchDrops(){
    const cards = U.$$('.mem', wall);
    if (!('IntersectionObserver' in window) || U.reduced()){
      cards.forEach((c) => c.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      // cards that arrive together drop in one after another
      entries.filter((e) => e.isIntersecting).forEach((e, k) => {
        io.unobserve(e.target);
        e.target.style.transitionDelay = `${k * 90}ms`;
        e.target.classList.add('is-in');
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    cards.forEach((c) => io.observe(c));
  }

  function init(el){
    scene = el;
    wall = U.$('.mem__wall', scene);
    Cats.set(U.$('#mem-cat', scene), 'happy');

    const photos = cfg.photos || [];
    items = photos.map((p, i) => ({
      src: p.src, alt: p.alt, caption: p.caption, date: p.date, label: `photo ${pad(i + 1)}`
    }));

    if (photos.length) photos.forEach((p, i) => wall.append(buildPhoto(p, i)));
    else {
      wall.append(buildEmpty());
      U.$('.mem__note', scene).hidden = true;     // nothing to click yet
    }
    scene.classList.toggle('is-empty', !photos.length);

    Lore.init(U.$('.lore', scene));
  }

  function enter(){
    watchDrops();
    U.cue(U.$('.cue--inline', scene), () => U.$('.lore', scene), () => U.$('#lore-heading'));
  }

  return { init, enter };
})());
