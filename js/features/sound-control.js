export function initSoundControl(audioPath) {
  const button = document.querySelector("#sound-control");
  const audio = document.querySelector("#woodland-audio");
  if (!button || !audio) return;

  const source = audio.querySelector("source");
  const label = button.querySelector("[data-sound-label]");
  let listenOpen = false;
  let audiobookPlaying = false;
  let resumeTimer = null;

  if (!audioPath) {
    button.hidden = true;
    button.disabled = true;
    return;
  }

  button.hidden = true;
  button.disabled = false;
  source.src = audioPath;
  audio.volume = 0.08;
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

  async function startWoodlandSound() {
    if (!listenOpen || audiobookPlaying || !audio.paused) return;
    clearResumeTimer();
    try {
      await audio.play();
      setButtonState(true);
    } catch {
      setButtonState(false);
    }
  }

  function stopWoodlandSound() {
    clearResumeTimer();
    audio.pause();
    audio.currentTime = 0;
    setButtonState(false);
  }

  document.addEventListener("jacklight:panel-opening", (event) => {
    if (event.detail.panelName !== "listen") return;
    listenOpen = true;
    audiobookPlaying = false;
    button.hidden = false;
    startWoodlandSound();
  });

  document.addEventListener("jacklight:panel-opened", (event) => {
    if (event.detail.panelName !== "listen") return;

    const storyAudio = event.detail.content.querySelector("[data-audio-element]");
    if (!storyAudio) return;

    storyAudio.addEventListener("play", () => {
      audiobookPlaying = true;
      clearResumeTimer();
      audio.pause();
      setButtonState(false);
    });

    storyAudio.addEventListener("pause", () => {
      audiobookPlaying = true;
      audio.pause();
      setButtonState(false);
    });

    storyAudio.addEventListener("ended", () => {
      audiobookPlaying = false;
      clearResumeTimer();
      resumeTimer = window.setTimeout(() => {
        if (listenOpen) startWoodlandSound();
      }, 5000);
    });
  });

  document.addEventListener("jacklight:panel-closed", () => {
    if (!listenOpen) return;
    listenOpen = false;
    audiobookPlaying = false;
    button.hidden = true;
    stopWoodlandSound();
  });

  button.addEventListener("click", async () => {
    if (!listenOpen || audiobookPlaying) return;

    if (audio.paused) {
      await startWoodlandSound();
    } else {
      audio.pause();
      setButtonState(false);
    }
  });
}
