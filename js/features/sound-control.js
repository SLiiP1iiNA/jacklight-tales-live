export function initSoundControl(audioPath, mobileAudioPath = "", tracks = []) {
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
  let ambienceWhenPaused = false;
  let activeStoryAudio = null;
  let resumeTimer = null;
  let siteAudioStarted = false;
  let playbackRequested = false;
  let fadeFrame = null;
  let finishFade = null;
  let restoredFromGame = false;
  let soundEnabled = true;
  let audioRequestVersion = 0;
  const playlist = tracks.filter(track => track?.desktop);
  if (!playlist.length && audioPath) playlist.push({ desktop: audioPath, mobile: mobileAudioPath });
  let trackIndex = 0;
  let pendingResumeTime = null;
  let trackNeedsLoad = false;
  const failedTracks = new Set();

  if (!playlist.length || !source) {
    button.hidden = true;
    button.disabled = true;
    return;
  }

  button.hidden = false;
  button.disabled = false;
  audio.volume = 0;
  audio.loop = playlist.length === 1;
  audio.setAttribute("data-sound-enabled", "true");
  selectTrack(0, false);

  function selectTrack(index, load = true) {
    cancelFade();
    trackIndex = index;
    const track = playlist[trackIndex];
    source.src = isMobile() && track.mobile ? track.mobile : track.desktop;
    audio.setAttribute("data-sound-track", String(trackIndex));
    audio.volume = 0;
    trackNeedsLoad = !load;
    if (load) audio.load();
  }

  function applyResumePosition() {
    if (pendingResumeTime === null) return;
    try {
      audio.currentTime = pendingResumeTime;
      pendingResumeTime = null;
    } catch {
      // Some mobile browsers can seek only after metadata has arrived.
    }
  }

  audio.addEventListener("loadedmetadata", applyResumePosition);
  audio.addEventListener("playing", () => failedTracks.delete(trackIndex));
  audio.addEventListener("ended", () => {
    if (audio.loop) return;
    audioRequestVersion += 1;
    pendingResumeTime = null;
    selectTrack((trackIndex + 1) % playlist.length);
    if (siteAudioStarted) void startWoodlandSound(listenOpen ? LISTEN_VOLUME : NORMAL_VOLUME);
  });
  function handleTrackError() {
    failedTracks.add(trackIndex);
    audioRequestVersion += 1;
    cancelFade();
    audio.pause();
    audio.volume = 0;
    setButtonState(false);
    if (!playbackRequested || !soundEnabled || cinemaOpen || audiobookPlaying || failedTracks.size >= playlist.length) return;
    let next = (trackIndex + 1) % playlist.length;
    while (failedTracks.has(next)) next = (next + 1) % playlist.length;
    pendingResumeTime = null;
    selectTrack(next);
    void startWoodlandSound(listenOpen ? LISTEN_VOLUME : NORMAL_VOLUME);
  }
  audio.addEventListener("error", handleTrackError);
  source.addEventListener("error", handleTrackError);

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
    playbackRequested = true;
    const request = ++audioRequestVersion;
    if (!audio.paused) {
      siteAudioStarted = true;
      setButtonState(true);
      await fadeTo(target, duration);
      return;
    }

    clearResumeTimer();

    try {
      if (trackNeedsLoad) {
        trackNeedsLoad = false;
        audio.load();
      }
      applyResumePosition();
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
      soundEnabled = Boolean(state.enabled);
      audio.setAttribute("data-sound-enabled", String(soundEnabled));
      if (Number.isInteger(state.trackIndex) && state.trackIndex >= 0 && state.trackIndex < playlist.length && state.trackIndex !== trackIndex) selectTrack(state.trackIndex, soundEnabled);
      if (Number.isFinite(state.currentTime) && state.currentTime >= 0) {
        pendingResumeTime = state.currentTime;
        if (soundEnabled) applyResumePosition();
        else {
          // Keep the saved place visible while muted, and retain it for the
          // eventual load when the visitor turns sound back on.
          try { audio.currentTime = pendingResumeTime; } catch {}
        }
      }
      if (!soundEnabled) {
        stopWoodlandSound();
        return;
      }
      restoredFromGame = true;
    } catch {}
  }

  restoreFromGame();

  window.addEventListener("pageshow", event => {
    if (!event.persisted) return;
    restoreFromGame();
    if (!restoredFromGame) return;
    startWoodlandSound(NORMAL_VOLUME, 2200);
    restoredFromGame = false;
  });

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
    activeStoryAudio = null;
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
    activeStoryAudio = storyAudio;
    ambienceWhenPaused = Boolean(event.detail.content.querySelector("[data-audio-ambience]")?.checked);

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
      if (storyAudio.error) return;
      audiobookPlaying = !ambienceWhenPaused;
      clearResumeTimer();
      if (ambienceWhenPaused) {
        void startWoodlandSound(LISTEN_VOLUME, FADE_IN_MS);
        return;
      }
      const request = ++audioRequestVersion;
      fadeTo(0, FADE_OUT_MS).then((completed) => {
        if (!completed || request !== audioRequestVersion) return;
        audio.pause();
        setButtonState(false);
      });
    });

    function resumeAfterStory() {
      if (!listenOpen || !storyAudio.isConnected) return;
      audiobookPlaying = false;
      clearResumeTimer();
      resumeTimer = window.setTimeout(() => {
        if (listenOpen) startWoodlandSound(LISTEN_VOLUME, FADE_IN_MS);
      }, 5000);
    }
    storyAudio.addEventListener("ended", resumeAfterStory);
    storyAudio.addEventListener("error", resumeAfterStory);
  });

  document.addEventListener("jacklight:audiobook-ambience", event => {
    ambienceWhenPaused = Boolean(event.detail?.enabled);
    if (!listenOpen || !activeStoryAudio?.isConnected) return;
    // The preference applies to paused stories, never underneath narration.
    if (!activeStoryAudio.paused && !activeStoryAudio.ended) return;
    clearResumeTimer();
    audiobookPlaying = Boolean(activeStoryAudio.getAttribute("src")) && !ambienceWhenPaused;
    if (ambienceWhenPaused) {
      void startWoodlandSound(LISTEN_VOLUME, FADE_IN_MS);
    } else {
      stopWoodlandSound();
    }
  });

  document.addEventListener("jacklight:panel-closed", () => {
    cinemaOpen = false;
    listenOpen = false;
    audiobookPlaying = false;
    activeStoryAudio = null;
    clearResumeTimer();
    startWoodlandSound(NORMAL_VOLUME, FADE_IN_MS);
  });

  button.addEventListener("click", async () => {
    if (audiobookPlaying) return;

    if (audio.paused) {
      soundEnabled = true;
      audio.setAttribute("data-sound-enabled", "true");
      if (audio.error || failedTracks.has(trackIndex)) {
        failedTracks.clear();
        selectTrack(trackIndex);
      }
      await startWoodlandSound(listenOpen ? LISTEN_VOLUME : NORMAL_VOLUME, FADE_IN_MS);
    } else {
      soundEnabled = false;
      audio.setAttribute("data-sound-enabled", "false");
      const request = ++audioRequestVersion;
      const completed = await fadeTo(0, FADE_OUT_MS);
      if (!completed || request !== audioRequestVersion) return;
      audio.pause();
      setButtonState(false);
    }
  });
}
