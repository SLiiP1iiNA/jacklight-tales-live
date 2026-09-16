export function initWoodlandMap() {
  const map = document.querySelector("#woodland-map");
  if (!map) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveal = () => map.classList.add("is-ready");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        reveal();
        observer.disconnect();
      }
    }, { threshold: 0.18 });
    observer.observe(map);
  } else {
    reveal();
  }

  if (reducedMotion) {
    reveal();
    return;
  }

  map.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") {
      return;
    }

    const bounds = map.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * -7;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -5;
    map.style.setProperty("--map-pointer-x", `${x.toFixed(2)}px`);
    map.style.setProperty("--map-pointer-y", `${y.toFixed(2)}px`);
  });

  map.addEventListener("pointerleave", () => {
    map.style.setProperty("--map-pointer-x", "0px");
    map.style.setProperty("--map-pointer-y", "0px");
  });
}
