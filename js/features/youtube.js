function makeVideoUrl(source = {}) {
  if (source.playlistId) {
    const query = new URLSearchParams({ list: source.playlistId, rel: "0", modestbranding: "1", playsinline: "1" });
    return "https://www.youtube-nocookie.com/embed/videoseries?" + query;
  }
  if (source.videoId) {
    const query = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1" });
    return "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(source.videoId) + "?" + query;
  }
  return "";
}

function setExternalLink(link, href, label) {
  if (!link) return;
  if (!href) {
    link.hidden = true;
    link.removeAttribute("href");
    return;
  }
  const arrow = link.querySelector("span") ? link.querySelector("span").cloneNode(true) : null;
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.hidden = false;
  link.textContent = (label || "Open on YouTube") + " ";
  if (arrow) link.append(arrow);
}

function hasStarted(startDate) {
  if (!startDate) return true;
  const value = startDate.includes("T") ? startDate : startDate + "T00:00:00";
  const start = new Date(value);
  return !Number.isNaN(start.valueOf()) && new Date() >= start;
}

function hasSource(mode = {}) {
  return Boolean(mode.playlistId || mode.videoId);
}

function watchUrl(mode = {}, channelUrl = "") {
  if (mode.playlistId) return "https://www.youtube.com/playlist?list=" + encodeURIComponent(mode.playlistId);
  if (mode.videoId) return "https://www.youtube.com/watch?v=" + encodeURIComponent(mode.videoId);
  return channelUrl;
}

function seriesMapFor(config = {}) {
  if (config.series && Object.keys(config.series).length) return config.series;
  const legacy = config.watchModes || {};
  return {
    series1: {
      label: "Series 1",
      statusLabel: "Available",
      title: "First adventures",
      episodes: "Episodes 01–30",
      description: "The first path through the Whispering Woods.",
      modes: {
        episodes: legacy.shorts || { label: "Episodes · vertical", playlistId: config.playlistId || "", videoId: config.featuredVideoId || "", aspect: "vertical" },
        landscape: legacy.landscape || { label: "Full series · landscape", aspect: "landscape" },
      },
    },
  };
}

function usableMode(series = {}, preferred = "episodes") {
  const modes = series.modes || {};
  if (modes[preferred] && modes[preferred].available !== false && hasSource(modes[preferred])) return preferred;
  const found = Object.entries(modes).find((entry) => entry[1].available !== false && hasSource(entry[1]));
  return found ? found[0] : preferred;
}

function initialSelection(config, map) {
  const requestedSeries = config.defaultSeries || Object.keys(map)[0] || "series1";
  const requestedMode = config.defaultWatchMode || "episodes";
  const requested = map[requestedSeries];
  if (requested) {
    const modeName = usableMode(requested, requestedMode);
    const mode = requested.modes && requested.modes[modeName];
    if (mode && mode.available !== false && hasSource(mode)) return { seriesName: requestedSeries, modeName };
  }
  for (const entry of Object.entries(map)) {
    const modeName = usableMode(entry[1], requestedMode);
    const mode = entry[1].modes && entry[1].modes[modeName];
    if (mode && mode.available !== false && hasSource(mode)) return { seriesName: entry[0], modeName };
  }
  return { seriesName: requestedSeries, modeName: requestedMode };
}

