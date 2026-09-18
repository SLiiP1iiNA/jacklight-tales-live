/*
 * Woodland Search — Luna voice layer.
 *
 * Uses one persistent DOM <audio> element. Keeping the same media element for
 * every cue is the most reliable approach on iPhone/Safari: the first Begin
 * tap starts Welcome.mp3 directly, then later cues reuse the unlocked player.
 */
(() => {
  const base = 'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Luna/';
  const file = name => `${base}${encodeURIComponent(name)}`;

  const slots = {
    welcome: file('Welcome.mp3'),
    beginSearch: file('Begin Searching.mp3'),
    hintOne: file('First Hint.mp3'),
    hintTwo: file('Second Hint.mp3'),
    friendFound: file('Friend Found.mp3'),
    barnabyFound: file('Barnaby Found.mp3'),
    heartSeed: file('Heart Seed Secret.mp3'),
    nextLocation: file('Next Location.mp3'),
    allFound: file('Everything Found.mp3'),
    goodbye: file('Goodbye.mp3')
  };

  Object.assign(slots, window.WOODLAND_LUNA_AUDIO || {});

  const player = document.getElementById('luna-audio') || new Audio();
  player.preload = 'auto';
  player.playsInline = true;
  player.setAttribute('playsinline', '');
  player.setAttribute('webkit-playsinline', '');

  let enabled = true;
  let currentName = null;
  let queued = [];
  let queuedVolume = 0.9;
  let lastError = null;

  function absolute(src) {
    try { return new URL(src, location.href).href; } catch { return src; }
  }

  function sameSource(src) {
    const wanted = absolute(src);
    return player.currentSrc === wanted || player.src === wanted;
  }

  function setSource(src) {
    if (sameSource(src)) return;
    player.src = src;
    player.load();
  }

  function resetPlayer({ clearQueue = false } = {}) {
    try {
      player.pause();
      if (Number.isFinite(player.duration) || player.readyState > 0) player.currentTime = 0;
    } catch {}
    currentName = null;
    if (clearQueue) queued = [];
  }

  function stop() {
    resetPlayer({ clearQueue: true });
  }

  async function start(name, volume = 0.9) {
    if (!enabled) return false;
    const src = slots[name];
    if (!src) return false;

    lastError = null;
    currentName = name;
    player.volume = Math.max(0, Math.min(1, volume));

    try {
      setSource(src);
      if (sameSource(src) && player.ended) player.currentTime = 0;
      await player.play();
      return true;
    } catch (error) {
      currentName = null;
      lastError = error;
      console.warn('Woodland Search Luna audio could not play:', name, src, error);
      window.dispatchEvent(new CustomEvent('woodland-audio-error', {
        detail: { name, src, message: String(error?.message || error || 'Audio could not play') }
      }));
      return false;
    }
  }

  function play(name, { interrupt = true, volume = 0.9 } = {}) {
    if (!enabled || !slots[name]) return Promise.resolve(false);
    if (!interrupt && currentName && !player.paused) return Promise.resolve(false);

    queued = [];
    if (interrupt) resetPlayer();
    return start(name, volume);
  }

  function playSequence(names, { volume = 0.9 } = {}) {
    const valid = names.filter(name => Boolean(slots[name]));
    if (!enabled || !valid.length) return Promise.resolve(false);

    queued = valid.slice(1);
    queuedVolume = volume;
    resetPlayer();
    return start(valid[0], volume);
  }

  player.addEventListener('ended', async () => {
    currentName = null;
    if (!enabled || !queued.length) return;
    const next = queued.shift();
    await start(next, queuedVolume);
  });

  player.addEventListener('error', () => {
    const mediaError = player.error;
    currentName = null;
    queued = [];
    lastError = mediaError;
    console.warn('Woodland Search Luna media error:', mediaError, player.currentSrc || player.src);
    window.dispatchEvent(new CustomEvent('woodland-audio-error', {
      detail: {
        name: currentName,
        src: player.currentSrc || player.src,
        message: mediaError ? `Media error ${mediaError.code}` : 'Audio file could not load'
      }
    }));
  });

  function setEnabled(value) {
    enabled = Boolean(value);
    player.muted = !enabled;
    if (!enabled) stop();
  }

  window.jltGameAudio = {
    play,
    playSequence,
    stop,
    setEnabled,
    isEnabled: () => enabled,
    isPlaying: () => Boolean(currentName && !player.paused),
    current: () => currentName,
    lastError: () => lastError,
    player,
    slots: { ...slots }
  };
})();