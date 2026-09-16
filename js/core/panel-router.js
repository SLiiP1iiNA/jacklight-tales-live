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
  if (!layer || !panel || !content) {
    return;
  }
  const cache = new Map();
  let lastTrigger = null;

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
    lastTrigger = trigger;
    panel.scrollTop = 0;
    content.innerHTML = "<p>Opening this woodland path…</p>";
    layer.hidden = false;
    document.body.classList.add("panel-open");

    try {
      content.innerHTML = await getPanelMarkup(panelName);
      document.dispatchEvent(
        new CustomEvent("jacklight:panel-opened", {
          detail: { panelName, content, trigger },
        }),
      );
    } catch (error) {
      console.error(error);
      content.innerHTML = `
        <div class="panel-error">
          <h2 id="panel-title">This path is resting</h2>
          <p>Start the site with Live Server so its separate panel files can load.</p>
        </div>
      `;
    }

    panel.querySelector("[data-close-panel]")?.focus();
  }

  function closePanel() {
    layer.hidden = true;
    document.body.classList.remove("panel-open");
    content.replaceChildren();
    panel.scrollTop = 0;
    lastTrigger?.focus();
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

    const focusable = [...panel.querySelectorAll(FOCUSABLE)];
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
