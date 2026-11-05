/* Seasonal background music, with a fixed mix beneath Luna. */
(() => {
  const DESKTOP_TRACKS = window.WOODLAND_SEARCH_SEASON.music.desktop;
  const MOBILE_TRACKS = window.WOODLAND_SEARCH_SEASON.music.mobile;
  const audio = document.getElementById('woodland-music');
  if (!audio) return;

  const mobile = window.matchMedia('(pointer: coarse)').matches;
  const tracks = mobile ? MOBILE_TRACKS : DESKTOP_TRACKS;
  // Fixed listening mix; mobile is about 3 dB above its previous setting.
  const playbackGain = mobile ? 0.40 : 0.73;
  const fadeSeconds = 0.08;
  let enabled = true;
  let trackIndex = 0;
  let playbackToken = 0;
  let context = null;
  let source = null;
  let gain = null;

  // Set CORS mode before any source assignment. The already reduced files are
  // mixed by the GainNode; the media element itself stays at unity gain.
  audio.crossOrigin = 'anonymous';
  audio.loop = false;
  audio.preload = 'none';
  audio.playsInline = true;
  audio.volume = 1;

  function getGain() {
    return enabled ? playbackGain : 0;
  }

  function applyGain() {
    if (!gain || !context) return;
    const now = context.currentTime;
    const current = gain.gain.value;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(current, now);
    gain.gain.linearRampToValueAtTime(getGain(), now + fadeSeconds);
  }

  function ensureMixer() {
    if (gain) return true;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    // Each music element is attached once. Reuse this graph for both songs,
    // replay, mute and resume; closing it would prevent safe reuse of source.
    if (!context) context = new AudioContext();
    if (!source) source = context.createMediaElementSource(audio);
    gain = context.createGain();
    gain.gain.value = getGain();
    source.connect(gain);
    gain.connect(context.destination);
    return true;
  }

  function loadTrack() {
    const src = tracks[trackIndex];
    if (audio.src !== src) {
      audio.src = src;
      audio.load();
    }
  }

  async function start() {
    if (!enabled) return false;
    const token = ++playbackToken;
    try {
      if (!ensureMixer()) return false;
      loadTrack();
      applyGain();
      // Request both operations inside the initiating Play/Sound-on gesture.
      const resumed = context.state === 'running' ? Promise.resolve() : context.resume();
      const playing = audio.paused ? audio.play() : Promise.resolve();
      await Promise.all([resumed, playing]);
      return token === playbackToken && enabled;
    } catch {
      return false;
    }
  }

  function playNextTrack() {
    if (!enabled) return;
    trackIndex = (trackIndex + 1) % tracks.length;
    loadTrack();
    void start();
  }

  function stop() {
    ++playbackToken;
    audio.pause();
    try { audio.currentTime = 0; } catch {}
    trackIndex = 0;
    loadTrack();
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    applyGain();
    if (!enabled) stop();
  }

  audio.addEventListener('ended', playNextTrack);
  window.addEventListener('pagehide', stop);

  window.jltWoodlandGameMusic = {
    start,
    stop,
    setEnabled,
    getGain,
    isPlaying: () => enabled && !audio.paused,
    audio
  };
})();
