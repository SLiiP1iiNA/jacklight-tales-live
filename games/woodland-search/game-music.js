(() => {
  // Quiet ambience track for Woodland Search.
  const AUDIO_URL = 'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Luna/Little_Paws_on_Moss.mp3';

  // Keep the background music consistently very quiet.
  // Luna speaks over it at her normal voice volume; the music never ducks
  // or rises during dialogue.
  const GAME_VOLUME = 0.018;

  const audio = document.getElementById('woodland-music');
  if (!audio) return;

  audio.src = AUDIO_URL;
  audio.loop = true;
  audio.preload = 'none';
  audio.playsInline = true;
  audio.volume = GAME_VOLUME;

  let enabled = true;

  async function start() {
    if (!enabled) return false;
    if (!audio.src) audio.src = AUDIO_URL;
    if (!audio.paused) return true;

    try {
      await audio.play();
      audio.volume = GAME_VOLUME;
      return true;
    } catch {
      return false;
    }
  }

  function stop() {
    audio.pause();
    try { audio.currentTime = 0; } catch {}
    audio.volume = GAME_VOLUME;
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    if (!enabled) stop();
    else audio.volume = GAME_VOLUME;
  }

  // Kept as no-op compatibility hooks because the Luna layer already calls
  // these methods. The background stays at one fixed quiet level.
  function duckForLuna() {
    if (enabled && !audio.paused) audio.volume = GAME_VOLUME;
  }

  function restoreAfterLuna() {
    if (enabled) audio.volume = GAME_VOLUME;
  }

  window.addEventListener('pagehide', stop);

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
