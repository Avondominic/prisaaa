/* ================================================================
   SCENE 3 — BIRTHDAY REVEAL (the payoff)

   Entrance, in one continuous beat (~2s):
     kicker tag pops → title rises letter by letter → name gets a
     highlighter swipe → the cat sticker is slapped on with a small
     burst → three goofy polaroids drop in → ambient hearts start.

   Goofy polaroids are buttons: clicking one makes the cat react.
================================================================= */
Scenes.register('reveal', (() => {
  const cfg = window.BIRTHDAY.reveal;
  let scene, cat, sticker, kicker, letters, nameEl, polaroids;

  /* ---------- build ---------- */

  function buildTitle(){
    const text = cfg.title;
    U.$('.reveal__title-text', scene).textContent = `${text} ${window.BIRTHDAY.name}`;

    const visual = U.$('.reveal__title-visual', scene);
    const [, body, bang] = text.match(/^(.*?)([!?.]*)$/);
    body.trim().split(/\s+/).forEach((word, i, words) => {
      const w = document.createElement('span');
      w.className = 'reveal__word';
      [...word].forEach((ch) => {
        const l = document.createElement('span');
        l.className = 'reveal__letter';
        l.textContent = ch;
        w.append(l);
      });
      // trailing punctuation sits on the last word, in the accent colour
      if (bang && i === words.length - 1){
        [...bang].forEach((ch) => {
          const l = document.createElement('span');
          l.className = 'reveal__letter reveal__bang';
          l.textContent = ch;
          w.append(l);
        });
      }
      visual.append(w);
    });
    letters = U.$$('.reveal__letter', visual);
  }

  function placeholder(i){
    const ph = document.createElement('div');
    ph.className = 'ph polaroid__media';
    const label = document.createElement('strong');
    label.textContent = `goofy image ${i + 1}`;
    const hint = document.createElement('span');
    hint.textContent = 'add it in config.js';
    ph.append(label, hint);
    return ph;
  }

  function buildGoofy(){
    const list = U.$('.reveal__goofy', scene);
    const tilts = [-5, 3, -2];
    cfg.goofy.slice(0, 3).forEach((item, i) => {
      const li = document.createElement('li');
      li.className = 'reveal__goofy-item';
      li.style.setProperty('--tilt', `${tilts[i]}deg`);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'polaroid';
      btn.setAttribute('aria-label', `${item.alt} — ${item.caption}`);

      const tape = document.createElement('span');
      tape.className = i % 2 ? 'tape tape--b' : 'tape';
      tape.style.setProperty('--tape-tilt', `${i % 2 ? 4 : -5}deg`);

      const media = item.src ? U.media(item.src, item.alt, 'polaroid__media') : placeholder(i);
      if (item.src) media.loading = 'lazy';

      const cap = document.createElement('span');
      cap.className = 'polaroid__caption hand';
      cap.textContent = item.caption;

      btn.append(tape, media, cap);
      btn.addEventListener('click', () => onGoofy(btn, i));
      li.append(btn);
      list.append(li);
    });
    polaroids = U.$$('.reveal__goofy-item', scene);
  }

  function init(el){
    scene   = el;
    sticker = U.$('#reveal-cat', scene);
    cat     = Cats.set(U.$('.sticker__media', sticker), cfg.catMood);
    kicker  = U.$('.reveal__kicker', scene);
    nameEl  = U.$('.reveal__name', scene);
    buildTitle();
    buildGoofy();
    watchAmbient();
  }

  /* ---------- interactions ---------- */

  function onGoofy(btn, i){
    const r = cfg.goofyReactions[i % cfg.goofyReactions.length];
    U.animate(btn, [
      { transform: 'rotate(0deg) scale(1)' },
      { transform: 'rotate(-3deg) scale(1.04)', offset: .3 },
      { transform: 'rotate(2deg) scale(1.02)',  offset: .65 },
      { transform: 'rotate(0deg) scale(1)' }
    ], { duration: 520, fill: 'none', essential: false });
    Cats.react(r.mood, r.text, 1800);
  }

  /* hearts & stars pop out from the cat when it lands */
  function burst(){
    if (U.reduced()) return;
    const box = scene.getBoundingClientRect();
    const r = sticker.getBoundingClientRect();
    const cx = r.left - box.left + r.width / 2;
    const cy = r.top - box.top + r.height / 2;
    const symbols = ['d-heart', 'd-sparkle', 'd-heart', 'd-star'];
    const colours = ['var(--accent)', 'var(--butter)', 'var(--accent)', 'var(--ink)'];
    const count = 12;

    for (let i = 0; i < count; i++){
      const angle = (i / count) * Math.PI * 2 + (Math.random() - .5) * .4;
      const dist  = r.width * (.62 + Math.random() * .22);
      const size  = 14 + Math.random() * 12;
      const sym   = symbols[i % symbols.length];

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', sym === 'd-heart' ? '0 0 26 24' : '0 0 34 34');
      svg.setAttribute('class', 'burst doodle ' + (sym === 'd-star' ? '' : 'doodle--filled'));
      svg.style.cssText = `left:${cx - size / 2}px;top:${cy - size / 2}px;width:${size}px;color:${colours[i % colours.length]}`;
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', '#' + sym);
      svg.append(use);
      scene.append(svg);

      const dx = Math.cos(angle) * dist, dy = Math.sin(angle) * dist;
      const spin = (Math.random() - .5) * 90;
      svg.animate([
        { transform: 'translate(0,0) scale(.3) rotate(0deg)', opacity: 0 },
        { opacity: 1, offset: .2 },
        { transform: `translate(${dx}px, ${dy}px) scale(1) rotate(${spin}deg)`, opacity: 1, offset: .7 },
        { transform: `translate(${dx * 1.08}px, ${dy * 1.08 + 14}px) scale(.9) rotate(${spin}deg)`, opacity: 0 }
      ], { duration: 1100, easing: 'cubic-bezier(.2,.8,.2,1)' }).finished.then(() => svg.remove(), () => svg.remove());
    }
  }

  /* ambient floaters only run while the reveal is on screen */
  function watchAmbient(){
    const ambient = U.$('.reveal__ambient', scene);
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(([entry]) => {
      ambient.classList.toggle('is-paused', !entry.isIntersecting);
    }).observe(scene);
  }

  /* ---------- entrance ---------- */

  function enter(){
    const ease = 'cubic-bezier(.2,.8,.2,1)';
    const settle = 'cubic-bezier(.34,1.36,.64,1)';
    const all = [];

    all.push(U.animate(kicker, [
      { opacity: 0, transform: 'rotate(-14deg) scale(.6)' },
      { opacity: 1, transform: 'rotate(-4deg) scale(1)' }
    ], { duration: 520, easing: settle, delay: 80 }));

    letters.forEach((l, i) => {
      const tilt = ((i * 37) % 11) - 5;            // deterministic little wobble per letter
      all.push(U.animate(l, [
        { opacity: 0, transform: `translateY(.45em) rotate(${tilt}deg)` },
        { opacity: 1, transform: 'translateY(0) rotate(0deg)' }
      ], { duration: 620, easing: settle, delay: 180 + i * 34 }));
    });

    const textDone = 180 + letters.length * 34;

    all.push(U.animate(nameEl, [
      { opacity: 0, transform: 'translateY(16px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 560, easing: ease, delay: textDone - 120 }));
    nameEl.classList.remove('is-marked');
    setTimeout(() => nameEl.classList.add('is-marked'), U.reduced() ? 0 : textDone + 260);

    // the cat is slapped on like a sticker
    const slapAt = textDone + 120;
    const tilt = getComputedStyle(sticker).getPropertyValue('--tilt').trim() || '-3deg';
    all.push(U.animate(sticker, [
      { opacity: 0, transform: 'rotate(-18deg) scale(1.35)' },
      { opacity: 1, transform: 'rotate(4deg) scale(.96)', offset: .65 },
      { opacity: 1, transform: `rotate(${tilt}) scale(1)` }
    ], { duration: 560, easing: 'cubic-bezier(.3,.7,.2,1)', delay: slapAt }));
    all.push(U.animate(U.$('.reveal__cat .tape', scene), [
      { opacity: 0 }, { opacity: 1 }
    ], { duration: 240, delay: slapAt + 380 }));
    U.$$('.reveal__spark', scene).forEach((s, i) => all.push(U.animate(s, [
      { opacity: 0, transform: 'scale(.2) rotate(-40deg)' },
      { opacity: 1, transform: 'scale(1) rotate(0deg)' }
    ], { duration: 480, easing: settle, delay: slapAt + 420 + i * 120 })));
    setTimeout(burst, slapAt + 300);

    // goofy polaroids are dropped onto the page one by one
    polaroids.forEach((p, i) => all.push(U.animate(p, [
      { opacity: 0, transform: 'translateY(-40px) rotate(-8deg)' },
      { opacity: 1, transform: 'translateY(0) rotate(0deg)' }
    ], { duration: 640, easing: settle, delay: slapAt + 380 + i * 150 })));

    const ambient = U.$('.reveal__ambient', scene);
    all.push(U.animate(ambient, [{ opacity: 0 }, { opacity: 1 }], {
      duration: 1200, delay: slapAt + 600, essential: false
    }));

    return Promise.all(all).then(() => {
      // end states match the CSS, so drop the held animations and let
      // hover / interaction styles take over again
      [kicker, nameEl, sticker, ...letters, ...polaroids].forEach((el) =>
        el.getAnimations().forEach((a) => a.cancel()));

      // the payoff has landed: put the song on the page below and
      // offer a gentle cue — she scrolls when she's ready
      Scenes.unlock('song');
      showCue();
    });
  }

  function showCue(){
    const cue = U.$('.cue', scene);
    if (!cue.hidden) return;
    cue.hidden = false;
    U.animate(cue, [
      { opacity: 0, transform: 'translate(-50%, 10px)' },
      { opacity: 1, transform: 'translate(-50%, 0)' }
    ], { duration: 600, delay: 400, fill: 'backwards' });
    cue.addEventListener('click', () => {
      if (!Scenes.isEntered('song')) return Scenes.go('song');
      const song = document.querySelector('section[data-scene="song"]');
      song.scrollIntoView({ behavior: U.reduced() ? 'auto' : 'smooth', block: 'start' });
      U.$('#song-heading').focus({ preventScroll: true });
    });
  }

  return { init, enter };
})());
