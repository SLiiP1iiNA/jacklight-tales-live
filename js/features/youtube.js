function makeVideoUrl(source = {}) {
  const query = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });

  if (source.playlistId) {
    query.set("list", source.playlistId);
  }

  // A known released video is deliberately preferred when supplied.
  // This prevents a scheduled/private playlist item from turning the cinema
  // into a "video unavailable" screen while still keeping the playlist attached.
  if (source.videoId) {
    return "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(source.videoId) + "?" + query;
  }

  if (source.playlistId) {
    return "https://www.youtube-nocookie.com/embed/videoseries?" + query;
  }

  return "";
}

function watchUrl(source = {}, channelUrl = "") {
  if (source.videoId) {
    const query = new URLSearchParams({ v: source.videoId });
    if (source.playlistId) query.set("list", source.playlistId);
    return "https://www.youtube.com/watch?" + query;
  }

  if (source.playlistId) {
    return "https://www.youtube.com/playlist?list=" + encodeURIComponent(source.playlistId);
  }

  return channelUrl;
}

function hasStarted(startDate) {
  if (!startDate) return true;
  const value = startDate.includes("T") ? startDate : startDate + "T00:00:00";
  const start = new Date(value);
  return !Number.isNaN(start.valueOf()) && new Date() >= start;
}

function hasSource(source = {}) {
  return Boolean(source.videoId || source.playlistId);
}

function setLink(link, href) {
  if (!link) return;

  if (!href) {
    link.hidden = true;
    link.removeAttribute("href");
    return;
  }

  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.hidden = false;
}

function showPlaceholder(frame, message) {
  if (!frame) return;
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

function makeIframe(title, source) {
  const iframe = document.createElement("iframe");
  iframe.title = title;
  iframe.src = makeVideoUrl(source);
  iframe.loading = "eager";
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  return iframe;
}

function pickEpisode(config = {}) {
  const entries = Object.entries(config.series || {});
  const preferred = entries.find(([name]) => name === config.defaultSeries);

  if (preferred) {
    const source = preferred[1]?.modes?.episodes;
    if (source && source.available !== false && hasSource(source)) {
      return { series: preferred[1], source };
    }
  }

  for (const [, series] of [...entries].reverse()) {
    const source = series?.modes?.episodes;
    if (source && source.available !== false && hasSource(source)) {
      return { series, source };
    }
  }

  return null;
}

function pickLandscape(config = {}) {
  const entries = Object.entries(config.series || {});

  for (const [, series] of [...entries].reverse()) {
    const source = series?.modes?.landscape;
    if (source && source.available !== false && hasSource(source) && hasStarted(source.startDate)) {
      return { series, source };
    }
  }

  return null;
}

function render(frame, selection, fallback, kind) {
  if (!frame || !selection) {
    showPlaceholder(frame, fallback);
    return;
  }

  const src = makeVideoUrl(selection.source);
  if (!src) {
    showPlaceholder(frame, fallback);
    return;
  }

  const title = kind === "landscape"
    ? "Barnaby and the Whispering Woods — latest landscape adventure"
    : "Barnaby and the Whispering Woods — latest episode";

  frame.replaceChildren(makeIframe(title, selection.source));
}

export function initYouTube(config = {}) {
  const channelUrl = config.channelUrl || (config.channelId
    ? "https://www.youtube.com/channel/" + encodeURIComponent(config.channelId)
    : "");

  function wire(root) {
    const episode = pickEpisode(config);
    const landscape = pickLandscape(config);

    setLink(root.querySelector("[data-youtube-channel]"), channelUrl);

    render(
      root.querySelector("[data-cinema-episode-player]"),
      episode,
      "The latest episode is not available yet.",
      "episode",
    );

    render(
      root.querySelector("[data-cinema-landscape-player]"),
      landscape,
      "The latest landscape adventure is not available yet.",
      "landscape",
    );

    setLink(
      root.querySelector("[data-cinema-episode-link]"),
      episode ? watchUrl(episode.source, channelUrl) : channelUrl,
    );

    setLink(
      root.querySelector("[data-cinema-landscape-link]"),
      landscape ? watchUrl(landscape.source, channelUrl) : channelUrl,
    );
  }

  document.addEventListener("jacklight:panel-opened", (event) => {
    if (event.detail.panelName === "watch") {
      wire(event.detail.content);
    }
  });
}
