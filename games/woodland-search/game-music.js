(() => {
  // Woodland Search background music.
  // Desktop keeps the original tracks and working player level.
  // Mobile uses the separately encoded -20 dB copies.
  const DESKTOP_TRACKS = [
    'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Luna/WDew_on_the_Clover.mp3',
    'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Luna/Where_Wildflowers_Bloom.mp3'
  ];

  const MOBILE_TRACKS = [
    'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Luna/WDew_on_the_Clover_-20dB.mp3',
    'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Luna/Where_Wildflowers_Bloom_-20dB.mp3'
  ];

  const DESKTOP_VOLUME = 0.006;

  const audio = document.getElementById('woodland-music');
  if (!audio) return;

  const mobile = window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
  const tracks = mobile ? MOBILE_TRACKS : DESKTOP_TRACKS;

  audio.loop = false;
  audio.preload = 'none';
  audio.playsInline = true;
  audio.volume = mobile ? 1 : DESKTOP_VOLUME;

  let enabled = true;
  let trackIndex = 0;

  function loadTrack() {
    const src = tracks[trackIndex];
    if (audio.src !== src) {
      audio.src = src;
      audio.load();
    }
  }

  async function start() {
    if (!enabled) return false;

    loadTrack();

    if (!audio.paused) return true;

    try {
      await audio.play();
      return true;
    } catch {
      return false;
    }
  }

  function playNextTrack() {
    if (!enabled) return;

    trackIndex = (trackIndex + 1) % tracks.length;
    loadTrack();

    void audio.play().catch(() => {});
  }

  function stop() {
    audio.pause();
    try { audio.currentTime = 0; } catch {}
    trackIndex = 0;
    loadTrack();
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    if (!enabled) stop();
  }

  audio.addEventListener('ended', playNextTrack);
  window.addEventListener('pagehide', stop);

  window.jltWoodlandGameMusic = {
    start,
    stop,
    setEnabled,
    isPlaying: () => enabled && !audio.paused,
    audio
  };
})();
