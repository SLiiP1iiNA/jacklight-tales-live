const cache = new Map();

async function loadJson(path) {
  if (!path) {
    return [];
  }
  if (!cache.has(path)) {
    cache.set(path, fetch(path).then((response) => {
      if (!response.ok) {
        throw new Error(`Could not load ${path}`);
      }
      return response.json();
    }));
  }
  return cache.get(path);
}

function makeElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text) {
    element.textContent = text;
  }
  return element;
}

function createCharacterCard(item) {
  const card = makeElement("article", "character-card");
  card.dataset.characterCard = item.id;
  const portrait = makeElement("div", "character-card__portrait");
  const image = makeElement("img");
  image.src = item.image;
  image.alt = item.alt || item.name;
  image.loading = "lazy";
  image.decoding = "async";
  const overlayId = `character-${item.id}-description`;
  const overlay = makeElement("div", "character-card__overlay");
  overlay.id = overlayId;
  overlay.append(makeElement("span", "content-card__label", item.role || "Woodland friend"));
  overlay.append(makeElement("p", "", item.description || "A friend from the Whispering Woods."));

  const toggle = makeElement("button", "character-card__toggle");
  toggle.type = "button";
  toggle.dataset.characterToggle = item.id;
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", overlayId);
  toggle.setAttribute("aria-label", `Learn about ${item.name}`);
  toggle.append(makeElement("span", "visually-hidden", `Show ${item.name}'s description`));
  toggle.append(makeElement("span", "character-card__toggle-icon", "+"));

  const identity = makeElement("div", "character-card__identity");
  identity.append(makeElement("h4", "", item.name));
  identity.append(makeElement("span", "", item.role || "Woodland friend"));
  portrait.append(image, overlay, toggle);
  card.append(portrait, identity);
  return card;
}

function createGalleryItem(item) {
  const figure = makeElement("figure", "gallery-item");
  const image = makeElement("img");
  image.src = item.image;
  image.alt = item.alt || item.title;
  image.loading = "lazy";
  image.decoding = "async";
  const caption = makeElement("figcaption");
  caption.append(makeElement("strong", "", item.title));
  if (item.description) {
    caption.append(makeElement("span", "", item.description));
  }
  figure.append(image, caption);
  return figure;
}

function showError(target, message) {
  const note = makeElement("p", "panel-note", message);
  target.replaceChildren(note);
}

export function initContentPanels(contentPaths = {}) {
  document.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-character-toggle]");
    if (!toggle) {
      return;
    }

    const card = toggle.closest(".character-card");
    const shouldOpen = !card.classList.contains("is-open");
    card.closest(".character-grid")?.querySelectorAll(".character-card.is-open").forEach((openCard) => {
      openCard.classList.remove("is-open");
      openCard.querySelector("[data-character-toggle]")?.setAttribute("aria-expanded", "false");
    });
    card.classList.toggle("is-open", shouldOpen);
    toggle.setAttribute("aria-expanded", String(shouldOpen));
  });

  document.addEventListener("jacklight:panel-opened", async (event) => {
    if (event.detail.panelName !== "explore") {
      return;
    }

    const root = event.detail.content;
    const characterTarget = root.querySelector("[data-character-grid]");
    const galleryTarget = root.querySelector("[data-gallery-grid]");

    if (characterTarget) {
      try {
        const characters = await loadJson(contentPaths.characters);
        characterTarget.replaceChildren(...characters.map(createCharacterCard));
      } catch (error) {
        console.error("Character content could not be loaded", error);
        showError(characterTarget, "The woodland friends are taking a little nap. Try again soon.");
      }
    }

    if (galleryTarget) {
      try {
        const gallery = await loadJson(contentPaths.gallery);
        galleryTarget.replaceChildren(...gallery.map(createGalleryItem));
      } catch (error) {
        console.error("Gallery content could not be loaded", error);
        showError(galleryTarget, "The artwork shelf is being tidied. Try again soon.");
      }
    }

    const section = event.detail.trigger?.dataset.panelSection;
    if (section) {
      const target = root.querySelector(`#${CSS.escape(section)}`);
      const panel = root.closest(".panel");

      if (target && panel) {
        // The character/gallery grids are filled asynchronously. Wait until the
        // new cards have taken up their real space, then scroll the panel itself
        // so "Meet the friends" and "Artwork" land exactly on their headings.
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const panelTop = panel.getBoundingClientRect().top;
        const targetTop = target.getBoundingClientRect().top;
        const destination = Math.max(0, panel.scrollTop + targetTop - panelTop - 20);
        panel.scrollTo({ top: destination, behavior: "smooth" });
      }
    }
  });
}
