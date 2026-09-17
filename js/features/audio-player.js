const catalogCache = new Map();
const knownAudio = new Set();

function makeElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function loadCatalog(path) {
  if (!catalogCache.has(path)) {
    catalogCache.set(path, fetch(path, { cache: "no-store" }).then((response) => {
      if (!response.ok) throw new Error(`Could not load ${path}`);
      return response.json();
    }));
  }
  return catalogCache.get(path);
}

function audioUrl(catalog, series, episodeNumber) {
  if (series.audioOverrides?.[episodeNumber]) return series.audioOverrides[episodeNumber];
  const padding = Number(catalog.numberPadding) || 3;
  const episode = String(episodeNumber).padStart(padding, "0");
  const filename = (catalog.filenameRule || "episode-{episode}.mp3").replace("{episode}", episode);
  return `${series.folder.replace(/\/$/, "")}/${filename}`;
}

function episodeTitle(series, episodeNumber) {
  return series.episodeTitles?.[episodeNumber] || `Episode ${episodeNumber}`;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

async function audioExists(url, force = false) {
  if (!force && knownAudio.has(url)) return true;
  try {
    let response = await fetch(url, { method: "HEAD", cache: "no-store" });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, { method: "GET", headers: { Range: "bytes=0-0" }, cache: "no-store" });
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
      const index = cursor++;
      await task(items[index], index);
    }
  });
  await Promise.all(workers);
}

function seriesIsReleased(series) {
  if (typeof series.released === "boolean") return series.released;
  return Boolean(series.audioOverrides && Object.keys(series.audioOverrides).length);
}

function createSeriesButton(series) {
  const released = seriesIsReleased(series);
  const button = makeElement("button", `audiobook-series__button${released ? " is-open" : " is-coming"}`);
  button.type = "button";
  button.dataset.audioSeries = series.id;
  button.disabled = !released;
  button.setAttribute("aria-pressed", "false");
  if (!released) button.setAttribute("aria-label", `Series ${series.number}, ${series.title}, coming later`);
  button.append(makeElement("span", "audiobook-series__number", released ? `Series ${series.number} · Open` : `Series ${series.number}`));
  button.append(makeElement("strong", "", series.title));
  button.append(makeElement("small", "", released ? `${series.episodeCount} stories ready` : "Coming later"));
  return button;
}

function createEpisodeButton(episodeNumber, title) {
  const button = makeElement("button", "audiobook-episode");
  button.type = "button";
  button.disabled = true;
  button.dataset.audioEpisode = String(episodeNumber);
  button.append(makeElement("span", "audiobook-episode__number", String(episodeNumber).padStart(2, "0")));
  const copy = makeElement("span", "audiobook-episode__copy");
  copy.append(makeElement("strong", "", title));
  copy.append(makeElement("small", "audiobook-episode__state", `Story ${String(episodeNumber).padStart(2, "0")} · Getting ready…`));
  const play = makeElement("span", "audiobook-episode__play", "▶");
  play.setAttribute("aria-hidden", "true");
  button.append(copy, play);
  return button;
}

function setButtonsDisabled(buttons, disabled) {
  buttons.forEach((button) => { button.disabled = disabled; });
}

function updateToggleButtons(state) {
  const playing = !state.audio.paused && !state.audio.ended && Boolean(state.audio.src);
  state.toggleButtons.forEach((button) => {
    button.disabled = state.activeIndex < 0;
    button.setAttribute("aria-label", playing ? "Pause story" : "Play story");
    const icon = button.querySelector("[data-audio-toggle-icon]");
    if (icon) icon.textContent = playing ? "❚❚" : "▶";
  });
}

function updateNavigation(state) {
  const readyIndexes = state.tracks.map((track, index) => (track.available ? index : -1)).filter((index) => index >= 0);
  const position = readyIndexes.indexOf(state.activeIndex);
  setButtonsDisabled(state.previousButtons, position <= 0);
  setButtonsDisabled(state.nextButtons, position < 0 || position >= readyIndexes.length - 1);
}

function updateProgress(state) {
  const duration = state.audio.duration;
  const current = state.audio.currentTime;
  const ratio = Number.isFinite(duration) && duration > 0 ? current / duration : 0;
  state.progress.value = String(Math.round(ratio * 1000));
  state.progress.disabled = state.activeIndex < 0 || !Number.isFinite(duration);
  state.currentTime.textContent = formatTime(current);
  state.duration.textContent = formatTime(duration);
}

function updateMediaSession(state, track) {
  if (!("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: "JackLight Tales",
      album: `Barnaby and the Whispering Woods · Series ${state.series.number}`,
      artwork: [{ src: new URL(state.series.cover, window.location.href).href }],
    });
  } catch {
    // Progressive enhancement only.
  }
}

