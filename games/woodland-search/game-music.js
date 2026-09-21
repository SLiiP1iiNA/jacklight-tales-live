(() => {
  const AUDIO_URL = 'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Luna/Little_Paws_on_Moss.mp3';
  const GAME_VOLUME = 0.045;
  const audio = document.getElementById('woodland-music');
  if (!audio) return;

  audio.src = AUDIO_URL;
  audio.loop = true;
  audio.preload = 'none';
  audio.volume = GAME_VOLUME;

  let enabled = true;

  async function start() {
    if (!enabled) return false;
    if (!audio.paused) return true;
    try {
      await audio.play();
      return true;
    } catch {
      return false;
    }
  }

  function stop() {
    audio.pause();
    try { audio.currentTime = 0; } catch {}
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    if (!enabled) stop();
  }

  window.addEventListener('pagehide', stop);\n\n  window.jltWoodlandGameMusic = {
    start,
    stop,
    setEnabled,
    isPlaying: () => enabled && !audio.paused,
    audio
  };
})();
