/* ================================================================
   OUR ICONIC LORE — an open notebook of sticky notes.

   One note at a time on the right page; the next ones peek out
   from the pile underneath. Move with the arrows, the dots,
   ←/→/Home/End while focus is in the notebook, or a horizontal
   swipe (vertical swipes still scroll the page).

   All text comes from config.js → lore. Notes are real HTML.
================================================================= */
window.Lore = (() => {
  const cfg = window.BIRTHDAY.lore;
  const notes = cfg.notes || [];
  const TILTS = [-2, 1.6, -1.2, 2.2, -1.6, 1, -2.4];
  const COLORS = ['butter', 'pink', 'sky', 'mint', 'lilac', 'peach', 'lime'];

  let root, noteEl, stack, dots, nowEl, prevBtn, nextBtn;
  let index = 0;
  let dest = 0;            // where we're heading (differs from index mid-transition)
  let busy = false;
  let pending = null;
  let finished = false;
  let entered = false;

  const pad = (n) => String(n).padStart(2, '0');
  const colorOf = (n, i) => (COLORS.includes(n.color) ? n.color : COLORS[i % COLORS.length]);

  /* ---------- building ---------- */
  function buildHeading(){
    const h = U.$('.lore__heading', root);
    const words = cfg.heading.trim().split(/\s+/);
    const last = words.pop();
    h.textContent = words.join(' ') + (words.length ? ' ' : '');
    const em = document.createElement('span');
    em.className = 'lore__heading-accent';
    em.textContent = last;
    em.append(U.doodle('wave', 'lore__underline'));
    h.append(em);
  }

  function buildDots(){
    dots = notes.map((n, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `lore__dot lore__dot--${colorOf(n, i)}`;
      b.setAttribute('aria-label', `Memory ${i + 1}: ${n.title}`);
      b.addEventListener('click', () => show(i));
      U.$('.lore__dots', root).append(b);
      return b;
    });
    U.$('.lore__total', root).textContent = pad(notes.length);
  }

  function fillNote(i){
    const n = notes[i];
    noteEl.className = `note note--${colorOf(n, i)}`;
    noteEl.style.setProperty('--tilt', `${TILTS[i % TILTS.length]}deg`);
    noteEl.setAttribute('aria-label', `${i + 1} of ${notes.length}`);
    noteEl.replaceChildren();

    const tape = document.createElement('span');
    tape.className = i % 2 ? 'tape tape--b note__tape' : 'tape note__tape';

    const num = document.createElement('span');
    num.className = 'note__num';
    num.textContent = `#${pad(i + 1)}`;

    const title = document.createElement('h3');
    title.className = 'note__title';
    title.textContent = n.title;

    const text = document.createElement('p');
    text.className = 'note__text hand';
    text.textContent = n.text;

    const [a = 'heart', b = 'star'] = n.doodles || [];
    const da = U.doodle(a, `note__doodle note__doodle--a ${a === 'heart' || a === 'sparkle' ? 'doodle--filled' : ''}`);
    const db = U.doodle(b, `note__doodle note__doodle--b ${b === 'heart' || b === 'sparkle' ? 'doodle--filled' : ''}`);

    const cat = document.createElement('span');
    cat.className = 'note__cat';
    const { src } = Cats.get(n.cat || 'happy');
    const img = U.media(src, '', 'note__cat-img');
    img.setAttribute('aria-hidden', 'true');
    cat.append(img);

    noteEl.append(tape, num, title, text, da, db, cat);

    // the next two notes peek out from the pile underneath
    U.$$('span', stack).forEach((s, k) => {
      const j = (i + k + 1) % notes.length;
      s.className = `lore__peek lore__peek--${colorOf(notes[j], j)}`;
      s.hidden = notes.length < k + 2;
    });

    dots.forEach((d, k) => {
      d.classList.toggle('is-active', k === i);
      if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
    });
    nowEl.textContent = pad(i + 1);
  }

  /* ---------- moving between notes ---------- */
  async function show(i, dir){
    if (!notes.length) return;
    const target = (i + notes.length) % notes.length;
    dest = target;
    if (busy){ pending = [target, dir]; return; }
    if (target === index && entered) return;
    const step = dir || (target > index ? 1 : -1);
    busy = true;

    // peel the current note off…
    await U.animate(noteEl, [
      { opacity: 1, transform: `rotate(${TILTS[index % TILTS.length]}deg)` },
      { opacity: 0, transform: `translate(${step * -46}px, 14px) rotate(${step * -12}deg)` }
    ], { duration: 240, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });

    index = target;
    fillNote(index);
    Cats.say(`memory ${index + 1} of ${notes.length}: ${notes[index].title}`);

    // …and slap the next one on
    const tilt = `${TILTS[index % TILTS.length]}deg`;
    popCat();
    await U.animate(noteEl, [
      { opacity: 0, transform: `translate(${step * 26}px, -18px) rotate(${step * 7}deg) scale(1.04)` },
      { opacity: 1, transform: `translate(0, 0) rotate(${tilt}) scale(1)` }
    ], { duration: 460, easing: 'cubic-bezier(.34,1.3,.64,1)' });
    noteEl.getAnimations().forEach((a) => a.cancel());
    busy = false;

    if (index === notes.length - 1 && !finished && cfg.finished){
      finished = true;
      Cats.react(cfg.finished.mood, cfg.finished.text, 2200);
    }
    if (pending){
      const [p, d] = pending;
      pending = null;
      show(p, d);
    }
  }

  function popCat(){
    return U.animate(U.$('.note__cat', noteEl), [
      { opacity: 0, transform: 'scale(.3) rotate(-30deg)' },
      { opacity: 1, transform: 'scale(1.12) rotate(6deg)', offset: .7 },
      { opacity: 1, transform: 'scale(1) rotate(0deg)' }
    ], { duration: 520, delay: 180, easing: 'cubic-bezier(.2,.8,.2,1)', essential: false });
  }

  const next = () => show(dest + 1, 1);
  const prev = () => show(dest - 1, -1);

  /* ---------- input ---------- */
  function bindInput(){
    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);

    root.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      const keys = { ArrowRight: next, ArrowLeft: prev, Home: () => show(0, -1), End: () => show(notes.length - 1, 1) };
      if (keys[e.key]){ e.preventDefault(); keys[e.key](); }
    });

    // horizontal swipe on the note; CSS touch-action: pan-y keeps vertical scrolling
    const stage = U.$('.lore__stage', root);
    let sx = 0, sy = 0, tracking = false;
    stage.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      tracking = true; sx = e.clientX; sy = e.clientY;
    });
    stage.addEventListener('pointerup', (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) (dx < 0 ? next : prev)();
    });
    stage.addEventListener('pointercancel', () => { tracking = false; });
  }

  /* ---------- entrance (when the notebook scrolls into view) ---------- */
  function enter(){
    if (entered) return;
    entered = true;
    root.classList.remove('is-waiting');
    const book = U.$('.notebook', root);
    U.animate(book, [
      { opacity: 0, transform: 'translateY(40px) rotate(-1.5deg)' },
      { opacity: 1, transform: 'translateY(0) rotate(0deg)' }
    ], { duration: 720, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'none' });
    U.animate(noteEl, [
      { opacity: 0, transform: 'translateY(-30px) rotate(8deg) scale(1.06)' },
      { opacity: 1, transform: `translateY(0) rotate(${TILTS[0]}deg) scale(1)` }
    ], { duration: 560, delay: 380, easing: 'cubic-bezier(.34,1.3,.64,1)', fill: 'backwards' });
    U.animate(U.$('.lore__keeper', root), [
      { opacity: 0, transform: 'scale(1.3) rotate(-14deg)' },
      { opacity: 1, transform: 'scale(1) rotate(0deg)' }
    ], { duration: 520, delay: 560, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'backwards' });
    popCat();
  }

  function init(el){
    root = el;
    if (!notes.length){ root.hidden = true; return; }
    noteEl  = U.$('.note', root);
    stack   = U.$('.lore__stack', root);
    nowEl   = U.$('.lore__now', root);
    prevBtn = U.$('.lore__prev', root);
    nextBtn = U.$('.lore__next', root);
    Cats.set(U.$('#lore-cat', root), 'love');

    buildHeading();
    buildDots();
    fillNote(0);
    bindInput();

    root.classList.add('is-waiting');
    if (!('IntersectionObserver' in window)) return enter();
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      enter();
    }, { rootMargin: '0px 0px -20% 0px' });
    io.observe(U.$('.notebook', root));
  }

  return { init, show, get index(){ return index; } };
})();
