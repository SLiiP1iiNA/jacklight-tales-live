export function initSoundControl(audioPath, mobileAudioPath = "") {
  const button = document.querySelector("#sound-control");
  const audio = document.querySelector("#woodland-audio");
  if (!button || !audio) return;

  const source = audio.querySelector("source");
  const label = button.querySelector("[data-sound-label]");
  const NORMAL_VOLUME = 0.05;
  const LISTEN_VOLUME = 0.015;
  const FADE_IN_MS = 1800;
  const FADE_OUT_MS = 1200;
  const GAME_STATE_KEY = "jacklight:woodland-audio-state";
  const isMobile = () => window.matchMedia("(max-width: 900px), (pointer: coarse)").matches;

  let listenOpen = false;
  let cinemaOpen = false;
  let audiobookPlaying = false;
  let resumeTimer = null;
  let siteAudioStarted = false;
  let fadeFrame = null;
  let finishFade = null;
  let restoredFromGame = false;
  let soundEnabled = true;
  let audioRequestVersion = 0;

  if (!audioPath) {
    button.hidden = true;
    button.disabled = true;
    return;
  }

  button.hidden = false;
  button.disabled = false;
  source.src = isMobile() && mobileAudioPath ? mobileAudioPath : audioPath;
  audio.volume = 0;
  audio.loop = true;
  audio.load();

  function clearResumeTimer() {
    if (resumeTimer) {
      window.clearTimeout(resumeTimer);
      resumeTimer = null;
    }
  }

  function setButtonState(isOn) {
    button.setAttribute("aria-pressed", String(isOn));
    button.setAttribute("aria-label", isOn ? "Turn woodland sound off" : "Turn woodland sound on");
    label.textContent = isOn ? "Sound on" : "Sound off";
  }

  function cancelFade() {
    if (fadeFrame) {
      window.cancelAnimationFrame(fadeFrame);
      fadeFrame = null;
    }
    finishFade?.(false);
    finishFade = null;
  }

  function fadeTo(target, duration = FADE_IN_MS) {
    cancelFade();
    const from = audio.volume;
    const to = Math.max(0, Math.min(1, target));
    if (Math.abs(from - to) < 0.001 || duration <= 0) {
      audio.volume = to;
      return Promise.resolve(true);
    }

    return new Promise(resolve => {
      finishFade = resolve;
      const start = performance.now();
      const step = now => {
        const progress = Math.max(0, Math.min(1, (now - start) / duration));
        const eased = progress * (2 - progress);
        audio.volume = from + ((to - from) * eased);
        if (progress < 1) {
          fadeFrame = window.requestAnimationFrame(step);
        } else {
          fadeFrame = null;
          finishFade = null;
          audio.volume = to;
          resolve(true);
        }
      };
      fadeFrame = window.requestAnimationFrame(step);
    });
  }

  async function startWoodlandSound(target = NORMAL_VOLUME, duration = FADE_IN_MS) {
    if (!soundEnabled || cinemaOpen || audiobookPlaying) return;
    const request = ++audioRequestVersion;
    if (!audio.paused) {
      siteAudioStarted = true;
      setButtonState(true);
      await fadeTo(target, duration);
      return;
    }

    clearResumeTimer();

    try {
      await audio.play();
      if (request !== audioRequestVersion || !soundEnabled || cinemaOpen || audiobookPlaying) return;
      siteAudioStarted = true;
      setButtonState(true);
      await fadeTo(target, duration);
    } catch {
      if (request === audioRequestVersion) setButtonState(false);
    }
  }

  function stopWoodlandSound({ reset = false } = {}) {
    audioRequestVersion += 1;
    clearResumeTimer();
    cancelFade();
    audio.pause();
    audio.volume = 0;
    if (reset) audio.currentTime = 0;
    setButtonState(false);
  }

  function transitionOutForMobileNavigation(duration = 520) {
    if (!isMobile()) {
      return Promise.resolve();
    }

    clearResumeTimer();
    cancelFade();
    const request = ++audioRequestVersion;

    if (audio.paused) {
      audio.volume = 0;
      setButtonState(false);
      return Promise.resolve();
    }

    return fadeTo(0, duration).then((completed) => {
      if (!completed || request !== audioRequestVersion) return;
      audio.pause();
      audio.volume = 0;
      setButtonState(false);
    });
  }

  window.jltMobileSiteAudioTransition = transitionOutForMobileNavigation;

  function restoreFromGame() {
    try {
      const raw = sessionStorage.getItem(GAME_STATE_KEY);
      if (!raw) return;
      sessionStorage.removeItem(GAME_STATE_KEY);
      const state = JSON.parse(raw);
      if (!state.enabled) return;
      if (Number.isFinite(state.currentTime)) audio.currentTime = state.currentTime;
      restoredFromGame = true;
    } catch {}
  }

  restoreFromGame();

  if (restoredFromGame) {
    window.setTimeout(async () => {
      await startWoodlandSound(NORMAL_VOLUME, 2200);
      if (siteAudioStarted) {
        restoredFromGame = false;
      }
    }, 0);
  }

  document.addEventListener("jacklight:entrance-entered", () => {
    startWoodlandSound(NORMAL_VOLUME, restoredFromGame ? 2200 : FADE_IN_MS);
    restoredFromGame = false;
  });

  document.addEventListener("pointerdown", (event) => {
    if (event.target.closest("#sound-control")) return;
    if (!siteAudioStarted && !audiobookPlaying) {
      startWoodlandSound(NORMAL_VOLUME, restoredFromGame ? 2200 : FADE_IN_MS);
      restoredFromGame = false;
    }
  }, { once: true, capture: true });

  document.addEventListener("jacklight:panel-opening", event => {
    cinemaOpen = event.detail.panelName === "watch";
    listenOpen = event.detail.panelName === "listen";
    audiobookPlaying = false;
    clearResumeTimer();
    if (cinemaOpen) {
      if (isMobile()) {
        void transitionOutForMobileNavigation();
      } else {
        stopWoodlandSound();
      }
      return;
    }

    if (!listenOpen) {
      startWoodlandSound(NORMAL_VOLUME, FADE_IN_MS);
    } else if (isMobile()) {
      void transitionOutForMobileNavigation();
    } else {
      startWoodlandSound(LISTEN_VOLUME, FADE_OUT_MS);
    }
  });

  document.addEventListener("jacklight:panel-opened", event => {
    if (event.detail.panelName !== "listen") return;

    const storyAudio = event.detail.content.querySelector("[data-audio-element]");
    if (!storyAudio) return;

    storyAudio.addEventListener("play", () => {
      if (!listenOpen || !storyAudio.isConnected) return;
      audiobookPlaying = true;
      clearResumeTimer();
      const request = ++audioRequestVersion;
      fadeTo(0, FADE_OUT_MS).then((completed) => {
        if (!completed || request !== audioRequestVersion) return;
        audio.pause();
        setButtonState(false);
      });
    });

    storyAudio.addEventListener("pause", () => {
      if (!listenOpen || !storyAudio.isConnected) return;
      audiobookPlaying = true;
      clearResumeTimer();
      const request = ++audioRequestVersion;
      fadeTo(0, FADE_OUT_MS).then((completed) => {
        if (!completed || request !== audioRequestVersion) return;
        audio.pause();
        setButtonState(false);
      });
    });

    storyAudio.addEventListener("ended", () => {
      if (!listenOpen || !storyAudio.isConnected) return;
      audiobookPlaying = false;
      clearResumeTimer();
      resumeTimer = window.setTimeout(() => {
        if (listenOpen) startWoodlandSound(LISTEN_VOLUME, FADE_IN_MS);
      }, 5000);
    });
  });

  document.addEventListener("jacklight:panel-closed", () => {
    cinemaOpen = false;
    listenOpen = false;
    audiobookPlaying = false;
    clearResumeTimer();
    startWoodlandSound(NORMAL_VOLUME, FADE_IN_MS);
  });

  button.addEventListener("click", async () => {
    if (audiobookPlaying) return;

    if (audio.paused) {
      soundEnabled = true;
      await startWoodlandSound(listenOpen ? LISTEN_VOLUME : NORMAL_VOLUME, FADE_IN_MS);
    } else {
      soundEnabled = false;
      const request = ++audioRequestVersion;
      const completed = await fadeTo(0, FADE_OUT_MS);
      if (!completed || request !== audioRequestVersion) return;
      audio.pause();
      setButtonState(false);
    }
  });
}
