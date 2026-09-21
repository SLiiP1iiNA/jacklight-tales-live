/*
 * Woodland Search — Luna voice layer.
 * Queue-aware for intentional sequences, while important game discoveries interrupt stale dialogue.
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
    secretFind1: 'Secret Find 1.mp3',
    secretFind2: 'Secret Find 2.mp3',
    secretFind3: 'Secret Find 3.mp3',
    nextLocation: 'Next Location.mp3',
    nextWander1: 'Next Wander 1.mp3',
    nextWander2: 'Next Wander 2.mp3',
    nextWander3: 'Next Wander 3.mp3',
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

  // Tiny voice transitions prevent a click/crackle when gameplay interrupts
  // Luna quickly. The timings are deliberately short so the response still
  // feels instant to a child.
  const VOICE_FADE_OUT_MS = 18;
  const VOICE_FADE_GAP_MS = 6;
  const VOICE_FADE_IN_MS = 22;
  let volumeFrame = 0;
  let transitionToken = 0;

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

  function cancelVoiceFade() {
    cancelAnimationFrame(volumeFrame);
    volumeFrame = 0;
  }

  function fadeVolume(target, duration = 0) {
    cancelAnimationFrame(volumeFrame);
    const startVolume = player.volume;
    const endVolume = Math.max(0, Math.min(1, target));

    if (!duration || Math.abs(startVolume - endVolume) < 0.001) {
      player.volume = endVolume;
      return Promise.resolve();
    }

    const startedAt = performance.now();

    return new Promise(resolve => {
      const step = now => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = progress * (2 - progress);
        player.volume = startVolume + (endVolume - startVolume) * eased;

        if (progress < 1) {
          volumeFrame = requestAnimationFrame(step);
        } else {
          volumeFrame = 0;
          player.volume = endVolume;
          resolve();
        }
      };

      volumeFrame = requestAnimationFrame(step);
    });
  }

  async function start(name, volume = 0.92, { fadeIn = false } = {}) {
    cancelVoiceFade();
    const targetVolume = Math.max(0, Math.min(1, volume));
    if (!enabled || !prepare(name, fadeIn ? 0 : targetVolume)) return false;
    window.jltWoodlandMusic?.duckForLuna?.();

    try {
      await player.play();
      if (fadeIn) await fadeVolume(targetVolume, VOICE_FADE_IN_MS);
      return true;
    } catch (error) {
      currentName = null;
      window.jltWoodlandMusic?.restoreAfterLuna?.();
      emitError(name, error);
      queue = [];
      resolveIdle();
      return false;
    }
  }

  function stop() {
    ++transitionToken;
    cancelVoiceFade();
    queue = [];
    currentName = null;
    window.jltWoodlandMusic?.restoreAfterLuna?.();
    try {
      player.pause();
      player.currentTime = 0;
    } catch {}
    resolveIdle();
  }

  async function interruptAndStart(name, volume) {
    const token = ++transitionToken;
    const wasPlaying = !player.paused || Boolean(currentName);

    cancelVoiceFade();

    if (wasPlaying) {
      await fadeVolume(0, VOICE_FADE_OUT_MS);
    }

    if (token !== transitionToken || !enabled) return false;

    try { player.pause(); } catch {}

    // A few milliseconds of silence between the two voice clips removes the
    // hard edge that can produce a crack when players tap rapidly.
    if (VOICE_FADE_GAP_MS) {
      await new Promise(resolve => setTimeout(resolve, VOICE_FADE_GAP_MS));
    }

    if (token !== transitionToken || !enabled) return false;
    return start(name, volume, { fadeIn: true });
  }

  function play(name, { interrupt = true, volume = 0.92 } = {}) {
    if (!enabled || !slots[name]) return Promise.resolve(false);

    if (!interrupt && (!player.paused || currentName)) {
      queue.push({ name, volume });
      return Promise.resolve(true);
    }

    queue = [];
    if (interrupt) {
      return interruptAndStart(name, volume);
    }
    return start(name, volume, { fadeIn: true });
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
      return interruptAndStart(valid[0], volume);
    }
    return start(valid[0], volume, { fadeIn: true });
  }

  player.addEventListener('ended', () => {
    currentName = null;
    const next = queue.shift();
    if (enabled && next) {
      start(next.name, next.volume);
    } else {
      window.jltWoodlandMusic?.restoreAfterLuna?.();
      resolveIdle();
    }
  });

  player.addEventListener('error', () => {
    ++transitionToken;
    cancelVoiceFade();
    const failedName = currentName;
    currentName = null;
    queue = [];
    window.jltWoodlandMusic?.restoreAfterLuna?.();
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
