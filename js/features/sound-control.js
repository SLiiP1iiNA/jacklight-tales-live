export function initSoundControl(audioPath) {
  const button = document.querySelector("#sound-control");
  const audio = document.querySelector("#woodland-audio");
  if (!button || !audio) return;
  const source = audio.querySelector("source");
  const label = button.querySelector("[data-sound-label]");

  if (!audioPath) {
    button.hidden = true;
    button.disabled = true;
    button.title = "Add a woodland audio file in site.config.js";
    label.textContent = "Sound ready later";
    return;
  }

  button.hidden = false;
  source.src = audioPath;
  audio.volume = 0.12;
  audio.load();

  let resumeAfterPanel = false;

  document.addEventListener("jacklight:panel-opened", () => {
    resumeAfterPanel = !audio.paused;
    if (!audio.paused) audio.pause();
  });

  document.addEventListener("jacklight:panel-closed", () => {
    if (resumeAfterPanel && audio.paused) {
      audio.play().catch(() => {});
    }
    resumeAfterPanel = false;
  });

  button.addEventListener("click", async () => {
    const shouldPlay = audio.paused;

    if (shouldPlay) {
      try {
        await audio.play();
      } catch {
        label.textContent = "Press again for sound";
        return;
      }
    } else {
      audio.pause();
    }

    button.setAttribute("aria-pressed", String(shouldPlay));
    button.setAttribute(
      "aria-label",
      shouldPlay ? "Turn woodland sound off" : "Turn woodland sound on",
    );
    label.textContent = shouldPlay ? "Sound on" : "Sound off";
  });
}