export function initYouTube(config = {}) {
  const map = seriesMapFor(config);
  const channelUrl = config.channelUrl || (config.channelId ? "https://www.youtube.com/channel/" + encodeURIComponent(config.channelId) : "");
  const comingSoonAudioUrl = config.comingSoonAudio || "";

  function syncComingSoonMusic(root, shouldPlay) {
    const audio = root.querySelector("[data-coming-soon-music]");
    if (!audio) return;
    if (!comingSoonAudioUrl) {
      audio.pause();
      return;
    }
    if (audio.src !== comingSoonAudioUrl) {
      audio.src = comingSoonAudioUrl;
      audio.volume = 0.05;
    }
    if (shouldPlay) audio.play().catch(() => {});
    else {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  function syncCopy(root, series) {
    const kicker = root.querySelector("[data-watch-current-kicker]");
    const title = root.querySelector("[data-watch-current-title]");
    const copy = root.querySelector("[data-watch-current-copy]");
    if (kicker) kicker.textContent = [series.label, series.statusLabel].filter(Boolean).join(" · ");
    if (title) title.textContent = series.title || series.label || "Barnaby and the Whispering Woods";
    if (copy) copy.textContent = series.description || series.episodes || "Choose a collection to watch.";
  }

  function syncSeries(root, seriesName) {
    root.querySelectorAll("[data-watch-series]").forEach((button) => {
      const active = button.dataset.watchSeries === seriesName;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    root.querySelectorAll("[data-series-card]").forEach((card) => {
      card.classList.toggle("is-selected", card.dataset.seriesCard === seriesName);
    });
  }

  function syncModes(root, series, modeName) {
    const modes = series.modes || {};
    root.querySelectorAll("[data-watch-mode]").forEach((button) => {
      const key = button.dataset.watchMode;
      const mode = modes[key] || {};
      const disabled = mode.available === false;
      button.textContent = mode.label || (key === "landscape" ? "Full series · landscape" : "Episodes · vertical");
      button.disabled = disabled;
      button.setAttribute("aria-disabled", String(disabled));
      const active = key === modeName;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
  }

  function placeholder(frame, status, message) {
    frame.replaceChildren();
    const box = document.createElement("div");
    box.className = "youtube-placeholder";
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "✦";
    const text = document.createElement("p");
    text.textContent = message;
    box.append(icon, text);
    frame.append(box);
    if (status) status.textContent = message;
  }

  function render(root, requestedSeries, requestedMode) {
    const seriesName = map[requestedSeries] ? requestedSeries : Object.keys(map)[0];
    const series = map[seriesName] || {};
    const modes = series.modes || {};
    let modeName = requestedMode || "episodes";
    if (!modes[modeName] || modes[modeName].available === false) {
      modeName = modes.episodes && modes.episodes.available !== false ? "episodes" : usableMode(series, "episodes");
    }
    const mode = modes[modeName] || {};
    const frame = root.querySelector("[data-youtube-embed]");
    const stage = root.querySelector("[data-watch-stage]");
    const status = root.querySelector("[data-youtube-status]");
    const outbound = root.querySelector("[data-youtube-playlist]");
    if (!frame) return;

    root.dataset.watchSeries = seriesName;
    root.dataset.watchMode = modeName;
    syncCopy(root, series);
    syncSeries(root, seriesName);
    syncModes(root, series, modeName);

    const landscape = mode.aspect === "landscape";
    if (stage) {
      stage.classList.toggle("watch-stage--vertical", !landscape);
      stage.classList.toggle("watch-stage--landscape", landscape);
    }

    const outboundUrl = watchUrl(mode, channelUrl);
    const outboundLabel = mode.playlistId ? "Open " + (series.label || "series") + " playlist" : (hasSource(mode) ? "Open on YouTube" : "Visit YouTube");
    setExternalLink(outbound, outboundUrl, outboundLabel);

    const waiting = mode.available !== false && Boolean(mode.startDate) && !hasStarted(mode.startDate);
    syncComingSoonMusic(root, waiting);

    if (mode.available === false) {
      placeholder(frame, status, mode.unavailableMessage || "This collection will open later.");
      return;
    }
    if (waiting) {
      placeholder(frame, status, mode.releaseMessage || "This collection will open here soon.");
      return;
    }

    const src = makeVideoUrl(mode);
    if (!src) {
      placeholder(frame, status, mode.unavailableMessage || (series.label || "This series") + " is being connected to the cinema.");
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.title = (series.label || "JackLight Tales") + (landscape ? " landscape collection on YouTube" : " episode playlist on YouTube");
    iframe.src = src;
    iframe.loading = "lazy";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    frame.replaceChildren(iframe);
    if (status) status.textContent = mode.nowShowing || "Now showing " + (series.label || "the selected series");
  }

  function wire(root) {
    setExternalLink(root.querySelector("[data-youtube-channel]"), channelUrl, "Visit YouTube");
    const initial = initialSelection(config, map);
    render(root, root.dataset.watchSeries || initial.seriesName, root.dataset.watchMode || initial.modeName);
    if (root.dataset.watchControlsWired === "true") return;
    root.dataset.watchControlsWired = "true";

    root.addEventListener("click", (event) => {
      const seriesButton = event.target.closest("[data-watch-series]");
      if (seriesButton) {
        const nextName = seriesButton.dataset.watchSeries;
        const next = map[nextName] || {};
        const currentMode = root.dataset.watchMode || config.defaultWatchMode || "episodes";
        const nextMode = next.modes && next.modes[currentMode] && next.modes[currentMode].available !== false ? currentMode : "episodes";
        render(root, nextName, nextMode);
        return;
      }

      const modeButton = event.target.closest("[data-watch-mode]");
      if (!modeButton || modeButton.disabled) return;
      render(root, root.dataset.watchSeries || initial.seriesName, modeButton.dataset.watchMode || "episodes");
    });
  }

  document.addEventListener("jacklight:panel-opened", (event) => {
    if (event.detail.panelName === "watch") wire(event.detail.content);
  });
}
