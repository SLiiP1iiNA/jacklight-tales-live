/*
 * Woodland Search — Luna voice layer.
 * Queue-aware for intentional sequences. Important discoveries interrupt stale
 * dialogue, using two audio players so a new line never changes source on the
 * player that is currently producing the outgoing waveform.
 */
(() => {
  const base = 'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Halloween/luna/';
  const files = {
    welcome: 'welcome.mp3',
    beginSearch: 'begin-search.mp3',
    hintOne: 'hint-one.mp3',
    hintTwo: 'hint-two.mp3',
    friendFound: 'friend-found-01.mp3',
    friendFound2: 'friend-found-02.mp3',
    friendFound3: 'friend-found-03.mp3',
    friendFound4: 'friend-found-04.mp3',
    friendFound5: 'friend-found-05.mp3',
    barnabyFound: 'barnaby-found.mp3',
    heartSeed: 'heart-seed-found.mp3',
    secretFind1: 'secret-found-01.mp3',
    secretFind2: 'secret-found-02.mp3',
    secretFind3: 'secret-found-03.mp3',
    nextLocation: 'next-location.mp3',
    nextWander1: 'next-wander-01.mp3',
    nextWander2: 'next-wander-02.mp3',
    nextWander3: 'next-wander-03.mp3',
    allFound: 'everything-found.mp3',
    goodbye: 'goodbye.mp3',
    costumeRoom: 'scene-01-costume-room.mp3',
    pumpkinPatch: 'scene-02-pumpkin-patch.mp3',
    bakeryBridge: 'scene-03-bakery-bridge.mp3',
    harvestGames: 'scene-04-harvest-games-green.mp3',
    lanternLane: 'scene-05-lantern-lane.mp3',
    clockTowerSquare: 'scene-06-clock-tower-square.mp3'
  };

  const slots = Object.fromEntries(
    Object.entries(files).map(([key, name]) => [key, base + encodeURIComponent(name)])
  );

  const firstPlayer = document.getElementById('luna-audio');
  if (!firstPlayer) {
    console.error('Woodland Search: #luna-audio was not found.');
    return;
  }

  // Two independent players are the important part of this fix. The outgoing
  // clip can finish fading to zero without its element being forced to load a
  // completely different file underneath it.
  const secondPlayer = document.createElement('audio');
  secondPlayer.id = 'luna-audio-2';
  secondPlayer.preload = 'auto';
  secondPlayer.playsInline = true;
  secondPlayer.setAttribute('aria-hidden', 'true');
  firstPlayer.insertAdjacentElement('afterend', secondPlayer);

  const players = [firstPlayer, secondPlayer];
  players.forEach(player => {
    player.preload = 'auto';
    player.playsInline = true;
  });

  let enabled = true;
  let queue = [];
  let currentName = null;
  let activePlayer = firstPlayer;
  let transitioning = false;
  let idleWaiters = [];
  let transitionToken = 0;
  let lastRequestName = null;
  let lastRequestAt = 0;

  const FADE_OUT_MS = 180;
  const MOBILE_VOICE_GAIN = 0.64;
  const DUPLICATE_REQUEST_GUARD_MS = 260;
  const GAP_MS = 20;
  const FADE_IN_MS = 120;
  const fadeFrames = new WeakMap();
  const fadeCancels = new WeakMap();
  const playbackTokens = new WeakMap();

  function emitError(name, error) {
    console.warn('Woodland Search Luna audio failed:', name, error);
    window.dispatchEvent(new CustomEvent('woodland-audio-error', {
      detail: {
        name,
        src: activePlayer?.currentSrc || activePlayer?.src || '',
        message: String(error?.message || error || 'Audio could not play')
      }
    }));
  }

  function anyPlayerPlaying() {
    return players.some(player => !player.paused && !player.ended);
  }

  function resolveIdle() {
    if (enabled && (transitioning || currentName || anyPlayerPlaying() || queue.length)) return;
    const waiters = idleWaiters;
    idleWaiters = [];
    waiters.forEach(resolve => resolve());
  }

  function waitForIdle() {
    if (!enabled || (!transitioning && !currentName && !anyPlayerPlaying() && !queue.length)) {
      return Promise.resolve();
    }
    return new Promise(resolve => idleWaiters.push(resolve));
  }

  function stopPlayer(player) {
    const cancel = fadeCancels.get(player);
    cancel?.();
    try { player.pause(); } catch {}
    try { player.currentTime = 0; } catch {}
    player.volume = 0;
  }

  function prepare(player, name) {
    const src = slots[name];
    if (!src) return false;

    const cancel = fadeCancels.get(player);
    cancel?.();

    player.volume = 0;
    player.src = src;
    player.load();
    return true;
  }

  function fadePlayer(player, target, duration) {
    const previousCancel = fadeCancels.get(player);
    previousCancel?.();

    const startVolume = player.volume;
    const endVolume = Math.max(0, Math.min(1, target));

    if (!duration || Math.abs(startVolume - endVolume) < 0.001) {
      player.volume = endVolume;
      return Promise.resolve();
    }

    return new Promise(resolve => {
      let settled = false;
      const startedAt = performance.now();

      const finish = () => {
        if (settled) return;
        settled = true;

        const frame = fadeFrames.get(player);
        if (frame) cancelAnimationFrame(frame);
        fadeFrames.delete(player);
        fadeCancels.delete(player);

        // Only force the final value when the fade genuinely completed or
        // another transition explicitly canceled it.
        if (player.volume !== endVolume && !cancelled) {
          player.volume = endVolume;
        }
        resolve();
      };

      let cancelled = false;

      const cancel = () => {
        if (settled) return;
        cancelled = true;
        const frame = fadeFrames.get(player);
        if (frame) cancelAnimationFrame(frame);
        fadeFrames.delete(player);
        fadeCancels.delete(player);
        settled = true;
        resolve();
      };

      fadeCancels.set(player, cancel);

      const step = now => {
        if (settled) return;

        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = progress * progress * (3 - 2 * progress);
        player.volume = startVolume + (endVolume - startVolume) * eased;

        if (progress < 1) {
          const frame = requestAnimationFrame(step);
          fadeFrames.set(player, frame);
        } else {
          finish();
        }
      };

      const frame = requestAnimationFrame(step);
      fadeFrames.set(player, frame);
    });
  }

  async function fadeAllToSilence() {
    await Promise.all(players.map(player => {
      if (player.paused || player.volume <= 0.001) {
        player.volume = 0;
        return Promise.resolve();
      }
      return fadePlayer(player, 0, FADE_OUT_MS);
    }));
  }

  async function startOnPlayer(player, name, volume, token) {
    if (token !== transitionToken || !enabled || !prepare(player, name)) return false;
    playbackTokens.set(player, token);

    try {
      await player.play();
    } catch (error) {
      if (token === transitionToken) {
        emitError(name, error);
      }
      if (playbackTokens.get(player) === token) stopPlayer(player);
      return false;
    }

    if (token !== transitionToken || !enabled) {
      if (playbackTokens.get(player) === token) stopPlayer(player);
      return false;
    }

    await fadePlayer(player, volume, FADE_IN_MS);

    if (token !== transitionToken || !enabled) {
      if (playbackTokens.get(player) === token) stopPlayer(player);
      return false;
    }

    return true;
  }

  async function interruptAndStart(name, volume) {
    const token = ++transitionToken;
    transitioning = true;
    currentName = null;

    // The incoming transition owns both players while it fades them out.
    // Canceling an older fade-in wakes its pending start promise; that stale
    // promise must not pause/reset a player underneath this fade-out.
    players.forEach(player => playbackTokens.set(player, token));

    // Kill any old queue immediately. Both players are faded to silence before
    // either one is allowed to load or speak a different clip.
    await fadeAllToSilence();

    if (token !== transitionToken || !enabled) {
      if (token === transitionToken) {
        transitioning = false;
        resolveIdle();
      }
      return false;
    }

    players.forEach(stopPlayer);

    if (GAP_MS) {
      await new Promise(resolve => setTimeout(resolve, GAP_MS));
    }

    if (token !== transitionToken || !enabled) {
      if (token === transitionToken) {
        transitioning = false;
        resolveIdle();
      }
      return false;
    }

    const nextPlayer = activePlayer === players[0] ? players[1] : players[0];
    currentName = name;
    activePlayer = nextPlayer;

    const started = await startOnPlayer(nextPlayer, name, volume, token);

    if (token === transitionToken) {
      transitioning = false;
      if (!started) {
        currentName = null;
        queue = [];
      }
      resolveIdle();
    }

    return started;
  }

  async function startNatural(name, volume = 0.92) {
    const token = ++transitionToken;
    transitioning = true;
    currentName = name;

    const player = activePlayer.paused ? activePlayer : (activePlayer === players[0] ? players[1] : players[0]);
    activePlayer = player;

    const started = await startOnPlayer(player, name, volume, token);

    if (token === transitionToken) {
      transitioning = false;
      if (!started) {
        currentName = null;
        queue = [];
      }
      resolveIdle();
    }

    return started;
  }

  async function startQueued(name, volume) {
    const token = ++transitionToken;
    transitioning = true;
    currentName = name;

    const nextPlayer = activePlayer === players[0] ? players[1] : players[0];
    activePlayer = nextPlayer;

    const started = await startOnPlayer(nextPlayer, name, volume, token);

    if (token === transitionToken) {
      transitioning = false;
      if (!started) {
        currentName = null;
        queue = [];
      }
      resolveIdle();
    }

    return started;
  }

  function play(name, { interrupt = true, volume = 0.92 } = {}) {
    if (!enabled || !slots[name]) return Promise.resolve(false);

    // Ignore an accidental duplicate request arriving from a mobile tap/click
    // pair. Legitimate repeats still work once this tiny window has passed.
    const now = performance.now();
    if (name === lastRequestName && (now - lastRequestAt) < DUPLICATE_REQUEST_GUARD_MS) {
      return Promise.resolve(true);
    }
    lastRequestName = name;
    lastRequestAt = now;

    const mobilePhone = document.documentElement.classList.contains('phone-landscape-mode') ||
      window.matchMedia?.('(max-width: 760px)').matches;
    const effectiveVolume = mobilePhone ? volume * MOBILE_VOICE_GAIN : volume;

    if (!interrupt && (transitioning || currentName || anyPlayerPlaying())) {
      queue.push({ name, volume: effectiveVolume });
      return Promise.resolve(true);
    }

    queue = [];

    if (interrupt) {
      return interruptAndStart(name, effectiveVolume);
    }

    return startNatural(name, effectiveVolume);
  }

  function playSequence(names, { volume = 0.92, interrupt = true } = {}) {
    const valid = names.filter(name => slots[name]);
    if (!enabled || !valid.length) return Promise.resolve(false);

    const mobilePhone = document.documentElement.classList.contains('phone-landscape-mode') ||
      window.matchMedia?.('(max-width: 760px)').matches;
    const effectiveVolume = mobilePhone ? volume * MOBILE_VOICE_GAIN : volume;

    if (!interrupt && (transitioning || currentName || anyPlayerPlaying())) {
      valid.forEach(name => queue.push({ name, volume: effectiveVolume }));
      return Promise.resolve(true);
    }

    if (!interrupt) {
      queue = valid.slice(1).map(name => ({ name, volume: effectiveVolume }));
      return startNatural(valid[0], effectiveVolume);
    }

    queue = valid.slice(1).map(name => ({ name, volume: effectiveVolume }));
    return interruptAndStart(valid[0], effectiveVolume);
  }

  function handleEnded(player) {
    // Ignore stale players that were silenced during a rapid transition.
    if (player !== activePlayer || !currentName) return;

    currentName = null;
    const next = queue.shift();

    if (enabled && next) {
      void startQueued(next.name, next.volume);
    } else {
      player.volume = 0;
      resolveIdle();
    }
  }

  players.forEach(player => {
    player.addEventListener('ended', () => handleEnded(player));
    player.addEventListener('error', () => {
      if (player !== activePlayer && player.paused) return;

      const failedName = currentName;
      player.volume = 0;

      if (player === activePlayer) {
        currentName = null;
        queue = [];
      }

      emitError(failedName, player.error || new Error('Media file could not load'));
      resolveIdle();
    });
  });

  function stop() {
    ++transitionToken;
    transitioning = false;
    queue = [];
    currentName = null;
    lastRequestName = null;
    lastRequestAt = 0;
    players.forEach(stopPlayer);
    resolveIdle();
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    players.forEach(player => {
      player.muted = !enabled;
    });

    if (!enabled) stop();
    else resolveIdle();
  }

  window.addEventListener('pagehide', stop);

  window.jltGameAudio = {
    play,
    playSequence,
    stop,
    setEnabled,
    waitForIdle,
    isEnabled: () => enabled,
    isPlaying: () => enabled && (transitioning || anyPlayerPlaying()),
    current: () => currentName,
    player: firstPlayer,
    players: [...players],
    slots: { ...slots }
  };
})();
