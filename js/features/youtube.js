function makeVideoUrl(source = {}) {
  const query = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });

  if (source.playlistId) {
    query.set("list", source.playlistId);
  }

  // If a current released video is supplied, start on it while keeping
  // the playlist attached. Otherwise YouTube controls the first playlist item.
  if (source.videoId) {
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(source.videoId)}?${query}`;
  }

  if (source.playlistId) {
    return `https://www.youtube-nocookie.com/embed/videoseries?${query}`;
  }

  return "";
}

function setExternalLink(link, href) {
  if (!link || !href) return;
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.hidden = false;
}

function watchUrlForMode(mode = {}, channelUrl = "") {
  if (mode.videoId) {
    const query = new URLSearchParams({ v: mode.videoId });
    if (mode.playlistId) query.set("list", mode.playlistId);
    return `https://www.youtube.com/watch?${query}`;
  }
  if (mode.playlistId) {
    return `https://www.youtube.com/playlist?list=${encodeURIComponent(mode.playlistId)}`;
  }
  return channelUrl;
}

export function initYouTube(config = {}) {
  const modes = config.watchModes || {};
  const channelUrl = config.channelUrl || (config.channelId
    ? `https://www.youtube.com/channel/${encodeURIComponent(config.channelId)}`
    : "");

  function renderMode(root, modeName) {
    const mode = modes[modeName] || modes.shorts || {};
    const frame = root.querySelector("[data-youtube-embed]");
    const stage = root.querySelector("[data-watch-stage]");
    const status = root.querySelector("[data-youtube-status]");
    const playlistLink = root.querySelector("[data-youtube-playlist]");
    if (!frame) return;

    const landscape = mode.aspect === "landscape";
    stage?.classList.toggle("watch-stage--vertical", !landscape);
    stage?.classList.toggle("watch-stage--landscape", landscape);

    root.querySelectorAll("[data-watch-mode]").forEach((button) => {
      const active = button.dataset.watchMode === modeName;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });

    setExternalLink(playlistLink, watchUrlForMode(mode, channelUrl));

    const src = makeVideoUrl(mode);
    if (!src) {
      frame.innerHTML = '<div class="youtube-placeholder"><span aria-hidden="true">✦</span><p>This cinema path is not connected yet.</p></div>';
      if (status) status.textContent = "This cinema path is not connected yet.";
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.title = landscape
      ? "JackLight Tales full landscape adventure on YouTube"
      : "JackLight Tales latest portrait episode on YouTube";
    iframe.src = src;
    iframe.loading = "eager";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    frame.replaceChildren(iframe);

    if (status) {
      status.textContent = landscape
        ? "Now showing the full Series 1 landscape adventure"
        : "Now showing the latest portrait episode";
    }
  }

  function wirePanel(root) {
    setExternalLink(root.querySelector("[data-youtube-channel]"), channelUrl);
    renderMode(root, config.defaultWatchMode || "shorts");

    if (root.dataset.watchModeWired !== "true") {
      root.dataset.watchModeWired = "true";
      root.addEventListener("click", (event) => {
        const button = event.target.closest("[data-watch-mode]");
        if (!button) return;
        renderMode(root, button.dataset.watchMode || "shorts");
      });
    }

    // Put the controls and screen straight in view when Cinema opens.
    requestAnimationFrame(() => {
      root.querySelector(".watch-mode-switch")?.scrollIntoView({ block: "start", behavior: "auto" });
    });
  }

  document.addEventListener("jacklight:panel-opened", (event) => {
    if (event.detail.panelName === "watch") wirePanel(event.detail.content);
  });
}
