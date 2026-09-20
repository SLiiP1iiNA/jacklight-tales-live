/*
 * Woodland Search — Luna voice layer.
 * Queue-aware so quick taps never cut Luna off mid-sentence.
 */
(() => {
  const base = 'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Luna/';
  const files = {
    welcome: 'Welcome.mp3',
    beginSearch: 'Begin Searching.mp3',
    hintOne: 'First Hint.mp3',
    hintTwo: 'Second Hint.mp3',
    friendFound: 'Friend Found.mp3',
    friendFound2: 'Friend Found 2.mp3',
    friendFound3: 'Friend Found 3.mp3',
    friendFound4: 'Friend Found 4.mp3',
    friendFound5: 'Friend Found 5.mp3',
    barnabyFound: 'Barnaby Found.mp3',
    heartSeed: 'Heart Seed Secret.mp3',
    nextLocation: 'Next Location.mp3',
    allFound: 'Everything Found.mp3',
    goodbye: 'Goodbye.mp3'
  };

  const slots = Object.fromEntries(
    Object.entries(files).map(([key, name]) => [key, base + encodeURIComponent(name)])
  );

  const player = document.getElementById('luna-audio');
  if (!player) {
    console.error('Woodland Search: #luna-audio was not found.');
    return;
  }

  player.preload = 'auto';
  player.playsInline = true;

  let enabled = true;
  let queue = [];
  let currentName = null;
  let idleWaiters = [];

  function emitError(name, error) {
    console.warn('Woodland Search Luna audio failed:', name, error);
    window.dispatchEvent(new CustomEvent('woodland-audio-error', {
      detail: {
        name,
        src: player.currentSrc || player.src,
        message: String(error?.message || error || 'Audio could not play')
      }
    }));
  }

  function resolveIdle() {
    if (enabled && (currentName || !player.paused || queue.length)) return;
    const waiters = idleWaiters;
    idleWaiters = [];
    waiters.forEach(resolve => resolve());
  }

  function waitForIdle() {
    if (!enabled || (!currentName && player.paused && !queue.length)) {
      return Promise.resolve();
    }
    return new Promise(resolve => idleWaiters.push(resolve));
  }

  function prepare(name, volume) {
    const src = slots[name];
    if (!src) return false;
    currentName = name;
    player.muted = !enabled;
    player.volume = Math.max(0, Math.min(1, volume));
    player.src = src;
    player.load();
    return true;
  }

  async function start(name, volume = 0.92) {
    if (!enabled || !prepare(name, volume)) return false;

    try {
      await player.play();
      return true;
    } catch (error) {
      currentName = null;
      emitError(name, error);
      queue = [];
      resolveIdle();
      return false;
    }
  }

  function stop() {
    queue = [];
    currentName = null;
    try {
      player.pause();
      player.currentTime = 0;
    } catch {}
    resolveIdle();
  }

  function play(name, { interrupt = true, volume = 0.92 } = {}) {
    if (!enabled || !slots[name]) return Promise.resolve(false);

    if (!interrupt && (!player.paused || currentName)) {
      queue.push({ name, volume });
      return Promise.resolve(true);
    }

    queue = [];
    if (interrupt) {
      try { player.pause(); } catch {}
    }
    return start(name, volume);
  }

  function playSequence(names, { volume = 0.92, interrupt = true } = {}) {
    const valid = names.filter(name => slots[name]);
    if (!enabled || !valid.length) return Promise.resolve(false);

    if (!interrupt && (!player.paused || currentName)) {
      valid.forEach(name => queue.push({ name, volume }));
      return Promise.resolve(true);
    }

    queue = valid.slice(1).map(name => ({ name, volume }));
    if (interrupt) {
      try { player.pause(); } catch {}
    }
    return start(valid[0], volume);
  }

  player.addEventListener('ended', () => {
    currentName = null;
    const next = queue.shift();
    if (enabled && next) {
      start(next.name, next.volume);
    } else {
      resolveIdle();
    }
  });

  player.addEventListener('error', () => {
    const failedName = currentName;
    currentName = null;
    queue = [];
    emitError(failedName, player.error || new Error('Media file could not load'));
    resolveIdle();
  });

  function setEnabled(value) {
    enabled = Boolean(value);
    player.muted = !enabled;
    if (!enabled) stop();
    else resolveIdle();
  }

  window.jltGameAudio = {
    play,
    playSequence,
    stop,
    waitForIdle,
    isEnabled: () => enabled,
    isPlaying: () => enabled && !player.paused,
    current: () => currentName,
    player,
    slots: { ...slots }
  };
})();