function setActiveCopy(state, track) {
  state.title.textContent = track.title;
  state.subtitle.textContent = `Series ${state.series.number} · Story ${String(track.episodeNumber).padStart(2, "0")} of ${state.series.episodeCount}`;
  state.miniTitle.textContent = track.title;
  state.miniLabel.textContent = `Series ${state.series.number} · Story ${String(track.episodeNumber).padStart(2, "0")}`;
  state.mini.hidden = false;
}

async function playTrack(state, trackIndex) {
  const track = state.tracks[trackIndex];
  if (!track?.available) return;

  state.activeIndex = trackIndex;
  state.episodeList.querySelectorAll(".audiobook-episode.is-active").forEach((button) => button.classList.remove("is-active"));
  track.button.classList.add("is-active");
  setActiveCopy(state, track);
  state.status.textContent = "Ready by the lantern";
  state.audio.src = track.url;
  state.audio.load();
  updateNavigation(state);
  updateToggleButtons(state);
  updateMediaSession(state, track);

  try {
    await state.audio.play();
  } catch {
    state.status.textContent = "Press play when you are ready";
    updateToggleButtons(state);
  }
}

function moveTrack(state, direction) {
  const readyIndexes = state.tracks.map((track, index) => (track.available ? index : -1)).filter((index) => index >= 0);
  const position = readyIndexes.indexOf(state.activeIndex);
  const target = readyIndexes[position + direction];
  if (target !== undefined) playTrack(state, target);
}

