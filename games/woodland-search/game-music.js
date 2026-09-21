(() => {
  // Quiet ambience track for Woodland Search.
  const AUDIO_URL = 'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Luna/Little_Paws_on_Moss.mp3';

  // Keep the game music subtle, then duck it further while Luna speaks.
  const GAME_VOLUME = 0.045;
  const LUNA_DUCK_VOLUME = 0.008;
  const DUCK_FADE_MS = 220;

  const audio = document.getElementById('woodland-music');
  if (!audio) return;

  audio.src = AUDIO_URL;
  audio.loop = true;
  audio.preload = 'none';
  audio.playsInline = true;
  audio.volume = GAME_VOLUME;

  let enabled = true;
  let ducked = false;
  let fadeFrame = 0;

  function fadeTo(target) {
    cancelAnimationFrame(fadeFrame);

    const startVolume = audio.volume;
    const clampedTarget = Math.max(0, Math.min(1, target));
    const startedAt = performance.now();

    if (Math.abs(startVolume - clampedTarget) < 0.001) {
      audio.volume = clampedTarget;
      return;
    }

    const step = now => {
      const progress = Math.min(1, (now - startedAt) / DUCK_FADE_MS);
      const eased = progress * (2 - progress);
      audio.volume = startVolume + (clampedTarget - startVolume) * eased;

      if (progress < 1) {
        fadeFrame = requestAnimationFrame(step);
      } else {
        audio.volume = clampedTarget;
      }
    };

    fadeFrame = requestAnimationFrame(step);
  }

  async function start() {
    if (!enabled) return false;
    if (!audio.src) audio.src = AUDIO_URL;
    if (!audio.paused) return true;

    try {
      await audio.play();
      if (!ducked) audio.volume = GAME_VOLUME;
      return true;
    } catch {
      return false;
    }
  }

  function stop() {
    cancelAnimationFrame(fadeFrame);
    ducked = false;
    audio.pause();
    try { audio.currentTime = 0; } catch {}
    audio.volume = GAME_VOLUME;
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    if (!enabled) stop();
    else if (!ducked) audio.volume = GAME_VOLUME;
  }

  function duckForLuna() {
    if (!enabled) return;
    ducked = true;
    fadeTo(LUNA_DUCK_VOLUME);
  }

  function restoreAfterLuna() {
    if (!enabled) return;
    ducked = false;
    if (!audio.paused) fadeTo(GAME_VOLUME);
    else audio.volume = GAME_VOLUME;
  }

  window.addEventListener('pagehide', stop);

  // Keep both names available so the voice layer can control the background
  // music without depending on which public API alias it uses.
  window.jltWoodlandMusic = {
    start,
    stop,
    setEnabled,
    duckForLuna,
    restoreAfterLuna,
    isPlaying: () => enabled && !audio.paused,
    audio
  };

  window.jltWoodlandGameMusic = window.jltWoodlandMusic;
})();
