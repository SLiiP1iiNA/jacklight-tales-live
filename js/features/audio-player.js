const catalogCache = new Map();
const knownAudio = new Set();

function makeElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function loadCatalog(path) {
  if (!catalogCache.has(path)) {
    catalogCache.set(path, fetch(path, { cache: "no-store" }).then((response) => {
      if (!response.ok) {
        throw new Error(`Could not load ${path}`);
      }
      return response.json();
    }));
  }
  return catalogCache.get(path);
}

function audioUrl(catalog, series, episodeNumber) {
  if (series.audioOverrides?.[episodeNumber]) {
    return series.audioOverrides[episodeNumber];
  }
  const padding = Number(catalog.numberPadding) || 3;
  const episode = String(episodeNumber).padStart(padding, "0");
  const filename = (catalog.filenameRule || "episode-{episode}.mp3").replace("{episode}", episode);
  return `${series.folder.replace(/\/$/, "")}/${filename}`;
}

async function audioExists(url, force = false) {
  if (!force && knownAudio.has(url)) {
    return true;
  }

  try {
    let response = await fetch(url, { method: "HEAD", cache: "no-store" });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: "GET",
        headers: { Range: "bytes=0-0" },
        cache: "no-store",
      });
    }
    if (response.ok || response.status === 206) {
      knownAudio.add(url);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

async function runWithLimit(items, limit, task) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await task(items[index], index);
    }
  });
  await Promise.all(workers);
}

function createSeriesButton(series) {
  const button = makeElement("button", "audiobook-series__button");
  button.type = "button";
  button.dataset.audioSeries = series.id;
  button.setAttribute("aria-pressed", "false");
  button.append(makeElement("span", "audiobook-series__number", `Series ${series.number}`));
  button.append(makeElement("strong", "", series.title));
  button.append(makeElement("small", "", `Episodes ${String(series.startEpisode).padStart(2, "0")}–${series.startEpisode + series.episodeCount - 1}`));
  return button;
}

function createEpisodeButton(episodeNumber) {
  const button = makeElement("button", "audiobook-episode is-checking");
  button.type = "button";
  button.disabled = true;
  button.dataset.audioEpisode = String(episodeNumber);
  button.append(makeElement("span", "audiobook-episode__number", String(episodeNumber).padStart(3, "0")));
  const copy = makeElement("span", "audiobook-episode__copy");
  copy.append(makeElement("strong", "", `Episode ${episodeNumber}`));
  copy.append(makeElement("small", "audiobook-episode__state", "Checking for audio…"));
  button.append(copy, makeElement("span", "audiobook-episode__play", "▶"));
  return button;
}

function updateNavigation(state) {
  const readyIndexes = state.tracks
    .map((track, index) => (track.available ? index : -1))
    .filter((index) => index >= 0);
  const position = readyIndexes.indexOf(state.activeIndex);
  state.previousButton.disabled = position <= 0;
  state.nextButton.disabled = position < 0 || position >= readyIndexes.length - 1;
}

async function playTrack(state, trackIndex) {
  const track = state.tracks[trackIndex];
  if (!track?.available) {
    return;
  }

  state.activeIndex = trackIndex;
  state.episodeList.querySelectorAll(".audiobook-episode.is-active").forEach((button) => button.classList.remove("is-active"));
  track.button.classList.add("is-active");
  state.title.textContent = `Episode ${track.episodeNumber}`;
  state.subtitle.textContent = `${state.series.title} · Series ${state.series.number}`;
  state.status.textContent = "Ready to play";
  state.audio.src = track.url;
  state.audio.load();
  updateNavigation(state);

  try {
    await state.audio.play();
    state.status.textContent = "Now playing";
  } catch {
    state.status.textContent = "Press play to begin";
  }
}

function moveTrack(state, direction) {
  const readyIndexes = state.tracks
    .map((track, index) => (track.available ? index : -1))
    .filter((index) => index >= 0);
  const position = readyIndexes.indexOf(state.activeIndex);
  const target = readyIndexes[position + direction];
  if (target !== undefined) {
    playTrack(state, target);
  }
}