async function loadSeries(catalog, series, state, { force = false } = {}) {
  state.checkToken += 1;
  const token = state.checkToken;
  state.series = series;
  state.activeIndex = -1;
  state.audio.pause();
  state.audio.removeAttribute("src");
  state.audio.load();
  state.title.textContent = "Choose a story";
  state.subtitle.textContent = series.description;
  state.status.textContent = "The lantern is ready";
  state.cover.src = series.cover;
  state.cover.alt = `Barnaby Series ${series.number} audiobook cover`;
  state.seriesLabel.textContent = `Series ${series.number}`;
  state.shelfTitle.textContent = `Series ${series.number} stories`;
  state.mini.hidden = true;
  state.progress.value = "0";
  state.progress.disabled = true;
  state.currentTime.textContent = "0:00";
  state.duration.textContent = "0:00";
  setButtonsDisabled(state.previousButtons, true);
  setButtonsDisabled(state.nextButtons, true);
  updateToggleButtons(state);

  state.seriesList.querySelectorAll("[data-audio-series]").forEach((button) => {
    const selected = button.dataset.audioSeries === series.id;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  const tracks = Array.from({ length: series.episodeCount }, (_, index) => {
    const episodeNumber = series.startEpisode + index;
    const title = episodeTitle(series, episodeNumber);
    return { episodeNumber, title, url: audioUrl(catalog, series, episodeNumber), available: false, button: createEpisodeButton(episodeNumber, title) };
  });

  state.tracks = tracks;
  state.episodeList.replaceChildren(...tracks.map((track) => track.button));
  state.episodeList.setAttribute("aria-busy", "true");
  state.count.textContent = "Lighting the story lanterns…";

  let ready = 0;
  await runWithLimit(tracks, 6, async (track) => {
    const available = Boolean(series.audioOverrides?.[track.episodeNumber]) || await audioExists(track.url, force);
    if (token !== state.checkToken) return;
    track.available = available;
    track.button.disabled = !available;
    track.button.classList.toggle("is-ready", available);
    track.button.querySelector(".audiobook-episode__state").textContent = available
      ? `Story ${String(track.episodeNumber).padStart(2, "0")} · Ready to listen`
      : `Story ${String(track.episodeNumber).padStart(2, "0")} · Coming later`;
    ready += available ? 1 : 0;
  });

  if (token !== state.checkToken) return;
  state.episodeList.setAttribute("aria-busy", "false");
  state.count.textContent = ready === series.episodeCount ? `${ready} stories ready` : `${ready} of ${series.episodeCount} stories ready`;
  state.status.textContent = ready ? "Choose a story" : "This shelf is still growing";
}

function wireMediaSession(state) {
  if (!("mediaSession" in navigator)) return;
  const safeHandler = (action, handler) => {
    try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* unsupported action */ }
  };
  safeHandler("play", () => state.audio.play());
  safeHandler("pause", () => state.audio.pause());
  safeHandler("previoustrack", () => moveTrack(state, -1));
  safeHandler("nexttrack", () => moveTrack(state, 1));
}

async function buildLibrary(root, contentPath) {
  const catalog = await loadCatalog(contentPath);
  const experience = root.closest(".listen-experience");
  const seriesList = root.querySelector("[data-audio-series-list]");
  const episodeList = root.querySelector("[data-audio-episode-list]");
  const releasedSeries = Array.isArray(catalog.series) ? catalog.series.filter(seriesIsReleased) : [];
  if (!experience || !seriesList || !episodeList || !releasedSeries.length) throw new Error("The audiobook catalog is incomplete");

  seriesList.replaceChildren(...catalog.series.map(createSeriesButton));

  const state = {
    experience,
    seriesList,
    episodeList,
    audio: experience.querySelector("[data-audio-element]"),
    cover: experience.querySelector("[data-audio-cover]"),
    count: root.querySelector("[data-audio-count]"),
    status: experience.querySelector("[data-audio-status]"),
    title: experience.querySelector("[data-audio-title]"),
    subtitle: experience.querySelector("[data-audio-subtitle]"),
    seriesLabel: root.querySelector("[data-audio-series-label]"),
    shelfTitle: root.querySelector("[data-audio-shelf-title]"),
    previousButtons: [...experience.querySelectorAll("[data-audio-previous]")],
    nextButtons: [...experience.querySelectorAll("[data-audio-next]")],
    toggleButtons: [...experience.querySelectorAll("[data-audio-toggle]")],
    progress: experience.querySelector("[data-audio-progress]"),
    currentTime: experience.querySelector("[data-audio-current-time]"),
    duration: experience.querySelector("[data-audio-duration]"),
    mini: root.querySelector("[data-audio-mini]"),
    miniTitle: root.querySelector("[data-audio-mini-title]"),
    miniLabel: root.querySelector("[data-audio-mini-label]"),
    series: releasedSeries[0],
    tracks: [],
    activeIndex: -1,
    checkToken: 0,
  };

  experience.addEventListener("click", (event) => {
    const seriesButton = event.target.closest("[data-audio-series]");
    const episodeButton = event.target.closest("[data-audio-episode]");
    const toggleButton = event.target.closest("[data-audio-toggle]");

    if (seriesButton && !seriesButton.disabled) {
      const series = catalog.series.find((item) => item.id === seriesButton.dataset.audioSeries);
      if (series && series.id !== state.series.id && seriesIsReleased(series)) loadSeries(catalog, series, state);
      return;
    }
    if (episodeButton && !episodeButton.disabled) {
      const index = state.tracks.findIndex((track) => track.episodeNumber === Number(episodeButton.dataset.audioEpisode));
      playTrack(state, index);
      return;
    }
    if (toggleButton && !toggleButton.disabled) {
      if (state.audio.paused || state.audio.ended) state.audio.play();
      else state.audio.pause();
      return;
    }
    if (event.target.closest("[data-audio-previous]")) {
      moveTrack(state, -1);
      return;
    }
    if (event.target.closest("[data-audio-next]")) moveTrack(state, 1);
  });

  state.progress.addEventListener("input", () => {
    if (Number.isFinite(state.audio.duration)) state.audio.currentTime = (Number(state.progress.value) / 1000) * state.audio.duration;
  });

  state.audio.addEventListener("loadedmetadata", () => updateProgress(state));
  state.audio.addEventListener("durationchange", () => updateProgress(state));
  state.audio.addEventListener("timeupdate", () => updateProgress(state));
  state.audio.addEventListener("play", () => {
    state.status.textContent = "Now playing by lanternlight";
    updateToggleButtons(state);
  });
  state.audio.addEventListener("pause", () => {
    if (state.audio.currentTime > 0 && !state.audio.ended) state.status.textContent = "Paused — your place is saved";
    updateToggleButtons(state);
  });
  state.audio.addEventListener("ended", () => {
    state.status.textContent = "Story finished — the next path is waiting";
    updateToggleButtons(state);
    updateNavigation(state);
  });

  wireMediaSession(state);
  await loadSeries(catalog, releasedSeries[0], state);
}

export function initAudioPlayer(contentPath) {
  document.addEventListener("jacklight:panel-opened", async (event) => {
    if (event.detail.panelName !== "listen") return;
    const root = event.detail.content;
    const library = root.querySelector("[data-audio-library]");
    if (!library || library.dataset.initialised === "true") return;
    library.dataset.initialised = "true";
    try {
      await buildLibrary(library, contentPath);
    } catch (error) {
      console.error("Audiobook library could not be loaded", error);
      library.innerHTML = '<div class="panel-error"><h3>The listening room needs a moment.</h3><p>Something did not load properly. Please close this window and try again.</p></div>';
    }
  });
}
