/* ================================================================
   SCENE 2 — OPENING
   A short "opening..." beat between YES and the reveal.
================================================================= */
Scenes.register('opening', (() => {
  const cfg = window.BIRTHDAY.opening;

  function init(scene){
    Cats.set(U.$('#opening-cat', scene), 'happy');
  }

  async function enter(scene){
    const duration = U.reduced() ? Math.min(cfg.durationMs, 900) : cfg.durationMs;
    const fill = U.$('.opening__fill', scene);
    Cats.say(cfg.text + '…');

    await U.animate(fill, [
      { transform: 'scaleX(0)' },
      { transform: 'scaleX(.62)', offset: .45 },
      { transform: 'scaleX(.78)', offset: .7 },
      { transform: 'scaleX(1)' }
    ], { duration, easing: 'cubic-bezier(.45,0,.2,1)', essential: false });
    if (U.reduced()) await U.wait(duration);

    Scenes.next();
  }

  return { init, enter };
})());
