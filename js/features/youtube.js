function makeVideoUrl(source = {}) {
  if (source.playlistId) {
    const query = new URLSearchParams({
      list: source.playlistId,
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
    });
    return "https://www.youtube-nocookie.com/embed/videoseries?" + query;
  }

  if (source.videoId) {
    const query = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
    });
    return "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(source.videoId) + "?" + query;
  }

  return "";
}

function watchUrl(source = {}, channelUrl = "") {
  if (source.playlistId) return "https://www.youtube.com/playlist?list=" + encodeURIComponent(source.playlistId);
  if (source.videoId) return "https://www.youtube.com/watch?v=" + encodeURIComponent(source.videoId);
  return channelUrl;
}

function hasStarted(startDate) {
  if (!startDate) return true;
  const value = startDate.includes("T") ? startDate : startDate + "T00:00:00";
  const start = new Date(value);
  return !Number.isNaN(start.valueOf()) && new Date() >= start;
}

function hasSource(source = {}) {
  return Boolean(source.playlistId || source.videoId);
}

function setLink(link, href, label) {
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

  if (label) {
    link.textContent = label + " ";
    if (arrow) link.append(arrow);
  }
}

function makeIframe(title, source) {
  const iframe = document.createElement("iframe");
  iframe.title = title;
  iframe.src = makeVideoUrl(source);
  iframe.loading = "lazy";
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  return iframe;
}

function showPlaceholder(frame, message) {
  frame.replaceChildren();

  const box = document.createElement("div");
  box.className = "youtube-placeholder";

  const icon = document.createElement("span");
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "✦";

  const copy = document.createElement("p");
  copy.textContent = message;

  box.append(icon, copy);
  frame.append(box);
}

function seriesEntries(config = {}) {
  return Object.entries(config.series || {});
}

function pickEpisode(config = {}) {
  const entries = seriesEntries(config);
  const preferredName = config.defaultSeries;
  const preferred = entries.find(([name]) => name === preferredName);

  if (preferred) {
    const source = preferred[1]?.modes?.episodes;
    if (source && source.available !== false && hasSource(source)) {
      return { seriesName: preferred[0], series: preferred[1], source };
    }
  }

  for (const [seriesName, series] of [...entries].reverse()) {
    const source = series?.modes?.episodes;
    if (source && source.available !== false && hasSource(source)) {
      return { seriesName, series, source };
    }
  }

  return null;
}

function pickLandscape(config = {}) {
  for (const [seriesName, series] of [...seriesEntries(config)].reverse()) {
    const source = series?.modes?.landscape;
    if (source && source.available !== false && hasSource(source)) {
      return { seriesName, series, source };
    }
  }

  return null;
}

function renderSource(frame, selection, fallbackMessage, kind) {
  if (!frame || !selection) {
    if (frame) showPlaceholder(frame, fallbackMessage);
    return;
  }

  const { series, source } = selection;

  if (source.startDate && !hasStarted(source.startDate)) {
    showPlaceholder(frame, source.releaseMessage || fallbackMessage);
    return;
  }

  const src = makeVideoUrl(source);
  if (!src) {
    showPlaceholder(frame, source.unavailableMessage || fallbackMessage);
    return;
  }

  const title = kind === "landscape"
    ? (series.label || "JackLight Tales") + " landscape collection on YouTube"
    : (series.label || "JackLight Tales") + " episode collection on YouTube";

  frame.replaceChildren(makeIframe(title, source));
}

function syncCinemaCopy(root, episodeSelection, landscapeSelection, channelUrl) {
  const episodeTitle = root.querySelector("[data-cinema-episode-title]");
  const episodeCopy = root.querySelector("[data-cinema-episode-copy]");
  const episodeLink = root.querySelector("[data-cinema-episode-link]");

  if (episodeSelection) {
    const { series, source } = episodeSelection;
    if (episodeTitle) episodeTitle.textContent = series.title || series.label || "Barnaby and the Whispering Woods";
    if (episodeCopy) {
      episodeCopy.textContent = source.nowShowing || ((series.label || "Latest series") + " · newest episode first");
    }
    setLink(episodeLink, watchUrl(source, channelUrl), "Open episode collection");
  }

  const landscapeTitle = root.querySelector("[data-cinema-landscape-title]");
  const landscapeCopy = root.querySelector("[data-cinema-landscape-copy]");
  const landscapeLink = root.querySelector("[data-cinema-landscape-link]");

  if (landscapeSelection) {
    const { series, source } = landscapeSelection;
    if (landscapeTitle) landscapeTitle.textContent = (series.label || "Latest") + " · complete adventure";
    if (landscapeCopy) {
      landscapeCopy.textContent = source.nowShowing || "The newest complete landscape collection.";
    }
    setLink(landscapeLink, watchUrl(source, channelUrl), "Open landscape adventure");
  }
}

function wireCollectionLinks(root, config, channelUrl) {
  root.querySelectorAll("[data-cinema-collection]").forEach((link) => {
    const [seriesName, modeName] = (link.dataset.cinemaCollection || "").split(":");
    const source = config.series?.[seriesName]?.modes?.[modeName];

    if (!source || source.available === false || !hasSource(source)) {
      link.hidden = true;
      return;
    }

    link.href = watchUrl(source, channelUrl);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.hidden = false;
  });
}

export function initYouTube(config = {}) {
  const channelUrl = config.channelUrl || (config.channelId
    ? "https://www.youtube.com/channel/" + encodeURIComponent(config.channelId)
    : "");

  function wire(root) {
    setLink(root.querySelector("[data-youtube-channel]"), channelUrl, "Visit YouTube");

    const episodeSelection = pickEpisode(config);
    const landscapeSelection = pickLandscape(config);

    renderSource(
      root.querySelector("[data-cinema-episode-player]"),
      episodeSelection,
      "The latest episode is being connected to the cinema.",
      "episode",
    );

    renderSource(
      root.querySelector("[data-cinema-landscape-player]"),
      landscapeSelection,
      "The next complete landscape adventure will appear here.",
      "landscape",
    );

    syncCinemaCopy(root, episodeSelection, landscapeSelection, channelUrl);
    wireCollectionLinks(root, config, channelUrl);
  }

  document.addEventListener("jacklight:panel-opened", (event) => {
    if (event.detail.panelName === "watch") wire(event.detail.content);
  });
}
