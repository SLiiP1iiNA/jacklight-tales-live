(() => {
  const AUDIO_URL = 'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Luna/Little_Paws_on_Moss.mp3';
  const GAME_VOLUME = 0.045;

  const audio = document.getElementById('woodland-music');
  if (!audio) return;

  audio.src = AUDIO_URL;
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = GAME_VOLUME;

  let enabled = true;

  async function start() {
    if (!enabled || !audio.paused) return true;
    try {
      await audio.play();
      return true;
    } catch {
      return false;
    }
  }

  function stop() {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {}
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    if (!enabled) stop();
  }

  window.jltWoodlandGameMusic = {
    start,
    stop,
    setEnabled,
    isPlaying: () => enabled && !audio.paused,
    audio
  };

  // Try to begin as soon as the game page opens. Browsers that block
  // autoplay will start it from the game's first user interaction instead.
  start();

  document.addEventListener('pointerdown', () => {
    if (enabled && audio.paused) start();
  }, { once: true, capture: true });

  window.addEventListener('pagehide', stop);
})();
