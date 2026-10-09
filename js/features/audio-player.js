const catalogCache = new Map();
const knownAudio = new Set();
const PLACE_KEY = "jacklight:listening-place-v1";
const AMBIENCE_KEY = "jacklight:audiobook-ambience-v1";

function readStorage(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Listening still works without storage. */ }
}
function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
async function loadCatalog(path, signal) {
  if (catalogCache.has(path)) return catalogCache.get(path);
  const response = await fetch(path, { cache: "no-store", signal });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  const catalog = await response.json();
  if (!signal.aborted) catalogCache.set(path, catalog);
  return catalog;
}
function audioUrl(catalog, series, episodeNumber) {
  if (series.audioOverrides?.[episodeNumber]) return series.audioOverrides[episodeNumber];
  const episode = String(episodeNumber).padStart(Number(catalog.numberPadding) || 3, "0");
  const filename = (catalog.filenameRule || "episode-{episode}.mp3").replace("{episode}", episode);
  return `${series.folder.replace(/\/$/, "")}/${filename}`;
}
function episodeTitle(series, number) { return series.episodeTitles?.[number] || `Episode ${number}`; }
function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}
async function audioExists(url, signal, force = false) {
  if (!force && knownAudio.has(url)) return true;
  try {
    let response = await fetch(url, { method: "HEAD", cache: "no-store", signal });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, { method: "GET", headers: { Range: "bytes=0-0" }, cache: "no-store", signal });
    }
    const available = response.ok || response.status === 206;
    response.body?.cancel().catch(() => {});
    if (available && !signal.aborted) knownAudio.add(url);
    return available && !signal.aborted;
  } catch { return false; }
}
async function runWithLimit(items, limit, task, signal) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length && !signal.aborted) await task(items[cursor++]);
  }));
}
function seriesIsReleased(series) {
  return typeof series.released === "boolean" ? series.released : Boolean(series.audioOverrides && Object.keys(series.audioOverrides).length);
}
function createSeriesButton(series) {
  const released = seriesIsReleased(series);
  const button = makeElement("button", `audiobook-series__button${released ? " is-open" : " is-coming"}`);
  button.type = "button";
  button.dataset.audioSeries = series.id;
  button.disabled = !released;
  button.setAttribute("aria-pressed", "false");
  if (!released) button.setAttribute("aria-label", `Series ${series.number}, ${series.title}, coming soon`);
  button.append(makeElement("span", "audiobook-series__number", `Series ${series.number} · ${released ? "Open" : "Coming soon"}`));
  button.append(makeElement("strong", "", series.title));
  button.append(makeElement("small", "", released ? `${series.episodeCount} stories` : "Available when the collection is ready"));
  return button;
}
function createEpisodeButton(number, title) {
  const button = makeElement("button", "audiobook-episode");
  button.type = "button";
  button.disabled = true;
  button.dataset.audioEpisode = String(number);
  button.append(makeElement("span", "audiobook-episode__number", String(number).padStart(2, "0")));
  const copy = makeElement("span", "audiobook-episode__copy");
  copy.append(makeElement("strong", "", title), makeElement("small", "audiobook-episode__state", "Getting ready…"));
  const icon = makeElement("span", "audiobook-episode__play", "▶");
  icon.setAttribute("aria-hidden", "true");
  button.append(copy, icon);
  return button;
}
function isActive(state) { return !state.disposed && !state.signal.aborted && state.audio.isConnected; }
function readyIndexes(state) { return state.tracks.flatMap((track, index) => track.available ? [index] : []); }
function updateTrackCopy(state, track) {
  const active = state.tracks[state.activeIndex] === track;
  const playing = active && !state.audio.paused && !state.audio.ended;
  const length = Number.isFinite(track.duration) && track.duration > 0 ? ` · ${formatTime(track.duration)}` : "";
  track.button.querySelector(".audiobook-episode__state").textContent = track.available
    ? `${active ? (playing ? "Now playing" : "Selected") : "Ready to listen"}${length}` : "Coming later";
  track.button.classList.toggle("is-active", active);
  if (active) track.button.setAttribute("aria-current", "true");
  else track.button.removeAttribute("aria-current");
}
function updateControls(state) {
  const playing = !state.audio.paused && !state.audio.ended && state.activeIndex >= 0;
  state.toggle.disabled = state.activeIndex < 0;
  state.toggle.setAttribute("aria-label", playing ? "Pause story" : "Play story");
  state.toggle.querySelector("[data-audio-toggle-icon]").textContent = playing ? "❚❚" : "▶";
  const ready = readyIndexes(state), position = ready.indexOf(state.activeIndex);
  state.previous.disabled = position <= 0;
  state.next.disabled = position < 0 || position >= ready.length - 1;
  state.playAll.disabled = !ready.length;
  state.playAll.setAttribute("aria-label", `Play all Series ${state.series.number} stories in order`);
  state.tracks.forEach(track => updateTrackCopy(state, track));
}
function updateProgress(state) {
  const duration = state.audio.duration;
  const current = state.pendingSeek?.seconds ?? state.audio.currentTime;
  const ready = state.activeIndex >= 0 && Number.isFinite(duration) && duration > 0;
  state.progress.value = String(ready ? Math.min(1000, Math.round(current / duration * 1000)) : 0);
  state.progress.disabled = !ready;
  state.currentTime.textContent = formatTime(current);
  state.duration.textContent = ready ? formatTime(duration) : "—";
  state.progress.setAttribute("aria-valuetext", ready ? `${formatTime(current)} of ${formatTime(duration)}` : formatTime(current));
}
function savePlace(state, force = false) {
  if (state.activeIndex < 0 && state.restorePending) return;
  const track = state.tracks[state.activeIndex];
  const seconds = track ? Math.max(0, state.pendingSeek?.seconds ?? (Number.isFinite(state.audio.currentTime) ? state.audio.currentTime : 0)) : 0;
  const signature = `${state.series.id}:${track?.episodeNumber}:${Math.floor(seconds)}:${state.queueMode}:${state.completed}`;
  if (!force && signature === state.lastSaved) return;
  state.lastSaved = signature;
  writeStorage(PLACE_KEY, { seriesId: state.series.id, episodeNumber: track?.episodeNumber ?? null, currentTime: seconds, queueMode: state.queueMode, completed: state.completed });
}
function setMediaMetadata(state, track) {
  if (!("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: "JackLight Tales", album: `Barnaby and the Whispering Woods · Series ${state.series.number}`, artwork: state.series.cover ? [{ src: new URL(state.series.cover, location.href).href }] : [] });
  } catch { /* Progressive enhancement only. */ }
}
function playbackFailure(state) {
  if (!isActive(state)) return;
  state.status.textContent = state.audio.error ? "This story could not load. Press play to try again, or choose another story." : "Press play when you are ready";
  updateControls(state);
}
function applyPendingSeek(state) {
  const pending = state.pendingSeek;
  if (!pending || !Number.isFinite(state.audio.duration) || state.audio.duration <= 0 || state.audio.src !== pending.url) return;
  try {
    state.audio.currentTime = Math.max(0, Math.min(pending.seconds, state.audio.duration - .05));
    state.pendingSeek = null;
  } catch { /* Keep the requested place until metadata is ready. */ }
}
async function playActive(state) {
  if (!isActive(state) || state.activeIndex < 0) return;
  const request = ++state.playToken;
  state.completed = false;
  state.continueButton.hidden = true;
  if (state.audio.error) state.audio.load();
  applyPendingSeek(state);
  savePlace(state, true);
  try { await state.audio.play(); }
  catch { if (request === state.playToken && isActive(state)) playbackFailure(state); }
}
function selectTrack(state, index, { autoplay = true, seconds = 0, queueMode = false } = {}) {
  const track = state.tracks[index];
  if (!isActive(state) || !track?.available) return;
  savePlace(state, true);
  state.playToken += 1;
  state.switching = true;
  state.audio.pause();
  state.activeIndex = index;
  state.queueMode = queueMode;
  state.completed = false;
  state.pendingSeek = seconds > 0 ? { seconds, url: track.url } : null;
  state.title.textContent = track.title;
  state.subtitle.textContent = `Series ${state.series.number} · Story ${index + 1} of ${state.series.episodeCount}${queueMode ? " · Collection order" : ""}`;
  state.status.textContent = autoplay ? "Opening your story…" : "Your place is saved. Continue when you are ready.";
  state.audio.src = track.url;
  state.audio.load();
  state.switching = false;
  state.continueButton.hidden = autoplay;
  state.continueButton.textContent = `Continue Story ${String(track.episodeNumber).padStart(2, "0")} · ${formatTime(seconds)}`;
  updateControls(state);
  updateProgress(state);
  setMediaMetadata(state, track);
  savePlace(state, true);
  if (autoplay) void playActive(state);
}
function moveTrack(state, direction) {
  const ready = readyIndexes(state), position = ready.indexOf(state.activeIndex), target = ready[position + direction];
  if (target !== undefined) selectTrack(state, target, { queueMode: state.queueMode });
}
function keepFocusedControlVisible(state, target) {
  const panel = state.experience.closest(".panel");
  const player = state.experience.querySelector(".listen-player");
  const close = panel?.querySelector("[data-close-panel]");
  if (!panel || !player || !close) return;
  const keyboard = target.matches(":focus-visible");
  const usableHeight = Math.min(window.innerHeight, panel.clientHeight) - close.offsetHeight;
  // Large text can leave too little space below a sticky player for a story row.
  player.classList.toggle("is-focus-unpinned", keyboard && !player.contains(target) && player.offsetHeight > usableHeight / 2);
  if (!keyboard) return;
  requestAnimationFrame(() => {
    if (!isActive(state) || document.activeElement !== target) return;
    const panelBounds = panel.getBoundingClientRect();
    let top = Math.max(panelBounds.top + 8, close.getBoundingClientRect().bottom + 8);
    const bottom = Math.min(window.innerHeight, panelBounds.bottom) - 8;
    if (!player.contains(target) && getComputedStyle(player).position === "sticky" && (state.episodeList.contains(target) || target === state.ambience)) {
      const playerBounds = player.getBoundingClientRect();
      if (playerBounds.top < bottom && playerBounds.bottom <= bottom) top = Math.max(top, playerBounds.bottom + 8);
    }
    const bounds = target.getBoundingClientRect();
    if (bounds.height > bottom - top || bounds.top < top) panel.scrollTop += bounds.top - top;
    else if (bounds.bottom > bottom) panel.scrollTop += bounds.bottom - bottom;
  });
}
async function loadSeries(catalog, series, state, { restore = null, force = false } = {}) {
  state.availabilityController?.abort();
  const checks = new AbortController();
  state.availabilityController = checks;
  const token = ++state.checkToken;
  state.playToken += 1;
  state.switching = true;
  if (state.activeIndex >= 0) savePlace(state, true);
  state.audio.pause();
  state.audio.removeAttribute("src");
  state.audio.load();
  state.series = series;
  state.activeIndex = -1;
  state.queueMode = false;
  state.completed = false;
  state.pendingSeek = null;
  state.restorePending = restore;
  state.title.textContent = "Ready when you are";
  state.subtitle.textContent = series.description;
  state.status.textContent = "Choose a story, or play the collection in order";
  state.seriesLabel.textContent = `Series ${series.number}`;
  state.shelfTitle.textContent = `Series ${series.number} stories`;
  state.continueButton.hidden = true;
  state.experience.querySelectorAll("[data-audio-series]").forEach(button => {
    const selected = button.dataset.audioSeries === series.id;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  state.tracks = Array.from({ length: series.episodeCount }, (_, index) => {
    const episodeNumber = series.startEpisode + index, title = episodeTitle(series, episodeNumber);
    const duration = Number(series.episodeDurations?.[episodeNumber]);
    return { episodeNumber, title, duration: Number.isFinite(duration) && duration > 0 ? duration : null, url: audioUrl(catalog, series, episodeNumber), available: false, button: createEpisodeButton(episodeNumber, title) };
  });
  state.episodeList.replaceChildren(...state.tracks.map(track => track.button));
  state.episodeList.setAttribute("aria-busy", "true");
  state.count.textContent = "Opening the story lanterns…";
  state.switching = false;
  updateControls(state);
  updateProgress(state);
  if (!restore) savePlace(state, true);
  let ready = 0;
  await runWithLimit(state.tracks, 6, async track => {
    if (!isActive(state) || token !== state.checkToken) return;
    const available = Boolean(series.audioOverrides?.[track.episodeNumber]) || await audioExists(track.url, checks.signal, force);
    if (!isActive(state) || token !== state.checkToken || checks.signal.aborted) return;
    track.available = available;
    track.button.disabled = !available;
    track.button.classList.toggle("is-ready", available);
    ready += available ? 1 : 0;
    updateControls(state);
  }, checks.signal);
  if (!isActive(state) || token !== state.checkToken || checks.signal.aborted) return;
  state.episodeList.setAttribute("aria-busy", "false");
  state.count.textContent = ready === series.episodeCount ? `${ready} stories ready` : `${ready} of ${series.episodeCount} stories ready`;
  if (!ready) state.status.textContent = "This shelf is still growing";
  const restoreIndex = restore && !restore.completed ? state.tracks.findIndex(track => track.episodeNumber === restore.episodeNumber && track.available) : -1;
  if (restoreIndex >= 0 && state.activeIndex < 0) selectTrack(state, restoreIndex, { autoplay: false, seconds: Number.isFinite(restore.currentTime) ? Math.max(0, restore.currentTime) : 0, queueMode: restore.queueMode === true });
  state.restorePending = null;
  if (state.activeIndex < 0) savePlace(state, true);
}
function wireMediaSession(state) {
  if (!("mediaSession" in navigator)) return;
  const handler = (action, callback) => { try { navigator.mediaSession.setActionHandler(action, callback); } catch { /* Unsupported action. */ } };
  handler("play", () => void playActive(state));
  handler("pause", () => { state.playToken += 1; state.audio.pause(); });
  handler("previoustrack", () => moveTrack(state, -1));
  handler("nexttrack", () => moveTrack(state, 1));
  state.clearMediaSession = () => {
    ["play", "pause", "previoustrack", "nexttrack"].forEach(action => handler(action, null));
    try { navigator.mediaSession.metadata = null; } catch { /* Unsupported metadata. */ }
  };
}
async function buildLibrary(experience, contentPath, signal, registerPlayer) {
  const catalog = await loadCatalog(contentPath, signal);
  if (signal.aborted || !experience.isConnected) return;
  const released = Array.isArray(catalog.series) ? catalog.series.filter(seriesIsReleased) : [];
  if (!released.length) throw new Error("The audiobook catalog is incomplete");
  const primary = catalog.series.filter((series, index) => index < 2 || seriesIsReleased(series));
  const future = catalog.series.filter(series => !primary.includes(series));
  experience.querySelector("[data-audio-series-list]").replaceChildren(...primary.map(createSeriesButton));
  experience.querySelector("[data-audio-future-series]").replaceChildren(...future.map(createSeriesButton));
  experience.querySelector(".listen-future").hidden = !future.length;
  const q = selector => experience.querySelector(selector);
  const saved = readStorage(PLACE_KEY);
  const initialSeries = released.find(series => series.id === saved?.seriesId) || released[0];
  const state = { experience, signal, audio: q("[data-audio-element]"), episodeList: q("[data-audio-episode-list]"), count: q("[data-audio-count]"), status: q("[data-audio-status]"), title: q("[data-audio-title]"), subtitle: q("[data-audio-subtitle]"), seriesLabel: q("[data-audio-series-label]"), shelfTitle: q("[data-audio-shelf-title]"), previous: q("[data-audio-previous]"), next: q("[data-audio-next]"), toggle: q("[data-audio-toggle]"), playAll: q("[data-audio-play-all]"), continueButton: q("[data-audio-continue]"), progress: q("[data-audio-progress]"), currentTime: q("[data-audio-current-time]"), duration: q("[data-audio-duration]"), ambience: q("[data-audio-ambience]"), series: initialSeries, tracks: [], activeIndex: -1, checkToken: 0, playToken: 0, queueMode: false, completed: false, disposed: false, switching: false, pendingSeek: null, lastSaved: null };
  registerPlayer(() => {
    savePlace(state, true);
    state.disposed = true;
    state.availabilityController?.abort();
    state.checkToken += 1;
    state.playToken += 1;
    state.audio.pause();
    state.audio.removeAttribute("src");
    state.audio.load();
    state.clearMediaSession?.();
  });
  const listen = (target, type, callback) => target.addEventListener(type, callback, { signal });
  state.ambience.checked = readStorage(AMBIENCE_KEY) === true;
  const announceAmbience = () => document.dispatchEvent(new CustomEvent("jacklight:audiobook-ambience", { detail: { enabled: state.ambience.checked } }));
  listen(state.ambience, "change", () => { writeStorage(AMBIENCE_KEY, state.ambience.checked); announceAmbience(); });
  announceAmbience();
  listen(experience, "focusin", event => keepFocusedControlVisible(state, event.target));
  listen(experience, "pointerdown", () => experience.querySelector(".listen-player").classList.remove("is-focus-unpinned"));
  listen(experience, "click", event => {
    if (!isActive(state)) return;
    const seriesButton = event.target.closest("[data-audio-series]");
    if (seriesButton && !seriesButton.disabled) {
      const series = catalog.series.find(item => item.id === seriesButton.dataset.audioSeries);
      if (series && series.id !== state.series.id && seriesIsReleased(series)) void loadSeries(catalog, series, state).catch(error => { if (isActive(state)) { console.error("Collection could not be loaded", error); state.status.textContent = "This collection needs a moment. Please try again."; } });
      return;
    }
    const episode = event.target.closest("[data-audio-episode]");
    if (episode && !episode.disabled) { selectTrack(state, state.tracks.findIndex(track => track.episodeNumber === Number(episode.dataset.audioEpisode))); return; }
    if (event.target.closest("[data-audio-play-all]") && !state.playAll.disabled) { selectTrack(state, readyIndexes(state)[0], { queueMode: true }); return; }
    if (event.target.closest("[data-audio-continue]")) { void playActive(state); return; }
    if (event.target.closest("[data-audio-toggle]") && !state.toggle.disabled) {
      if (state.audio.paused || state.audio.ended) void playActive(state);
      else { state.playToken += 1; state.audio.pause(); }
      return;
    }
    if (event.target.closest("[data-audio-previous]") && !state.previous.disabled) moveTrack(state, -1);
    if (event.target.closest("[data-audio-next]") && !state.next.disabled) moveTrack(state, 1);
  });
  listen(state.progress, "input", () => {
    if (!isActive(state) || !Number.isFinite(state.audio.duration)) return;
    state.pendingSeek = null;
    state.audio.currentTime = Number(state.progress.value) / 1000 * state.audio.duration;
    updateProgress(state);
    savePlace(state, true);
  });
  const metadata = () => {
    if (!isActive(state) || state.activeIndex < 0) return;
    const track = state.tracks[state.activeIndex];
    if (Number.isFinite(state.audio.duration) && state.audio.duration > 0) track.duration = state.audio.duration;
    applyPendingSeek(state);
    updateProgress(state);
    updateTrackCopy(state, track);
  };
  listen(state.audio, "loadedmetadata", metadata);
  listen(state.audio, "durationchange", metadata);
  listen(state.audio, "timeupdate", () => { if (isActive(state) && !state.switching) { updateProgress(state); savePlace(state); } });
  listen(state.audio, "play", () => {
    if (!isActive(state)) return;
    state.status.textContent = state.queueMode ? "Playing the collection in order" : "Now playing by lanternlight";
    state.continueButton.hidden = true;
    updateControls(state);
  });
  listen(state.audio, "pause", () => {
    if (!isActive(state) || state.switching) return;
    if (state.audio.currentTime > 0 && !state.audio.ended && !state.audio.error) state.status.textContent = "Paused — your place is saved";
    updateControls(state);
    savePlace(state, true);
  });
  listen(state.audio, "ended", () => {
    if (!isActive(state) || state.switching || state.activeIndex < 0) return;
    const ready = readyIndexes(state), position = ready.indexOf(state.activeIndex), next = ready[position + 1];
    if (state.queueMode && next !== undefined) { selectTrack(state, next, { queueMode: true }); return; }
    state.status.textContent = state.queueMode ? "Collection finished. Thank you for listening." : "Story finished. Choose another tale when you are ready.";
    state.completed = true;
    state.queueMode = false;
    savePlace(state, true);
    updateControls(state);
  });
  listen(state.audio, "error", () => { if (isActive(state) && state.activeIndex >= 0 && !state.switching) { playbackFailure(state); updateProgress(state); } });
  wireMediaSession(state);
  await loadSeries(catalog, initialSeries, state, { restore: saved?.seriesId === initialSeries.id ? saved : null });
}
export function initAudioPlayer(contentPath) {
  let player = null, generation = 0;
  function stopPlayer() {
    generation += 1;
    player?.dispose?.();
    player?.controller.abort();
    player = null;
  }
  document.addEventListener("jacklight:panel-opening", stopPlayer);
  document.addEventListener("jacklight:panel-closed", stopPlayer);
  document.addEventListener("jacklight:panel-opened", async event => {
    if (event.detail.panelName !== "listen") return;
    const library = event.detail.content.querySelector("[data-audio-library]");
    if (!library || library.dataset.initialised === "true") return;
    library.dataset.initialised = "true";
    const version = ++generation, controller = new AbortController();
    player = { controller, dispose: null };
    try {
      await buildLibrary(library, contentPath, controller.signal, dispose => {
        if (version === generation && !controller.signal.aborted) player.dispose = dispose;
        else dispose();
      });
    } catch (error) {
      if (version !== generation || controller.signal.aborted || !library.isConnected) return;
      console.error("Audiobook library could not be loaded", error);
      const target = library.querySelector("[data-audio-episode-list]") || library;
      target.innerHTML = '<div class="panel-error"><h3>The listening room needs a moment.</h3><p>Something did not load properly. Please close this window and try again.</p></div>';
      target.setAttribute("aria-busy", "false");
      library.querySelector("[data-audio-count]").textContent = "Stories could not load";
      library.querySelector("[data-audio-status]").textContent = "Please close the listening room and try again.";
    }
  });
}
