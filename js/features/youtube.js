function makeVideoUrl(source = {}) {
  if (source.playlistId) {
    const query = new URLSearchParams({
      list: source.playlistId,
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
    });
    return `https://www.youtube-nocookie.com/embed/videoseries?${query}`;
  }

  if (source.videoId) {
    const query = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
    });
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(source.videoId)}?${query}`;
  }

  return "";
}

function setExternalLink(link, href) {
  if (!link || !href) {
    return;
  }
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.hidden = false;
}

function getWatchModes(config) {
  if (config.watchModes) {
    return config.watchModes;
  }

  return {
    shorts: {
      label: "Shorts · vertical",
      playlistId: config.playlistId || "",
      videoId: config.featuredVideoId || "",
      aspect: "vertical",
    },
    landscape: {
      label: "Landscape · wide",
      playlistId: "",
      aspect: "landscape",
      startDate: "2026-09-26",
    },
  };
}

function hasStarted(startDate) {
  if (!startDate) {
    return false;
  }
  const start = new Date(`${startDate}T00:00:00`);
  return !Number.isNaN(start.valueOf()) && new Date() >= start;
}

export function initYouTube(config = {}) {
  const modes = getWatchModes(config);
  const channelUrl = config.channelUrl || (config.channelId ? `https://www.youtube.com/channel/${encodeURIComponent(config.channelId)}` : "");

  function renderMode(root, modeName) {
    const mode = modes[modeName] || modes.shorts || {};
    const frame = root.querySelector("[data-youtube-embed]");
    const stage = root.querySelector("[data-watch-stage]");
    const status = root.querySelector("[data-youtube-status]");
    const playlistLink = root.querySelector("[data-youtube-playlist]");
    if (!frame) {
      return;
    }

    stage?.classList.toggle("watch-stage--vertical", mode.aspect !== "landscape");
    stage?.classList.toggle("watch-stage--landscape", mode.aspect === "landscape");
    root.querySelectorAll("[data-watch-mode]").forEach((button) => {
      const isActive = button.dataset.watchMode === modeName;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });

    const playlistUrl = mode.playlistId
      ? `https://www.youtube.com/playlist?list=${encodeURIComponent(mode.playlistId)}`
      : channelUrl;
    setExternalLink(playlistLink, playlistUrl);

    const src = makeVideoUrl(mode);
    if (!src) {
      const message = mode.aspect === "landscape"
        ? hasStarted(mode.startDate)
          ? "Our longer woodland collection is coming soon. Enjoy the short tales while we prepare it."
          : "The wide collection will open here from 26 September."
        : "The Watch room will open when the Barnaby playlist is ready.";
      frame.replaceChildren();
      const placeholder = document.createElement("div");
      placeholder.className = "youtube-placeholder";
      placeholder.innerHTML = `<span aria-hidden="true">✦</span><p>${message}</p>`;
      frame.append(placeholder);
      if (status) {
        status.textContent = message;
      }
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.title = mode.aspect === "landscape"
      ? "JackLight Tales landscape collection on YouTube"
      : "JackLight Tales Shorts playlist on YouTube";
    iframe.src = src;
    iframe.loading = "lazy";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    frame.replaceChildren(iframe);
    if (status) {
      status.textContent = mode.aspect === "landscape"
        ? "Now showing the landscape collection"
        : "Now showing the vertical Shorts collection";
    }
  }

  function wirePanel(root) {
    setExternalLink(root.querySelector("[data-youtube-channel]"), channelUrl);
    const defaultMode = config.defaultWatchMode
      || (hasStarted(modes.landscape?.startDate) && modes.landscape?.playlistId ? "landscape" : "shorts");
    renderMode(root, defaultMode);

    if (root.dataset.watchModeWired === "true") {
      return;
    }
    root.dataset.watchModeWired = "true";
    root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-watch-mode]");
      if (!button) {
        return;
      }
      renderMode(root, button.dataset.watchMode || "shorts");
    });
  }

  document.addEventListener("jacklight:panel-opened", (event) => {
    if (event.detail.panelName === "watch") {
      wirePanel(event.detail.content);
    }
  });
}
