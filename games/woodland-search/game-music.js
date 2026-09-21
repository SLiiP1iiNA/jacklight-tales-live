(() => {
  // Woodland Search background music.
  // Two quiet ambience tracks play in a fixed order, then repeat:
  // 1) Dew on the Clover
  // 2) Where Wildflowers Bloom
  const TRACKS = [
    'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Luna/WDew_on_the_Clover.mp3',
    'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Luna/Where_Wildflowers_Bloom.mp3'
  ];

  // Keep the background music very quiet so Luna's voice and game sounds
  // remain clearly in the foreground.
  const GAME_VOLUME = 0.006;

  const audio = document.getElementById('woodland-music');
  if (!audio) return;

  audio.loop = false;
  audio.preload = 'none';
  audio.playsInline = true;
  audio.volume = GAME_VOLUME;

  let enabled = true;
  let trackIndex = 0;

  function loadCurrentTrack() {
    const src = TRACKS[trackIndex];
    if (audio.src !== src) {
      audio.src = src;
      audio.load();
    }
    audio.volume = GAME_VOLUME;
  }

  async function start() {
    if (!enabled) return false;

    loadCurrentTrack();
    if (!audio.paused) return true;

    try {
      await audio.play();
      audio.volume = GAME_VOLUME;
      return true;
    } catch {
      return false;
    }
  }

  function playNextTrack() {
    if (!enabled) return;

    trackIndex = (trackIndex + 1) % TRACKS.length;
    loadCurrentTrack();

    void audio.play().then(() => {
      audio.volume = GAME_VOLUME;
    }).catch(() => {});
  }

  function stop() {
    audio.pause();
    try { audio.currentTime = 0; } catch {}
    trackIndex = 0;
    audio.src = TRACKS[0];
    audio.volume = GAME_VOLUME;
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    if (!enabled) stop();
    else audio.volume = GAME_VOLUME;
  }

  // Compatibility hooks for the Luna layer. The background stays at one
  // constant quiet level while Luna speaks over it.
  function duckForLuna() {
    if (enabled && !audio.paused) audio.volume = GAME_VOLUME;
  }

  function restoreAfterLuna() {
    if (enabled) audio.volume = GAME_VOLUME;
  }

  audio.addEventListener('ended', playNextTrack);
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
