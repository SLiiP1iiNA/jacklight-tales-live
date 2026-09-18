/*
 * Woodland Search — Luna voice layer.
 *
 * The ten Luna narration clips live in Cloudflare R2. This module uses one
 * persistent HTMLAudioElement so iPhone/Safari only needs the player's first
 * tap to unlock narration. Important cues interrupt politely; queued intro
 * narration stays on the same media element.
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

  let enabled = true;
  let currentName = null;
  let queued = [];
  let queuedVolume = 0.9;

  const player = new Audio();
  player.preload = 'auto';
  player.setAttribute('playsinline', '');
  player.setAttribute('webkit-playsinline', '');

  function resetPlayer() {
    try {
      player.pause();
      player.currentTime = 0;
    } catch {}
    currentName = null;
  }

  function stop() {
    queued = [];
    resetPlayer();
  }

  function start(name, volume = 0.9) {
    if (!enabled) return null;
    const src = slots[name];
    if (!src) return null;

    currentName = name;
    player.volume = Math.max(0, Math.min(1, volume));

    if (player.src !== src) {
      player.src = src;
      player.load();
    } else {
      try { player.currentTime = 0; } catch {}
    }

    player.play().catch(error => {
      currentName = null;
      console.warn('Woodland Search audio could not play:', name, error);
    });
    return player;
  }

  function play(name, { interrupt = true, volume = 0.9 } = {}) {
    if (!enabled || !slots[name]) return null;

    if (!interrupt && currentName && !player.paused) return null;

    queued = [];
    if (interrupt) resetPlayer();
    return start(name, volume);
  }

  function playSequence(names, { volume = 0.9 } = {}) {
    const valid = names.filter(name => Boolean(slots[name]));
    if (!enabled || !valid.length) return null;

    queued = valid.slice(1);
    queuedVolume = volume;
    resetPlayer();
    return start(valid[0], volume);
  }

  player.addEventListener('ended', () => {
    currentName = null;
    if (!enabled || !queued.length) return;
    const next = queued.shift();
    start(next, queuedVolume);
  });

  player.addEventListener('error', () => {
    currentName = null;
    queued = [];
  });

  function setEnabled(value) {
    enabled = Boolean(value);
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
    slots: { ...slots }
  };
})();