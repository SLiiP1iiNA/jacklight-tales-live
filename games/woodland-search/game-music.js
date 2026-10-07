/* Halloween background music, with a bounded independent music level. */
(() => {
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

  const input = document.getElementById('music-volume');
  const output = document.getElementById('music-level');
  const mobile = window.matchMedia('(pointer: coarse)').matches;
  const tracks = mobile ? MOBILE_TRACKS : DESKTOP_TRACKS;
  const maximumGain = mobile ? 0.25 : 0.65;
  const preferenceKey = 'jlt-woodland-search-music-v1';
  const defaultLevel = 60;
  const fadeSeconds = 0.08;
  let enabled = true;
  let trackIndex = 0;
  let playbackToken = 0;
  let context = null;
  let source = null;
  let gain = null;

  function clampLevel(value) {
    if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') return defaultLevel;
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(Math.max(0, Math.min(100, number))) : defaultLevel;
  }

  function readLevel() {
    try { return clampLevel(localStorage.getItem(preferenceKey)); } catch { return defaultLevel; }
  }

  let level = readLevel();

  // Set CORS mode before any source assignment. The already reduced files are
  // capped by the GainNode; the media element itself stays at unity gain.
  audio.crossOrigin = 'anonymous';
  audio.loop = false;
  audio.preload = 'none';
  audio.playsInline = true;
  audio.volume = 1;

  function getGain() {
    return enabled ? maximumGain * level / 100 : 0;
  }

  function renderLevel() {
    if (input) {
      input.value = String(level);
      input.setAttribute('aria-valuetext', level === 0 ? 'Background music off' : level + '% background music');
    }
    if (output) output.textContent = level === 0 ? 'Off' : level + '%';
  }

  function applyGain() {
    if (!gain || !context) return;
    const now = context.currentTime;
    const current = gain.gain.value;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(current, now);
    gain.gain.linearRampToValueAtTime(getGain(), now + fadeSeconds);
  }

  function setLevel(value) {
    level = clampLevel(value);
    try { localStorage.setItem(preferenceKey, String(level)); } catch {}
    renderLevel();
    applyGain();
    return level;
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

  input?.addEventListener('input', () => setLevel(input.value));
  audio.addEventListener('ended', playNextTrack);
  window.addEventListener('pagehide', stop);
  renderLevel();

  window.jltWoodlandGameMusic = {
    start,
    stop,
    setEnabled,
    setLevel,
    getLevel: () => level,
    getGain,
    isPlaying: () => enabled && !audio.paused,
    audio
  };
})();
