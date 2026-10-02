/* ================================================================
   CAT REACTIONS — cats are reactions, not a page.

   Cats.set(el, mood)        swap a cat image in place
   Cats.react(mood, text)    pop a cat sticker + line in from the bottom
   Cats.say(text)            announce text to screen readers only
================================================================= */
window.Cats = (() => {
  const cfg = window.BIRTHDAY.cats;
  const live = document.getElementById('live');
  let toast = null;
  let hideTimer = null;
  let queue = Promise.resolve();

  function get(mood){
    return cfg[mood] || cfg.neutral;
  }

  function set(el, mood){
    const { src, alt } = get(mood);
    return U.swapMedia(el, src, alt);
  }

  function say(text){
    if (!live || !text) return;
    live.textContent = '';
    // next frame so repeated identical messages are still announced
    requestAnimationFrame(() => { live.textContent = text; });
  }

  function ensureToast(){
    if (toast) return toast;
    toast = document.createElement('div');
    toast.className = 'reaction';
    toast.setAttribute('aria-hidden', 'true');   // text is announced via #live
    toast.hidden = true;
    const { src, alt } = get('neutral');
    toast.append(U.media(src, alt, 'reaction__cat'));
    const text = document.createElement('span');
    text.className = 'reaction__text';
    toast.append(text);
    document.body.append(toast);
    return toast;
  }

  async function show(mood, text, holdMs){
    const el = ensureToast();
    const cat = el.querySelector('.reaction__cat');
    set(cat, mood);
    el.querySelector('.reaction__text').textContent = text || '';
    say(text);

    clearTimeout(hideTimer);
    if (el.hidden){
      el.hidden = false;
      await U.animate(el, [
        { transform: 'translate(-50%, 140%) rotate(-6deg)', opacity: 0 },
        { transform: 'translate(-50%, 0) rotate(0deg)',     opacity: 1 }
      ], { duration: 520, easing: 'cubic-bezier(.34,1.36,.64,1)' });
    } else {
      await U.animate(cat, [
        { transform: 'scale(.8) rotate(-8deg)' },
        { transform: 'scale(1) rotate(0deg)' }
      ], { duration: 360, easing: 'cubic-bezier(.34,1.36,.64,1)', essential: false });
    }

    await new Promise((r) => { hideTimer = setTimeout(r, holdMs); });
    await U.animate(el, [
      { transform: 'translate(-50%, 0)',    opacity: 1 },
      { transform: 'translate(-50%, 140%)', opacity: 0 }
    ], { duration: 380, easing: 'cubic-bezier(.65,0,.35,1)' });
    el.hidden = true;
  }

  /* Reactions queue so they never stack on top of each other. */
  function react(mood, text, holdMs = 2200){
    queue = queue.then(() => show(mood, text, holdMs));
    return queue;
  }

  // preload every mood so the first reaction never flashes blank
  U.preload(Object.values(cfg).map((c) => c.src));

  return { get, set, say, react };
})();
