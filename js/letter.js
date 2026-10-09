/* ================================================================
   SCENE 6 — LETTER
   A closed envelope → click / Enter / Space → the seal pops, the
   flap swings open, the letter slides up out of the envelope and
   grows into a full sheet of paper you can read top to bottom
   (the paper grows with the text; nothing is clipped).
   "fold it back up" plays it in reverse. Independent of the music.
================================================================= */
Scenes.register('letter', (() => {
  const cfg = window.BIRTHDAY.letter;
  let scene, env, flap, seal, peek, paper, replay, stage;
  let isOpen = false;
  let busy = false;

  const EASE_OUT = 'cubic-bezier(.2,.8,.2,1)';
  const EASE_IN_OUT = 'cubic-bezier(.65,0,.35,1)';

  /* ---------- content (plain text only) ---------- */
  function fill(){
    U.$('.paper__greeting', paper).textContent = cfg.greeting;
    const body = U.$('.paper__body', paper);
    body.replaceChildren();
    String(cfg.body || '').split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean).forEach((t) => {
      const p = document.createElement('p');
      p.textContent = t;
      body.append(p);
    });
    U.$('.paper__signoff', paper).textContent = cfg.signoff;
    U.$('.paper__signature', paper).textContent = cfg.signature;
  }

  /* ---------- FLIP: animate `el` from rect `from` to where it is now ---------- */
  function flipFrom(el, from, opts){
    const to = el.getBoundingClientRect();
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    const sx = from.width / to.width;
    const sy = from.height / to.height;
    return U.animate(el, [
      { transformOrigin: 'top left', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: .9 },
      { transformOrigin: 'top left', transform: 'translate(0, 0) scale(1, 1)', opacity: 1 }
    ], opts);
  }
  function flipTo(el, target, opts){
    const from = el.getBoundingClientRect();
    const dx = target.left - from.left;
    const dy = target.top - from.top;
    return U.animate(el, [
      { transformOrigin: 'top left', transform: 'translate(0, 0) scale(1, 1)', opacity: 1 },
      { transformOrigin: 'top left', transform: `translate(${dx}px, ${dy}px) scale(${target.width / from.width}, ${target.height / from.height})`, opacity: .9 }
    ], opts);
  }

  const lines = () => [U.$('.paper__greeting', paper), ...U.$$('.paper__body p', paper), U.$('.paper__signoff', paper), U.$('.paper__signature', paper)];

  /* ---------- open ---------- */
  async function open(){
    if (busy || isOpen) return;
    busy = true;
    isOpen = true;
    env.setAttribute('aria-expanded', 'true');

    if (U.reduced()){
      await U.animate(stage, [{ opacity: 1 }, { opacity: 0 }], { duration: 160 });
      stage.hidden = true;
      paper.hidden = false;
      await U.animate(paper, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    } else {
      // 1. seal pops off
      await U.animate(seal, [
        { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 },
        { transform: 'translate(-50%, -50%) scale(1.25) rotate(-12deg)', opacity: 1, offset: .4 },
        { transform: 'translate(-50%, -90%) scale(.4) rotate(30deg)', opacity: 0 }
      ], { duration: 380, easing: EASE_OUT, fill: 'forwards' });

      // 2. flap swings open (drops behind the letter halfway through)
      const flapAnim = U.animate(flap, [
        { transform: 'perspective(1100px) rotateX(0deg)' },
        { transform: 'perspective(1100px) rotateX(180deg)' }
      ], { duration: 620, easing: EASE_IN_OUT, fill: 'forwards' });
      setTimeout(() => env.classList.add('is-flap-open'), 310);
      await flapAnim;

      // 3. the letter slides up out of the envelope
      await U.animate(peek, [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-58%)' }
      ], { duration: 560, easing: EASE_OUT, fill: 'forwards' });
      await U.wait(120);

      // 4. it grows into the full letter
      const from = peek.getBoundingClientRect();
      stage.hidden = true;
      paper.hidden = false;
      lines().forEach((l) => { l.style.opacity = '0'; });
      await flipFrom(paper, from, { duration: 720, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'none' });

      // 5. the words appear line by line
      const ls = lines();
      await Promise.all(ls.map((l, i) => U.animate(l, [
        { opacity: 0, transform: 'translateY(6px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 520, delay: Math.min(i, 8) * 130, easing: EASE_OUT, fill: 'none' })
        .then(() => { l.style.opacity = ''; })));
    }

    Cats.set(U.$('#letter-cat', scene), 'love');
    replay.hidden = false;
    paper.focus({ preventScroll: true });
    paper.scrollIntoView({ behavior: U.reduced() ? 'auto' : 'smooth', block: 'start' });
    busy = false;
  }

  /* ---------- fold it back up ---------- */
  async function close(){
    if (busy || !isOpen) return;
    busy = true;
    replay.hidden = true;

    if (U.reduced()){
      await U.animate(paper, [{ opacity: 1 }, { opacity: 0 }], { duration: 160 });
      paper.hidden = true;
      resetEnvelope();
      stage.hidden = false;
      await U.animate(stage, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    } else {
      // if she's scrolled down the letter, glide back up to where the envelope lives
      if (scene.getBoundingClientRect().top < -8){
        U.$('.letter__head', scene).scrollIntoView({ behavior: 'smooth', block: 'start' });
        await scrollSettled();
      }

      // where the letter will tuck back in (the envelope is still open)
      stage.hidden = false;
      const target = peek.getBoundingClientRect();
      stage.hidden = true;

      // fold the paper down into that spot, then swap back to the envelope
      await flipTo(paper, target, { duration: 560, easing: EASE_IN_OUT, fill: 'forwards' });
      paper.hidden = true;
      paper.getAnimations().forEach((a) => a.cancel());
      stage.hidden = false;

      await U.animate(peek, [
        { transform: 'translateY(-58%)' },
        { transform: 'translateY(0)' }
      ], { duration: 460, easing: EASE_IN_OUT, fill: 'forwards' });

      const flapAnim = U.animate(flap, [
        { transform: 'perspective(1100px) rotateX(180deg)' },
        { transform: 'perspective(1100px) rotateX(0deg)' }
      ], { duration: 560, easing: EASE_IN_OUT, fill: 'forwards' });
      setTimeout(() => env.classList.remove('is-flap-open'), 280);
      await flapAnim;

      await U.animate(seal, [
        { transform: 'translate(-50%, -90%) scale(.4) rotate(30deg)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1.15) rotate(-6deg)', opacity: 1, offset: .7 },
        { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 }
      ], { duration: 420, easing: EASE_OUT, fill: 'forwards' });
      resetEnvelope();
    }

    isOpen = false;
    env.setAttribute('aria-expanded', 'false');
    Cats.set(U.$('#letter-cat', scene), 'neutral');
    env.focus({ preventScroll: true });
    busy = false;
  }

  /* resolves when a smooth scroll has finished (or after a short timeout) */
  function scrollSettled(){
    return new Promise((resolve) => {
      const done = () => { window.removeEventListener('scrollend', done); clearTimeout(t); resolve(); };
      const t = setTimeout(done, 700);
      window.addEventListener('scrollend', done, { once: true });
    });
  }

  /* back to the plain closed state, with no animation fills left over */
  function resetEnvelope(){
    env.classList.remove('is-flap-open');
    [seal, flap, peek].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
  }

  function init(el){
    scene  = el;
    stage  = U.$('.letter__stage', scene);
    env    = U.$('.envelope', scene);
    flap   = U.$('.env__flap', scene);
    seal   = U.$('.env__seal', scene);
    peek   = U.$('.env__peek', scene);
    paper  = U.$('.paper', scene);
    replay = U.$('.letter__replay', scene);

    fill();
    Cats.set(U.$('#letter-cat', scene), 'neutral');
    Cats.set(U.$('#paper-cat', scene), 'love');
    env.addEventListener('click', open);
    replay.addEventListener('click', close);
  }

  return { init, open, close, get isOpen(){ return isOpen; } };
})());
