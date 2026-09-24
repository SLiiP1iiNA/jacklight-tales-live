const IMAGE_SELECTOR = "img";

function isImageTarget(target) {
  return target instanceof Element && Boolean(target.closest(IMAGE_SELECTOR));
}

/**
 * Add a light-touch deterrent against casual image saving.
 *
 * This intentionally targets images only so normal page interaction,
 * text selection, buttons, links, scrolling and game controls remain
 * unchanged. It is a deterrent, not a security boundary.
 */
export function initImageProtection() {
  if (document.documentElement.dataset.imageProtection === "enabled") {
    return;
  }

  document.documentElement.dataset.imageProtection = "enabled";

  document.addEventListener(
    "contextmenu",
    (event) => {
      if (isImageTarget(event.target)) {
        event.preventDefault();
      }
    },
    { passive: false }
  );

  document.addEventListener(
    "dragstart",
    (event) => {
      if (isImageTarget(event.target)) {
        event.preventDefault();
      }
    },
    { passive: false }
  );
}
