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

  const slots = {
    welcome: `${base}01_welcome.mp3`,
    beginSearch: `${base}02_begin_search.mp3`,
    hintOne: `${base}03_hint_one.mp3`,
    hintTwo: `${base}04_hint_two.mp3`,
    friendFound: `${base}05_friend_found.mp3`,
    barnabyFound: `${base}06_barnaby_found.mp3`,
    heartSeed: `${base}07_heart_seed.mp3`,
    nextLocation: `${base}08_next_location.mp3`,
    allFound: `${base}09_all_found.mp3`,
    goodbye: `${base}10_goodbye.mp3`
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

    player.play().catch(() => {});
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