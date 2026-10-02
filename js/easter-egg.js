/* ================================================================
   EASTER EGG — configured in config.js → easterEgg

   Tap the target element `taps` times in a row (each within
   `withinMs` of the last) to open a little secret note. Every tap
   gives a tiny squish + heart, so it feels alive without giving
   the secret away. Works with mouse, touch and keyboard.
================================================================= */
(() => {
  const cfg = window.BIRTHDAY.easterEgg;
  if (!cfg || !cfg.enabled) return;

  const target = document.getElementById(cfg.trigger.target);
  if (!target) return;

  const needed = Math.max(1, cfg.trigger.taps || 5);
  const within = cfg.trigger.withinMs || 1500;
  let count = 0;
  let last = 0;
  let dialog = null;

  /* ---------- feedback per tap ---------- */
  function squish(){
    U.animate(target, [
      { scale: '1' }, { scale: '.93', offset: .35 }, { scale: '1' }
    ], { duration: 260, fill: 'none', essential: false });
  }

  function heart(){
    if (U.reduced()) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 26 24');
    svg.setAttribute('class', 'tap-heart doodle doodle--accent doodle--filled');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#d-heart');
    svg.append(use);
    svg.style.left = `${30 + Math.random() * 40}%`;
    target.parentElement.append(svg);
    svg.animate([
      { transform: 'translate(-50%, 0) scale(.5)', opacity: 0 },
      { opacity: 1, offset: .25 },
      { transform: `translate(-50%, -70px) rotate(${(Math.random() - .5) * 40}deg) scale(1)`, opacity: 0 }
    ], { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)' })
      .finished.then(() => svg.remove(), () => svg.remove());
  }

  /* ---------- the secret note ---------- */
  function build(){
    dialog = document.createElement('div');
    dialog.className = 'egg';
    dialog.hidden = true;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'egg-title');

    const backdrop = document.createElement('div');
    backdrop.className = 'egg__backdrop';

    const card = document.createElement('div');
    card.className = 'egg__card';

    const tape = document.createElement('span');
    tape.className = 'tape';

    const cat = U.media(Cats.get('love').src, Cats.get('love').alt, 'egg__cat');

    const title = document.createElement('h3');
    title.id = 'egg-title';
    title.className = 'egg__title hand';
    title.textContent = cfg.title;

    const msg = document.createElement('p');
    msg.className = 'egg__message';
    msg.textContent = cfg.message;

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn btn--primary egg__close';
    close.textContent = cfg.close || 'close';

    card.append(tape, cat, title, msg, close);
    dialog.append(backdrop, card);
    document.body.append(dialog);

    close.addEventListener('click', hide);
    backdrop.addEventListener('click', hide);
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hide();
      if (e.key === 'Tab'){ e.preventDefault(); close.focus(); }   // only one control: keep focus here
    });
  }

  async function show(){
    if (!dialog) build();
    dialog.hidden = false;
    const card = U.$('.egg__card', dialog);
    U.animate(U.$('.egg__backdrop', dialog), [{ opacity: 0 }, { opacity: 1 }], { duration: 280 });
    await U.animate(card, [
      { opacity: 0, transform: 'translateY(30px) rotate(-6deg) scale(.9)' },
      { opacity: 1, transform: 'translateY(0) rotate(-1.5deg) scale(1)' }
    ], { duration: 560, easing: 'cubic-bezier(.34,1.36,.64,1)' });
    U.$('.egg__close', dialog).focus();
  }

  async function hide(){
    if (!dialog || dialog.hidden) return;
    await Promise.all([
      U.animate(U.$('.egg__backdrop', dialog), [{ opacity: 1 }, { opacity: 0 }], { duration: 240 }),
      U.animate(U.$('.egg__card', dialog), [
        { opacity: 1, transform: 'translateY(0) rotate(-1.5deg) scale(1)' },
        { opacity: 0, transform: 'translateY(20px) rotate(-3deg) scale(.96)' }
      ], { duration: 260, easing: 'cubic-bezier(.65,0,.35,1)' })
    ]);
    dialog.hidden = true;
    target.focus({ preventScroll: true });
  }

  /* ---------- counting taps ---------- */
  target.addEventListener('click', () => {
    const now = performance.now();
    count = now - last <= within ? count + 1 : 1;
    last = now;
    squish();
    heart();
    if (count >= needed){
      count = 0;
      show();
    }
  });
})();
