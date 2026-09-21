(() => {
  // Woodland Search background music.
  // Two ambience tracks play in a fixed order, then repeat:
  // 1) Dew on the Clover
  // 2) Where Wildflowers Bloom
  const DESKTOP_TRACKS = [
    'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Luna/WDew_on_the_Clover.mp3',
    'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Luna/Where_Wildflowers_Bloom.mp3'
  ];

  // These are the separately encoded -12 dB copies, used only on mobile.
  const MOBILE_TRACKS = [
    'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Luna/WDew_on_the_Clover_-12dB.mp3',
    'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Luna/Where_Wildflowers_Bloom_-12dB.mp3'
  ];

  // Desktop stays at the level that was already working correctly.
  // Mobile is deliberately much lower; the browser's normal media-element
  // volume control is used directly so there is no Web Audio/CORS path that
  // can silence the desktop player.
  const DESKTOP_VOLUME = 0.006;
  const MOBILE_VOLUME = 0.000003;

  const audio = document.getElementById('woodland-music');
  if (!audio) return;

  const mobileQuery = window.matchMedia('(max-width: 900px), (pointer: coarse)');

  function getTracks() {
    return mobileQuery.matches ? MOBILE_TRACKS : DESKTOP_TRACKS;
  }

  function getGameVolume() {
    return mobileQuery.matches ? MOBILE_VOLUME : DESKTOP_VOLUME;
  }

  audio.loop = false;
  audio.preload = 'none';
  audio.playsInline = true;
  audio.volume = getGameVolume();

  let enabled = true;
  let trackIndex = 0;

  function applyVolume() {
    audio.volume = getGameVolume();
  }

  function loadCurrentTrack() {
    const tracks = getTracks();
    const src = tracks[trackIndex];
    if (audio.src !== src) {
      audio.src = src;
      audio.load();
    }
    applyVolume();
  }

  async function start() {
    if (!enabled) return false;

    loadCurrentTrack();
    if (!audio.paused) return true;

    try {
      await audio.play();
      applyVolume();
      return true;
    } catch {
      return false;
    }
  }

  function playNextTrack() {
    if (!enabled) return;

    trackIndex = (trackIndex + 1) % getTracks().length;
    loadCurrentTrack();

    void audio.play().then(() => {
      applyVolume();
    }).catch(() => {});
  }

  function stop() {
    audio.pause();
    try { audio.currentTime = 0; } catch {}
    trackIndex = 0;
    audio.src = getTracks()[0];
    applyVolume();
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    if (!enabled) stop();
    else applyVolume();
  }

  function duckForLuna() {
    if (enabled && !audio.paused) applyVolume();
  }

  function restoreAfterLuna() {
    if (enabled) applyVolume();
  }

  audio.addEventListener('ended', playNextTrack);
  window.addEventListener('pagehide', stop);

  const handleViewportChange = () => {
    // Keep the currently selected track aligned with the correct desktop/mobile
    // audio file set when the viewport changes.
    loadCurrentTrack();
    applyVolume();
  };
  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener('change', handleViewportChange);
  } else if (typeof mobileQuery.addListener === 'function') {
    mobileQuery.addListener(handleViewportChange);
  }

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
