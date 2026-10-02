/* ================================================================
   SCENE 4 — SONG  ("okay, now listen to this")

   A cassette + a player card. Entering the section does NOT play
   anything — it only loads the file's metadata and shows the
   sticky mini-player. Playback starts on a press, never before.
================================================================= */
Scenes.register('song', (() => {
  let deck, cat;
  let mood = '';

  function init(scene){
    deck = U.$('.song__deck', scene);
    cat  = U.$('#song-cat', scene);
    cat  = Cats.set(cat, 'neutral');
    Music.bind(U.$('.player', scene));

    Music.on((s) => {
      const playing = s.status === 'playing';
      deck.classList.toggle('is-playing', playing);

      // tape winds from the left spool to the right as the song plays
      const p = s.duration ? Math.min(1, s.time / s.duration) : 0;
      deck.style.setProperty('--spool-l', (1 - p * .3).toFixed(3));
      deck.style.setProperty('--spool-r', (.7 + p * .3).toFixed(3));

      const next = playing ? 'love' : (s.status === 'missing' ? 'shock' : 'neutral');
      if (next !== mood){ mood = next; cat = Cats.set(cat, mood); }
    });
  }

  // unlocked (end of the reveal): fetch metadata so the player is ready
  function unlock(){ Music.load(); }

  function enter(){
    Music.load();
    Music.showMini();
  }

  return { init, unlock, enter };
})());
