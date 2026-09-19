(() => {
  const AUDIO_URL = 'https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Website%20-%20Jingles/Morning_in_the_Clearing.mp3';
  const STATE_KEY = 'jacklight:woodland-audio-state';
  const GAME_VOLUME = 0.025;
  const FADE_MS = 1800;

  const audio = document.getElementById('woodland-music');
  if (!audio) return;

  audio.src = AUDIO_URL;
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0;

  let fadeFrame = null;

  function cancelFade() {
    if (fadeFrame) {
      cancelAnimationFrame(fadeFrame);
      fadeFrame = null;
    }
  }

  function fadeTo(target, duration = FADE_MS) {
    cancelFade();
    const from = audio.volume;
    const to = Math.max(0, Math.min(1, target));
    return new Promise(resolve => {
      if (Math.abs(from - to) < 0.001 || duration <= 0) {
        audio.volume = to;
        resolve();
        return;
      }
      const start = performance.now();
      const step = now => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = progress * (2 - progress);
        audio.volume = from + ((to - from) * eased);
        if (progress < 1) {
          fadeFrame = requestAnimationFrame(step);
        } else {
          fadeFrame = null;
          audio.volume = to;
          resolve();
        }
      };
      fadeFrame = requestAnimationFrame(step);
    });
  }

  async function startMusic() {
    try {
      await audio.play();
      await fadeTo(GAME_VOLUME);
    } catch {
      // Browser autoplay may be blocked. The first user interaction below retries it.
    }
  }

  function retryAfterGesture() {
    if (audio.paused) startMusic();
  }

  try {
    const raw = sessionStorage.getItem(STATE_KEY);
    if (raw) {
      const state = JSON.parse(raw);
      sessionStorage.removeItem(STATE_KEY);
      if (state.enabled && Number.isFinite(state.currentTime)) {
        audio.currentTime = state.currentTime;
      }
    }
  } catch {}

  startMusic();
  document.addEventListener('pointerdown', retryAfterGesture, { once: true, capture: true });

  window.addEventListener('pagehide', () => {
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify({
        enabled: !audio.paused,
        currentTime: audio.currentTime
      }));
    } catch {}
  });
})();
