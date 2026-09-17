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
      startDate: "2026-09-26T10:30:00+01:00",
    },
  };
}

function hasStarted(startDate) {
  if (!startDate) {
    return false;
  }
  const value = startDate.includes("T") ? startDate : `${startDate}T00:00:00`;
  const start = new Date(value);
  return !Number.isNaN(start.valueOf()) && new Date() >= start;
}

function modeHasSource(mode = {}) {
  return Boolean(mode.playlistId || mode.videoId);
}

function watchUrlForMode(mode = {}, channelUrl = "") {
  if (mode.playlistId) {
    return `https://www.youtube.com/playlist?list=${encodeURIComponent(mode.playlistId)}`;
  }
  if (mode.videoId) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(mode.videoId)}`;
  }
  return channelUrl;
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

    setExternalLink(playlistLink, watchUrlForMode(mode, channelUrl));

    const waitingForRelease = mode.aspect === "landscape" && mode.startDate && !hasStarted(mode.startDate);
    if (waitingForRelease) {
      const message = "The wide Series 1 collection opens here on 26 September at 10:30.";
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

    const src = makeVideoUrl(mode);
    if (!src) {
      const message = mode.aspect === "landscape"
        ? "Our longer woodland collection is coming soon. Enjoy the short tales while we prepare it."
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
        ? "Now showing the Series 1 landscape collection"
        : "Now showing the vertical Shorts collection";
    }
  }

  function wirePanel(root) {
    setExternalLink(root.querySelector("[data-youtube-channel]"), channelUrl);
    const landscapeReady = hasStarted(modes.landscape?.startDate) && modeHasSource(modes.landscape);
    const defaultMode = config.defaultWatchMode || (landscapeReady ? "landscape" : "shorts");
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