async function loadSeries(catalog, series, state, { force = false } = {}) {
  state.checkToken += 1;
  const token = state.checkToken;
  state.series = series;
  state.activeIndex = -1;
  state.audio.pause();
  state.audio.removeAttribute("src");
  state.audio.load();
  state.title.textContent = series.title;
  state.subtitle.textContent = series.description;
  state.status.textContent = "Checking this shelf";
  state.cover.src = series.cover;
  state.cover.alt = `Barnaby Series ${series.number} audiobook cover`;
  state.seriesLabel.textContent = `Series ${series.number}`;
  state.shelfTitle.textContent = `${series.title} episodes`;
  state.previousButton.disabled = true;
  state.nextButton.disabled = true;

  state.seriesList.querySelectorAll("[data-audio-series]").forEach((button) => {
    const selected = button.dataset.audioSeries === series.id;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  const tracks = Array.from({ length: series.episodeCount }, (_, index) => {
    const episodeNumber = series.startEpisode + index;
    return {
      episodeNumber,
      url: audioUrl(catalog, series, episodeNumber),
      available: false,
      button: createEpisodeButton(episodeNumber),
    };
  });
  state.tracks = tracks;
  state.episodeList.replaceChildren(...tracks.map((track) => track.button));
  state.episodeList.setAttribute("aria-busy", "true");
  state.count.textContent = `Checking 0 of ${tracks.length}…`;

  let checked = 0;
  let ready = 0;
  await runWithLimit(tracks, 6, async (track) => {
    // Explicit audio links can play even when the host does not allow fetch checks.
    const available = Boolean(series.audioOverrides?.[track.episodeNumber]) || await audioExists(track.url, force);
    if (token !== state.checkToken) {
      return;
    }
    track.available = available;
    track.button.disabled = !available;
    track.button.classList.remove("is-checking");
    track.button.classList.toggle("is-ready", available);
    track.button.querySelector(".audiobook-episode__state").textContent = available ? "Ready to listen" : "Audio coming later";
    checked += 1;
    ready += available ? 1 : 0;
    state.count.textContent = `Checking ${checked} of ${tracks.length} · ${ready} ready`;
  });

  if (token !== state.checkToken) {
    return;
  }
  state.episodeList.setAttribute("aria-busy", "false");
  state.count.textContent = ready === 0 ? `0 of ${tracks.length} ready — this shelf is waiting for audio` : `${ready} of ${tracks.length} ready to listen`;
  state.status.textContent = ready === 0 ? "This shelf is waiting" : "Choose an available story";
}

async function buildLibrary(root, contentPath) {
  const catalog = await loadCatalog(contentPath);
  const seriesList = root.querySelector("[data-audio-series-list]");
  const episodeList = root.querySelector("[data-audio-episode-list]");
  if (!seriesList || !episodeList || !Array.isArray(catalog.series) || !catalog.series.length) {
    throw new Error("The audiobook catalog is incomplete");
  }

  seriesList.replaceChildren(...catalog.series.map(createSeriesButton));
  const state = {
    seriesList,
    episodeList,
    audio: root.querySelector("[data-audio-element]"),
    cover: root.querySelector("[data-audio-cover]"),
    count: root.querySelector("[data-audio-count]"),
    status: root.querySelector("[data-audio-status]"),
    title: root.querySelector("[data-audio-title]"),
    subtitle: root.querySelector("[data-audio-subtitle]"),
    seriesLabel: root.querySelector("[data-audio-series-label]"),
    shelfTitle: root.querySelector("[data-audio-shelf-title]"),
    previousButton: root.querySelector("[data-audio-previous]"),
    nextButton: root.querySelector("[data-audio-next]"),
    series: catalog.series[0],
    tracks: [],
    activeIndex: -1,
    checkToken: 0,
  };

  root.addEventListener("click", (event) => {
    const seriesButton = event.target.closest("[data-audio-series]");
    const episodeButton = event.target.closest("[data-audio-episode]");
    if (seriesButton) {
      const series = catalog.series.find((item) => item.id === seriesButton.dataset.audioSeries);
      if (series && series.id !== state.series.id) {
        loadSeries(catalog, series, state);
      }
      return;
    }
    if (episodeButton && !episodeButton.disabled) {
      const index = state.tracks.findIndex((track) => track.episodeNumber === Number(episodeButton.dataset.audioEpisode));
      playTrack(state, index);
      return;
    }
    if (event.target.closest("[data-audio-refresh]")) {
      loadSeries(catalog, state.series, state, { force: true });
      return;
    }
    if (event.target.closest("[data-audio-previous]")) {
      moveTrack(state, -1);
    }
    if (event.target.closest("[data-audio-next]")) {
      moveTrack(state, 1);
    }
  });

  state.audio.addEventListener("play", () => { state.status.textContent = "Now playing"; });
  state.audio.addEventListener("pause", () => {
    if (state.audio.currentTime > 0 && !state.audio.ended) {
      state.status.textContent = "Paused";
    }
  });
  state.audio.addEventListener("ended", () => { state.status.textContent = "Story finished"; });
  await loadSeries(catalog, catalog.series[0], state);
}

export function initAudioPlayer(contentPath) {
  document.addEventListener("jacklight:panel-opened", async (event) => {
    if (event.detail.panelName !== "listen") {
      return;
    }

    const root = event.detail.content;
    const library = root.querySelector("[data-audio-library]");
    if (!library || library.dataset.initialised === "true") {
      return;
    }
    library.dataset.initialised = "true";

    try {
      await buildLibrary(library, contentPath);
    } catch (error) {
      console.error("Audiobook library could not be loaded", error);
      library.innerHTML = '<div class="panel-error"><h3>The listening room needs a moment.</h3><p>Start the site with Live Server and check <code>content/audio-library.json</code>.</p></div>';
    }
  });
}
