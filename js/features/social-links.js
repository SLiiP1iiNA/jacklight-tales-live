function setLink(link, item) {
  link.href = item.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "social-link";
  const icon = document.createElement("span");
  icon.className = "social-link__icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = item.icon || item.label.slice(0, 2).toUpperCase();
  const copy = document.createElement("span");
  copy.className = "social-link__copy";
  const label = document.createElement("strong");
  label.textContent = item.shortLabel || item.label;
  copy.append(label);
  if (item.description) {
    const description = document.createElement("small");
    description.textContent = item.description;
    copy.append(description);
  }
  const arrow = document.createElement("span");
  arrow.className = "social-link__arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";
  link.append(icon, copy, arrow);
  if (item.description) {
    link.title = item.description;
  }
  return link;
}

export function initSocialLinks(contentPath, contactEmail = "") {
  let linksPromise;

  function loadLinks() {
    if (!linksPromise) {
      linksPromise = fetch(contentPath).then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load ${contentPath}`);
        }
        return response.json();
      });
    }
    return linksPromise;
  }

  function renderTargets(targets, links) {
    targets.forEach((target) => {
      if (!links.length) {
        target.replaceChildren(Object.assign(document.createElement("span"), {
          textContent: "Social pages will be added before launch.",
        }));
        return;
      }
      target.replaceChildren(...links.map((item) => setLink(document.createElement("a"), item)));
    });
  }

  function renderStaticTargets() {
    const targets = document.querySelectorAll("[data-social-links]");
    if (!targets.length) {
      return;
    }
    loadLinks().then((items) => renderTargets(targets, items.filter((item) => item.url))).catch((error) => {
      console.error("Social links could not be loaded", error);
      targets.forEach((target) => target.replaceChildren(Object.assign(document.createElement("span"), {
        textContent: "Social links are temporarily unavailable.",
      })));
    });
  }

  function applyContact(scope = document) {
    const link = scope.querySelector("[data-contact-link]");
    const note = scope.querySelector("[data-contact-note]");
    if (contactEmail && link) {
      link.href = `mailto:${contactEmail}`;
      link.hidden = false;
      if (note) {
        note.hidden = true;
      }
    }
  }

  document.addEventListener("jacklight:panel-opened", async (event) => {
    if (event.detail.panelName !== "grownups") {
      return;
    }

    const targets = event.detail.content.querySelectorAll("[data-social-links]");
    applyContact(event.detail.content);
    if (!targets.length) {
      return;
    }

    try {
      const links = (await loadLinks()).filter((item) => item.url);
      renderTargets(targets, links);
    } catch (error) {
      console.error("Social links could not be loaded", error);
      targets.forEach((target) => {
        target.replaceChildren(Object.assign(document.createElement("span"), {
          textContent: "Social links are temporarily unavailable.",
        }));
      });
    }
  });

  renderStaticTargets();
}
