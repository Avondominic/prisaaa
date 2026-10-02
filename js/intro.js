/* ================================================================
   SCENE 1 — INTRO
   "HEY!! I made something for you..."  YES / NO

   NO  → the cat gets offended, NO shrinks, YES grows. Stays here.
   YES → happy cat, little hop, then the "opening..." scene.
================================================================= */
Scenes.register('intro', (() => {
  const cfg = window.BIRTHDAY.intro;
  let cat, yesBtn, noBtn, reply;
  let noCount = 0;
  let decided = false;

  function init(scene){
    cat    = U.$('#intro-cat', scene);
    yesBtn = U.$('.intro__yes', scene);
    noBtn  = U.$('.intro__no', scene);
    reply  = U.$('.intro__reply', scene);

    // "HEY!!" → colour the trailing punctuation
    const title = U.$('.intro__title', scene);
    const [, word, bang] = cfg.greeting.match(/^(.*?)([!?.]*)$/);
    title.textContent = word;
    if (bang){
      const span = document.createElement('span');
      span.className = 'bang';
      span.textContent = bang;
      title.append(span);
    }

    cat = Cats.set(cat, 'neutral');
    yesBtn.addEventListener('click', onYes);
    noBtn.addEventListener('click', onNo);
  }

  function shake(el){
    return U.animate(el, [
      { transform: 'translateX(0) rotate(0)' },
      { transform: 'translateX(-9px) rotate(-3deg)' },
      { transform: 'translateX(8px) rotate(3deg)' },
      { transform: 'translateX(-5px) rotate(-1.5deg)' },
      { transform: 'translateX(3px) rotate(1deg)' },
      { transform: 'translateX(0) rotate(0)' }
    ], { duration: 460, easing: 'cubic-bezier(.36,.07,.19,.97)', fill: 'none', essential: false });
  }

  function hop(el){
    return U.animate(el, [
      { transform: 'translateY(0) scale(1)' },
      { transform: 'translateY(-16px) scale(1.04)', offset: .4 },
      { transform: 'translateY(0) scale(.98)',      offset: .75 },
      { transform: 'translateY(0) scale(1)' }
    ], { duration: 560, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'none', essential: false });
  }

  function setReply(text){
    reply.textContent = text;
    U.animate(reply, [
      { opacity: 0, transform: 'translateY(6px) rotate(-2deg)' },
      { opacity: 1, transform: 'translateY(0) rotate(-2deg)' }
    ], { duration: 280, fill: 'none' });
  }

  function onNo(){
    if (decided) return;
    const replies = cfg.noReplies;
    const labels  = cfg.noLabels;

    setReply(replies[Math.min(noCount, replies.length - 1)]);
    noCount += 1;
    noBtn.textContent = labels[Math.min(noCount, labels.length - 1)];

    // YES grows, NO shrinks — capped so both stay readable and tappable
    yesBtn.style.setProperty('--size', Math.min(1 + noCount * 0.1, 1.5).toFixed(2));
    noBtn.style.setProperty('--size',  Math.max(1 - noCount * 0.04, 0.86).toFixed(2));

    cat = Cats.set(cat, 'angry');
    shake(cat.closest('.intro__cat'));
  }

  async function onYes(){
    if (decided) return;
    decided = true;
    yesBtn.setAttribute('aria-pressed', 'true');
    noBtn.disabled = true;

    cat = Cats.set(cat, 'happy');
    setReply(cfg.yesReply);
    await hop(cat.closest('.intro__cat'));
    await U.wait(U.reduced() ? 300 : 650);
    Scenes.next();
  }

  return { init };
})());
