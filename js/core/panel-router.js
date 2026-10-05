const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "audio[controls]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function initPanelRouter(partialPaths) {
  const layer = document.querySelector("#panel-layer");
  const panel = document.querySelector("#active-panel");
  const content = document.querySelector("#panel-content");
  const main = document.querySelector("#main-site");
  if (!layer || !panel || !content) {
    return;
  }
  const cache = new Map();
  let lastTrigger = null;
  let requestVersion = 0;

  async function getPanelMarkup(panelName) {
    if (cache.has(panelName)) {
      return cache.get(panelName);
    }

    const path = partialPaths[panelName];
    if (!path) {
      throw new Error(`Unknown panel: ${panelName}`);
    }

    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Could not load ${path}`);
    }

    const markup = await response.text();
    cache.set(panelName, markup);
    return markup;
  }

  async function openPanel(panelName, trigger) {
    const request = ++requestVersion;
    lastTrigger = trigger;
    document.dispatchEvent(new CustomEvent("jacklight:panel-opening", { detail: { panelName, trigger } }));
    panel.scrollTop = 0;
    layer.classList.toggle("panel-layer--watch", panelName === "watch");
    panel.classList.toggle("panel--watch", panelName === "watch");
    content.innerHTML = '<p id="panel-title">Opening this woodland path…</p>';
    layer.hidden = false;
    document.body.classList.add("panel-open");
    if (main) main.inert = true;
    panel.querySelector("[data-close-panel]")?.focus();

    try {
      const markup = await getPanelMarkup(panelName);
      if (request !== requestVersion || layer.hidden) return;
      content.innerHTML = markup;
      document.dispatchEvent(
        new CustomEvent("jacklight:panel-opened", {
          detail: { panelName, content, trigger },
        }),
      );
    } catch (error) {
      if (request !== requestVersion || layer.hidden) return;
      console.error(error);
      content.innerHTML = `
        <div class="panel-error">
          <h2 id="panel-title">This path needs a moment</h2>
          <p>Something did not open properly. Please close this window and try the path again.</p>
        </div>
      `;
    }
  }

  function closePanel() {
    requestVersion += 1;
    layer.hidden = true;
    document.body.classList.remove("panel-open");
    if (main) main.inert = false;
    content.replaceChildren();
    panel.scrollTop = 0;
    layer.classList.remove("panel-layer--watch");
    panel.classList.remove("panel--watch");
    document.dispatchEvent(new CustomEvent("jacklight:panel-closed"));
    const returnFocus = lastTrigger?.isConnected ? lastTrigger : main;
    returnFocus?.focus();
  }

  document.addEventListener("click", (event) => {
    const openTrigger = event.target.closest("[data-panel]");
    const closeTrigger = event.target.closest("[data-close-panel]");

    if (openTrigger) {
      event.preventDefault();
      openPanel(openTrigger.dataset.panel, openTrigger);
    }

    if (closeTrigger) {
      closePanel();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (layer.hidden) {
      return;
    }

    if (event.key === "Escape") {
      closePanel();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable = [...panel.querySelectorAll(FOCUSABLE)].filter((element) => element.getClientRects().length);
    const first = focusable[0];
    const last = focusable.at(-1);

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
}
