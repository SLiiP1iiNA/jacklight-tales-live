const ENTRANCE_SEEN_KEY = "jacklight-entrance-seen";

export function initEntrance(settings = {}) {
  const entrance = document.querySelector("#entrance");
  const main = document.querySelector("#main-site");
  const enterButton = document.querySelector("#enter-site");
  const skipButton = document.querySelector("#skip-entrance");
  if (!entrance || !main || !enterButton || !skipButton) {
    return;
  }
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const replayButtons = document.querySelectorAll("[data-replay-entrance]");
  const map = document.querySelector("#woodland-map");
  const transitionMs = Number(settings.transitionMs) || 1150;
  let exitTimer = 0;
  let landingTimer = 0;
  let isClosing = false;

  function hideEntrance({ immediate = false } = {}) {
    if (isClosing) {
      return;
    }
    isClosing = true;
    window.clearTimeout(exitTimer);
    window.clearTimeout(landingTimer);
    entrance.classList.add(immediate ? "is-leaving" : "is-opening");
    entrance.setAttribute("aria-hidden", "true");
    sessionStorage.setItem(ENTRANCE_SEEN_KEY, "true");
    main.inert = false;
    document.body.classList.add("entrance-transitioning");

    landingTimer = window.setTimeout(() => {
      map?.scrollIntoView({ block: "center", behavior: "auto" });
    }, reducedMotion || immediate ? 0 : Math.round(transitionMs * 0.58));

    exitTimer = window.setTimeout(() => {
      entrance.hidden = true;
      document.body.classList.remove("entrance-active", "entrance-transitioning");
      main.focus({ preventScroll: true });
      isClosing = false;
    }, reducedMotion || immediate ? 0 : transitionMs);
  }

  function showEntrance() {
    window.clearTimeout(exitTimer);
    window.clearTimeout(landingTimer);
    isClosing = false;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    entrance.hidden = false;
    entrance.setAttribute("aria-hidden", "false");
    entrance.classList.remove("is-opening", "is-leaving");
    document.body.classList.add("entrance-active");
    document.body.classList.remove("entrance-transitioning");
    main.inert = true;
    window.requestAnimationFrame(() => enterButton.focus({ preventScroll: true }));
  }

  const alreadySeen = sessionStorage.getItem(ENTRANCE_SEEN_KEY) === "true";
  if (settings.showOncePerSession && alreadySeen) {
    entrance.hidden = true;
    entrance.setAttribute("aria-hidden", "true");
    main.inert = false;
  } else {
    showEntrance();
  }

  enterButton.addEventListener("click", () => hideEntrance());
  skipButton.addEventListener("click", () => hideEntrance({ immediate: true }));
  replayButtons.forEach((button) => button.addEventListener("click", showEntrance));
}
