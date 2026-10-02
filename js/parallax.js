/* ================================================================
   POINTER PARALLAX — desktop only
   Elements with data-depth="n" drift up to n px opposite the
   cursor, eased with a little inertia. Uses the CSS `translate`
   property so it never fights transform-based animations.
   Off for touch screens and for reduced motion.
================================================================= */
(() => {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  let targetX = 0, targetY = 0, x = 0, y = 0;
  let raf = 0;
  let items = [];

  const enabled = () => fine.matches && !U.reduced();

  function collect(){
    items = U.$$('[data-depth]').map((el) => ({ el, depth: parseFloat(el.dataset.depth) || 0 }));
  }

  function apply(){
    items.forEach(({ el, depth }) => {
      el.style.translate = `${(x * depth).toFixed(2)}px ${(y * depth).toFixed(2)}px`;
    });
  }

  function tick(){
    x += (targetX - x) * 0.08;
    y += (targetY - y) * 0.08;
    apply();
    if (Math.abs(targetX - x) > 0.001 || Math.abs(targetY - y) > 0.001){
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
    }
  }

  function onMove(e){
    if (!enabled()) return;
    // -1 … 1 from the centre of the window, inverted so things drift away
    targetX = -((e.clientX / window.innerWidth)  * 2 - 1);
    targetY = -((e.clientY / window.innerHeight) * 2 - 1);
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function reset(){
    targetX = targetY = x = y = 0;
    items.forEach(({ el }) => { el.style.translate = ''; });
  }

  collect();
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('mouseleave', () => {
    targetX = targetY = 0;
    if (!raf && enabled()) raf = requestAnimationFrame(tick);
  });
  U.motionQuery.addEventListener?.('change', reset);
  fine.addEventListener?.('change', reset);
})();
