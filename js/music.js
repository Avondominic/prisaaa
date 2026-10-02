/* ================================================================
   MUSIC — one <audio>, one state, any number of player UIs.

   • NEVER autoplays. Nothing plays until a play button is pressed
     (a real user gesture, so browsers allow it).
   • The file is only requested once the song section is reached.
   • If the file is missing or can't play, every player says so.

   Music.load()          attach the source (metadata only)
   Music.bind(rootEl)    wire up a player UI inside rootEl
   Music.showMini()      reveal the sticky mini-player
   Music.on(fn)          subscribe to state changes
================================================================= */
window.Music = (() => {
  const cfg = window.BIRTHDAY.song;
  const audio = new Audio();
  audio.preload = 'none';
  audio.loop = false;

  const state = {
    status: 'idle',          // idle | ready | playing | paused | missing
    time: 0,
    duration: 0,
    volume: clamp(cfg.volume ?? .8),
    muted: false
  };
  const listeners = new Set();
  let fadeRaf = 0;
  let playedOnce = false;
  let mini = null;

  function clamp(v){ return Math.min(1, Math.max(0, Number(v) || 0)); }

  function fmt(sec){
    if (!isFinite(sec) || sec <= 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function emit(){ listeners.forEach((fn) => fn(state)); }
  function set(patch){ Object.assign(state, patch); emit(); }

  /* ---------- volume fades (desktop browsers; iOS ignores volume) ---------- */
  function fadeTo(target, ms){
    cancelAnimationFrame(fadeRaf);
    const from = audio.volume;
    if (U.reduced() || ms <= 0){ audio.volume = target; return Promise.resolve(); }
    const start = performance.now();
    return new Promise((resolve) => {
      const step = (now) => {
        const t = Math.min(1, (now - start) / ms);
        audio.volume = from + (target - from) * t;
        if (t < 1) fadeRaf = requestAnimationFrame(step); else resolve();
      };
      fadeRaf = requestAnimationFrame(step);
    });
  }

  /* ---------- loading ---------- */
  function load(){
    if (audio.src || state.status === 'missing') return;
    if (!cfg.src){ set({ status: 'missing' }); return; }
    audio.preload = 'metadata';
    audio.src = cfg.src;
    audio.load();
  }

  audio.addEventListener('loadedmetadata', () => {
    set({ duration: audio.duration || 0, status: state.status === 'idle' ? 'ready' : state.status });
  });
  audio.addEventListener('timeupdate', () => set({ time: audio.currentTime }));
  audio.addEventListener('error', () => {
    if (!audio.src) return;
    set({ status: 'missing' });
  });
  audio.addEventListener('ended', () => {
    audio.currentTime = 0;
    set({ status: 'paused', time: 0 });
    Cats.say('song finished');
  });

  /* ---------- transport ---------- */
  async function play(){
    load();
    if (state.status === 'missing'){
      Cats.react('shock', cfg.missing, 2600);
      return;
    }
    audio.muted = state.muted;
    audio.volume = 0;
    try {
      await audio.play();                 // must come from a user gesture
    } catch (err){
      if (err && err.name === 'NotAllowedError'){
        set({ status: 'paused' });
        Cats.say('playback was blocked by the browser — press play again');
      } else {
        set({ status: 'missing' });
      }
      return;
    }
    set({ status: 'playing' });
    Cats.say(`playing ${cfg.title} by ${cfg.artist}`);
    fadeTo(state.volume, 700);
    if (!playedOnce){
      playedOnce = true;
      if (cfg.firstPlay) Cats.react(cfg.firstPlay.mood, cfg.firstPlay.text, 2200);
    }
  }

  async function pause(){
    if (state.status !== 'playing') return;
    set({ status: 'paused' });
    Cats.say('paused');
    await fadeTo(0, 260);
    if (state.status === 'paused') audio.pause();
  }

  function toggle(){ return state.status === 'playing' ? pause() : play(); }

  function seek(sec){
    if (!state.duration) return;
    audio.currentTime = Math.min(state.duration, Math.max(0, sec));
    set({ time: audio.currentTime });
  }

  function setVolume(v){
    const volume = clamp(v);
    cancelAnimationFrame(fadeRaf);
    audio.volume = volume;
    const muted = volume === 0 ? true : (state.muted && volume > 0 ? false : state.muted);
    audio.muted = muted;
    set({ volume, muted });
  }

  function toggleMute(){
    const muted = !state.muted;
    audio.muted = muted;
    if (!muted && state.volume === 0){ setVolume(.5); return; }
    set({ muted });
    Cats.say(muted ? 'muted' : 'unmuted');
  }

  /* ---------- binding a player UI ----------
     Any element can contain any of these and they'll just work:
     .player__play  .player__seek  .player__now  .player__dur
     .player__mute  .player__vol   .player__missing            */
  function bind(root){
    const q = (s) => root.querySelector(s);
    const playBtn = q('.player__play');
    const seekEl  = q('.player__seek');
    const nowEl   = q('.player__now');
    const durEl   = q('.player__dur');
    const muteBtn = q('.player__mute');
    const volEl   = q('.player__vol');
    const missEl  = q('.player__missing');
    let dragging = false;

    playBtn?.addEventListener('click', toggle);
    muteBtn?.addEventListener('click', toggleMute);
    volEl?.addEventListener('input', () => setVolume(volEl.value / 100));
    if (seekEl){
      seekEl.addEventListener('input', () => { dragging = true; nowEl && (nowEl.textContent = fmt(+seekEl.value)); });
      seekEl.addEventListener('change', () => { dragging = false; seek(+seekEl.value); });
    }

    function render(s){
      const playing = s.status === 'playing';
      const missing = s.status === 'missing';
      root.classList.toggle('is-playing', playing);
      root.classList.toggle('is-missing', missing);

      if (playBtn){
        playBtn.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${cfg.title}`);
        playBtn.setAttribute('aria-disabled', String(missing));
        playBtn.querySelector('use')?.setAttribute('href', playing ? '#i-pause' : '#i-play');
      }
      if (seekEl){
        seekEl.max = Math.floor(s.duration) || 0;
        seekEl.disabled = !s.duration;
        if (!dragging) seekEl.value = Math.floor(s.time);
        seekEl.setAttribute('aria-valuetext', `${fmt(s.time)} of ${s.duration ? fmt(s.duration) : 'unknown'}`);
        seekEl.style.setProperty('--p', s.duration ? (s.time / s.duration * 100).toFixed(2) + '%' : '0%');
      }
      if (nowEl && !dragging) nowEl.textContent = fmt(s.time);
      if (durEl) durEl.textContent = s.duration ? fmt(s.duration) : '--:--';
      if (muteBtn){
        const silent = s.muted || s.volume === 0;
        muteBtn.setAttribute('aria-pressed', String(silent));
        muteBtn.setAttribute('aria-label', silent ? 'Unmute' : 'Mute');
        muteBtn.querySelector('use')?.setAttribute('href', silent ? '#i-mute' : '#i-vol');
      }
      if (volEl){
        const v = s.muted ? 0 : Math.round(s.volume * 100);
        if (+volEl.value !== v) volEl.value = v;
        volEl.style.setProperty('--p', v + '%');
        volEl.setAttribute('aria-valuetext', `${v}%`);
      }
      if (missEl){
        missEl.hidden = !missing;
        missEl.textContent = missing ? cfg.missing : '';
      }
    }

    listeners.add(render);
    render(state);
  }

  /* ---------- sticky mini-player ---------- */
  function buildMini(){
    mini = document.createElement('div');
    mini.className = 'mini';
    mini.setAttribute('role', 'region');
    mini.setAttribute('aria-label', 'music player');
    mini.hidden = true;

    const cat = U.media(Cats.get('neutral').src, '', 'mini__cat');
    cat.setAttribute('aria-hidden', 'true');

    const meta = document.createElement('div');
    meta.className = 'mini__meta';
    const t = document.createElement('span');
    t.className = 'mini__title';
    t.textContent = cfg.title;
    const a = document.createElement('span');
    a.className = 'mini__artist';
    a.textContent = cfg.artist;
    meta.append(t, a);

    const mk = (cls, icon) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `mini__btn ${cls}`;
      b.innerHTML = `<svg aria-hidden="true"><use href="#${icon}"/></svg>`;
      return b;
    };
    const play = mk('player__play mini__play', 'i-play');
    const mute = mk('player__mute', 'i-vol');

    mini.append(cat, meta, play, mute);
    document.body.append(mini);
    bind(mini);

    let lastMood = '';
    listeners.add((s) => {
      const mood = s.status === 'playing' ? 'love' : 'neutral';
      if (mood !== lastMood){ lastMood = mood; Cats.set(mini.querySelector('.mini__cat'), mood); }
    });
  }

  function showMini(){
    if (!mini) buildMini();
    if (!mini.hidden) return;
    mini.hidden = false;
    document.body.classList.add('has-mini');
    U.animate(mini, [
      { opacity: 0, transform: 'translateY(30px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'none' });
  }

  audio.volume = state.volume;

  return {
    load, play, pause, toggle, seek, setVolume, toggleMute, bind, showMini,
    on: (fn) => { listeners.add(fn); fn(state); },
    get state(){ return { ...state }; }
  };
})();
