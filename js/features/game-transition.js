export function initGameTransition() {
  let travelling = false;
  const GAME_STATE_KEY = "jacklight:woodland-audio-state";

  document.addEventListener("click", event => {
    const link = event.target.closest("a[data-game-launch]");
    if (!link || travelling || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const siteAudio = document.querySelector("#woodland-audio");
    if (siteAudio && !siteAudio.paused) {
      try {
        sessionStorage.setItem(GAME_STATE_KEY, JSON.stringify({
          enabled: true,
          currentTime: siteAudio.currentTime
        }));
        siteAudio.pause();
      } catch {}
    }

    event.preventDefault();
    travelling = true;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const overlay = document.createElement("div");
    overlay.className = "game-transition-screen";
    overlay.setAttribute("aria-live", "polite");
    overlay.innerHTML = `
      <div class="game-transition-screen__inner">
        <img src="assets/branding/jlt-lantern.webp" alt="">
        <span>Following the lantern path…</span>
      </div>`;
    document.body.append(overlay);
    requestAnimationFrame(() => overlay.classList.add("is-visible"));

    window.setTimeout(() => {
      window.location.href = link.href;
    }, reduceMotion ? 40 : 620);
  });
}
