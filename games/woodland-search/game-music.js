(() => {
  // Halloween Woodland Search background music.
  // Desktop files are already reduced by 44.44 dB; mobile files by 26 dB.
  // Use an additional quiet playback level; the original files stay intact.
  const DESKTOP_TRACKS = [
    'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Halloween/music/Pumpkin_Patch_Promenade_Desktop_-44.44dB.mp3',
    'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Halloween/music/Lanterns_on_the_Cobblestone_Desktop_-44.44dB.mp3'
  ];

  const MOBILE_TRACKS = [
    'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Halloween/music/Pumpkin_Patch_Promenade_Mobile_-26dB.mp3',
    'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Game%20Audio/Woodland%20Search/Halloween/music/Lanterns_on_the_Cobblestone_Mobile_-26dB.mp3'
  ];

  const audio = document.getElementById('woodland-music');
  if (!audio) return;

  // A narrow desktop window still needs the quieter desktop recordings.
  // Choose once by input device so rotation cannot change the music level.
  const mobile = window.matchMedia('(pointer: coarse)').matches;
  const tracks = mobile ? MOBILE_TRACKS : DESKTOP_TRACKS;

  audio.loop = false;
  audio.preload = 'none';
  audio.playsInline = true;
  audio.volume = mobile ? 0.25 : 0.65;

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
