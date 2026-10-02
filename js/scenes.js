/* ================================================================
   SCENE CONTROLLER

   intro → opening → reveal → song → memories → letter → gift → finale

   • "Stage" scenes (intro, opening) take over the screen one at a
     time and disappear once passed — no going back to the question.
   • "Story" scenes (reveal onwards) stay on the page once unlocked,
     so she can scroll back through everything she's seen.

   Story scenes are unlocked by the scene before them
   (Scenes.unlock('song')): they appear on the page right away but
   only play their entrance once scrolled into view, so nothing
   ever drags her away from what she's looking at.

   Scene modules register themselves:
     Scenes.register('intro', { init(el){}, enter(el){} })
   and move the story forward with:
     Scenes.next()            from the current scene
     Scenes.go('reveal')      to a specific scene
================================================================= */
window.Scenes = (() => {
  const ORDER = ['intro', 'opening', 'reveal', 'song', 'memories', 'letter', 'gift', 'finale'];
  const STAGE = new Set(['intro', 'opening']);

  const handlers = {};
  let current = null;

  const el = (id) => document.querySelector(`section[data-scene="${id}"]`);

  function register(id, handler){
    handlers[id] = handler;
  }

  /* Children marked [data-stagger] rise in one after another. */
  function stagger(scene){
    const items = U.$$('[data-stagger]', scene);
    return Promise.all(items.map((item, i) => U.animate(item, [
      { opacity: 0, transform: 'translateY(18px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 620, delay: 90 + i * 90 })));
  }

  async function leave(scene){
    await U.animate(scene, [
      { opacity: 1, transform: 'translateY(0) scale(1)' },
      { opacity: 0, transform: 'translateY(-14px) scale(.985)' }
    ], { duration: 420, easing: 'cubic-bezier(.65,0,.35,1)' });
    scene.hidden = true;
    scene.getAnimations?.().forEach((a) => a.cancel());
  }

  async function enter(id, { scroll = true, focus = true } = {}){
    const scene = el(id);
    if (!scene) return;
    scene.hidden = false;
    scene.classList.remove('is-waiting');
    current = id;
    document.documentElement.dataset.currentScene = id;

    if (STAGE.has(id)) window.scrollTo(0, 0);
    else if (scroll) scene.scrollIntoView({ behavior: U.reduced() ? 'auto' : 'smooth', block: 'start' });

    // move focus to the scene heading so keyboard/screen-reader users follow along
    const heading = U.$('[data-focus]', scene) || U.$('h1, h2', scene);
    if (heading && focus){
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }

    const run = stagger(scene);
    handlers[id]?.enter?.(scene);
    await run;
  }

  /* Transitions are queued, never dropped: a scene that finishes
     early (e.g. a short "opening") still advances cleanly. */
  let chain = Promise.resolve();
  const entered = new Set();
  function go(id, opts){
    chain = chain.then(async () => {
      if (entered.has(id)) return;
      entered.add(id);
      const from = current && el(current);
      if (from && STAGE.has(current)) await leave(from);
      await enter(id, opts);
    });
    return chain;
  }

  /* Put the next story scene on the page; its entrance plays when
     it scrolls into view (or straight away via Scenes.go). */
  function unlock(id){
    const scene = el(id);
    if (!scene || !scene.hidden) return;
    scene.classList.add('is-waiting');
    scene.hidden = false;
    handlers[id]?.unlock?.(scene);

    if (!('IntersectionObserver' in window)) return go(id, { scroll: false, focus: false });
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      go(id, { scroll: false, focus: false });
    }, { rootMargin: '0px 0px -25% 0px' });
    io.observe(scene);
  }

  const isEntered = (id) => entered.has(id);

  function next(){
    const i = ORDER.indexOf(current);
    const id = ORDER[i + 1];
    if (id && el(id)) return go(id);
  }

  function start(){
    ORDER.forEach((id) => {
      const scene = el(id);
      if (!scene) return;
      scene.hidden = true;
      handlers[id]?.init?.(scene);
    });
    return go(ORDER[0]);
  }

  return { register, go, next, unlock, start, isEntered, get current(){ return current; } };
})();
