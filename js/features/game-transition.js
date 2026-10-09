export function initGameTransition() {
  let travelling = false;
  let transitionScreen = null;
  let navigationTimer = 0;
  const GAME_STATE_KEY = "jacklight:woodland-audio-state";

  window.addEventListener("pageshow", event => {
    if (!event.persisted) return;
    window.clearTimeout(navigationTimer);
    transitionScreen?.remove();
    transitionScreen = null;
    travelling = false;
  });

  document.addEventListener("click", async event => {
    const link = event.target.closest("a[data-game-launch]");
    if (!link || travelling || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const siteAudio = document.querySelector("#woodland-audio");
    const mobile = window.matchMedia("(max-width: 900px), (pointer: coarse)").matches;

    if (siteAudio) {
      try {
        sessionStorage.setItem(GAME_STATE_KEY, JSON.stringify({
          enabled: siteAudio.getAttribute("data-sound-enabled") !== "false",
          currentTime: siteAudio.currentTime,
          trackIndex: Number(siteAudio.getAttribute("data-sound-track") || 0)
        }));
        if (!mobile && !siteAudio.paused) {
          siteAudio.pause();
        }
      } catch {}
    }

    event.preventDefault();
    travelling = true;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const overlay = document.createElement("div");
    transitionScreen = overlay;
    overlay.className = "game-transition-screen";
    overlay.setAttribute("aria-live", "polite");
    overlay.innerHTML = `
      <div class="game-transition-screen__inner">
        <img src="assets/branding/jlt-lantern.webp" alt="">
        <span>Following the lantern path…</span>
      </div>`;
    document.body.append(overlay);
    requestAnimationFrame(() => overlay.classList.add("is-visible"));

    if (mobile && window.jltMobileSiteAudioTransition) {
      await window.jltMobileSiteAudioTransition(reduceMotion ? 40 : 520);
    }

    navigationTimer = window.setTimeout(() => {
      window.location.href = link.href;
    }, reduceMotion ? 40 : 620);
  });
}
