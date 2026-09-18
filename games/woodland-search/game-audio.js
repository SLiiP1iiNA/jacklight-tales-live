/*
 * Woodland Search — Luna voice layer.
 *
 * Ten narration slots are wired into the game now. Add the Cloudflare MP3 URLs
 * to window.WOODLAND_LUNA_AUDIO before this file, or replace the empty strings
 * below when the final files are ready. Empty/missing URLs are ignored so the
 * game remains fully playable during layout testing.
 */
(() => {
  const slots = {
    welcome: '',
    pathIntro: '',
    encourage: '',
    hintGentle: '',
    hintStrong: '',
    specialFound: '',
    found: '',
    locationComplete: '',
    finale: '',
    goodbye: ''
  };

  Object.assign(slots, window.WOODLAND_LUNA_AUDIO || {});

  let enabled = true;
  let current = null;

  function stop() {
    if (!current) return;
    try {
      current.pause();
      current.currentTime = 0;
    } catch {}
    current = null;
  }

  function play(name, { interrupt = true, volume = 0.9 } = {}) {
    if (!enabled) return null;
    const src = slots[name];
    if (!src) return null;
    if (interrupt) stop();

    const audio = new Audio(src);
    current = audio;
    audio.preload = 'auto';
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.addEventListener('ended', () => {
      if (current === audio) current = null;
    }, { once: true });
    audio.addEventListener('error', () => {
      if (current === audio) current = null;
    }, { once: true });
    audio.play().catch(() => {});
    return audio;
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    if (!enabled) stop();
  }

  window.jltGameAudio = {
    play,
    stop,
    setEnabled,
    isEnabled: () => enabled,
    slots: { ...slots }
  };
})();