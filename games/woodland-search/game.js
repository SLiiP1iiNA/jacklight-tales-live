const $ = id => document.getElementById(id);
const { characters, scenes } = window.WOODLAND_SEARCH_DATA;
const SETTINGS = window.WOODLAND_SEARCH_SETTINGS;
const audioLayer = window.jltGameAudio;

let journeyCast = [];
let journeyScenes = [];
let lastJourneyScene = null;
let roundIndex = 0;
let currentScene = null;
let currentCharacter = null;
let currentSpot = null;
let currentSeedSpot = null;
let currentSecretItem = null;
let currentSecretSpot = null;
let found = false;
let seedFoundThisRound = false;
let secretItemFoundThisRound = false;
let mischiefEscapedThisRound = false;
let hintLevel = 0;
let hintTimer = 0;
let hintOfferTimer = 0;
let celebrationTimer = 0;
let statusToastTimer = 0;
let resizeTimer = 0;
let loadToken = 0;
let heartSeeds = new Set();
let secretItems = new Set();
let friendFoundBag = [];
let friendCuePlayed = false;
let lastFriendFoundCue = null;

const FRIEND_FOUND_CUES = ['friendFound', 'friendFound2', 'friendFound3', 'friendFound4', 'friendFound5'];
const NEXT_WANDER_CUES = ['nextLocation', 'nextWander1', 'nextWander2', 'nextWander3'];
let nextWanderBag = [];
let lastNextWanderCue = null;

function refillNextWanderBag() {
  const pool = NEXT_WANDER_CUES.filter(cue => cue !== lastNextWanderCue);
  nextWanderBag = shuffle(pool);
}

function chooseNextWanderCue() {
  if (!nextWanderBag.length) refillNextWanderBag();
  const cue = nextWanderBag.shift();
  lastNextWanderCue = cue;
  return cue;
}

function refillFriendFoundBag() {
  const pool = FRIEND_FOUND_CUES.filter(cue => cue !== lastFriendFoundCue);
  friendFoundBag = shuffle(pool);
}

function chooseFriendFoundCue() {
  if (!friendFoundBag.length) refillFriendFoundBag();
  const cue = friendFoundBag.shift();
  lastFriendFoundCue = cue;
  return cue;
}

let secretFindBag = [];
let lastSecretFindCue = null;
const SECRET_FIND_CUES = ['secretFind1', 'secretFind2', 'secretFind3'];

function refillSecretFindBag() {
  const pool = SECRET_FIND_CUES.filter(cue => cue !== lastSecretFindCue);
  secretFindBag = shuffle(pool);
}

function chooseSecretFindCue() {
  if (!secretFindBag.length) refillSecretFindBag();
  const cue = secretFindBag.shift();
  lastSecretFindCue = cue;
  return cue;
}

function syncPhoneViewportMode() {
  const viewport = window.visualViewport;
  const width = viewport?.width || window.innerWidth || document.documentElement.clientWidth;
  const height = viewport?.height || window.innerHeight || document.documentElement.clientHeight;
  const landscapePhone = width > height && height <= 560 && width <= 1100;
  const portraitPhone = height >= width && width <= 760;
  document.documentElement.classList.toggle('phone-landscape-mode', landscapePhone);
  document.documentElement.classList.toggle('phone-portrait-mode', portraitPhone);
}

syncPhoneViewportMode();

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildJourneyCast() {
  const barnaby = characters.find(item => item.name === 'Barnaby');
  const others = shuffle(characters.filter(item => item !== barnaby));
  journeyCast = [barnaby, ...others].slice(0, SETTINGS.roundsPerJourney);
}

function buildJourneyScenes() {
  const shuffled = shuffle(scenes);
  if (shuffled.length > 1 && lastJourneyScene) {
    const differentIndex = shuffled.findIndex(scene => scene.name !== lastJourneyScene);
    if (differentIndex > 0) {
      [shuffled[0], shuffled[differentIndex]] = [shuffled[differentIndex], shuffled[0]];
    }
  }
  journeyScenes = shuffled.slice(0, SETTINGS.roundsPerJourney);
  lastJourneyScene = journeyScenes[0]?.name || null;
}

function clearTimers() {
  clearTimeout(hintTimer);
  clearTimeout(hintOfferTimer);
  clearTimeout(celebrationTimer);
  clearTimeout(statusToastTimer);
  $('status')?.classList.remove('is-visible');
}

function showStatusToast(duration = 3200) {
  const status = $('status');
  clearTimeout(statusToastTimer);
  status.classList.add('is-visible');
  statusToastTimer = setTimeout(() => status.classList.remove('is-visible'), duration);
}

function saveSoundPreference(enabled) {
  try { localStorage.setItem(SETTINGS.soundKey, enabled ? '1' : '0'); } catch {}
}

function loadSoundPreference() {
  try { return localStorage.getItem(SETTINGS.soundKey) !== '0'; } catch { return true; }
}

function setSound(enabled) {
  audioLayer?.setEnabled?.(enabled);
  window.jltWoodlandGameMusic?.setEnabled?.(enabled);
  if (enabled && document.body.classList.contains('game-active')) {
    window.jltWoodlandGameMusic?.start?.();
  }
  $('sound').setAttribute('aria-pressed', String(enabled));
  $('sound').textContent = enabled ? '♫ Sound on' : '♫ Sound off';
  saveSoundPreference(enabled);
}

function playCue(name, options) {
  return audioLayer?.play?.(name, options);
}

function chooseSpot(scene) {
  return scene.spots[Math.floor(Math.random() * scene.spots.length)];
}

function chooseSeedSpot(scene, targetSpot) {
  const sorted = shuffle(scene.seedSpots || []);
  return sorted.find(spot => {
    const dx = spot.x - targetSpot.x;
    const dy = spot.y - targetSpot.y;
    return Math.hypot(dx, dy) > 16;
  }) || sorted[0] || { x: 50, y: 50 };
}

function chooseSecretSpot(scene, targetSpot, seedSpot) {
  const sorted = shuffle(scene.secretItem?.spots || []);
  return sorted.find(spot => {
    if (targetSpot && Math.hypot(spot.x - targetSpot.x, spot.y - targetSpot.y) <= 12) return false;
    if (seedSpot && Math.hypot(spot.x - seedSpot.x, spot.y - seedSpot.y) <= 10) return false;
    return true;
  }) || sorted[0] || { x: 50, y: 50 };
}

function scenePixelPoint(point) {
  const scene = $('scene');
  const image = $('woods');
  const rect = scene.getBoundingClientRect();
  const sourceW = image.naturalWidth || 1672;
  const sourceH = image.naturalHeight || 941;
  if (!rect.width || !rect.height) return { left: rect.width / 2, top: rect.height / 2 };

  const fit = getComputedStyle(image).objectFit || 'cover';
  const scale = fit === 'contain'
    ? Math.min(rect.width / sourceW, rect.height / sourceH)
    : Math.max(rect.width / sourceW, rect.height / sourceH);

  const renderedW = sourceW * scale;
  const renderedH = sourceH * scale;
  const offsetX = (rect.width - renderedW) / 2;
  const offsetY = (rect.height - renderedH) / 2;

  return {
    left: offsetX + (point.x / 100) * renderedW,
    top: offsetY + (point.y / 100) * renderedH
  };
}

function mapPointToScene(point, element) {
  if (!point || !element) return;
  const pixel = scenePixelPoint(point);
  element.style.left = pixel.left + 'px';
  element.style.top = pixel.top + 'px';
}

function clampToScene(element, pad = SETTINGS.targetEdgePadding ?? 8) {
  if (element.hidden) return;
  const sceneRect = $('scene').getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  if (!sceneRect.width || !sceneRect.height || !rect.width || !rect.height) return;

  let dx = 0;
  let dy = 0;
  if (rect.left < sceneRect.left + pad) dx = (sceneRect.left + pad) - rect.left;
  if (rect.right > sceneRect.right - pad) dx = (sceneRect.right - pad) - rect.right;
  if (rect.top < sceneRect.top + pad) dy = (sceneRect.top + pad) - rect.top;
  if (rect.bottom > sceneRect.bottom - pad) dy = (sceneRect.bottom - pad) - rect.bottom;

  if (dx || dy) {
    element.style.left = (element.offsetLeft + dx) + 'px';
    element.style.top = (element.offsetTop + dy) + 'px';
  }
}

function objectsOverlap(first, second, gap = 10) {
  if (!first || !second || first.hidden || second.hidden) return false;
  const a = first.getBoundingClientRect();
  const b = second.getBoundingClientRect();
  if (!a.width || !a.height || !b.width || !b.height) return false;

  return (
    a.left < b.right + gap &&
    a.right > b.left - gap &&
    a.top < b.bottom + gap &&
    a.bottom > b.top - gap
  );
}

function placeObjectAtPoint(element, point, pad = 6) {
  mapPointToScene(point, element);
  clampToScene(element, pad);
}

function randomFallbackSpots(count = 32) {
  return Array.from({ length: count }, () => ({
    x: 10 + Math.random() * 80,
    y: 14 + Math.random() * 72
  }));
}

function findSafeObjectSpot(element, candidates, blockers, pad = 10) {
  const unique = [];
  const seen = new Set();

  [...candidates, ...randomFallbackSpots()].forEach(point => {
    if (!point) return;
    const key = Math.round(point.x * 10) + ':' + Math.round(point.y * 10);
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(point);
  });

  for (const point of unique) {
    placeObjectAtPoint(element, point, pad);
    if (!blockers.some(blocker => objectsOverlap(element, blocker, pad))) {
      return point;
    }
  }

  return candidates[0] || { x: 50, y: 50 };
}

function getPhoneLandscapeBlockers() {
  if (!document.documentElement.classList.contains('phone-landscape-mode')) return [];
  return [
    document.querySelector('.game-actions'),
    $('continue-path')
  ].filter(Boolean);
}

function resolveObjectOverlaps() {
  const pip = $('pip');
  const seed = $('heart-seed');
  const secret = $('secret-item');
  const landscapeBlockers = getPhoneLandscapeBlockers();

  if (!pip.hidden) {
    placeObjectAtPoint(pip, currentSpot, 8);

    if (landscapeBlockers.some(blocker => objectsOverlap(pip, blocker, 8))) {
      currentSpot = findSafeObjectSpot(
        pip,
        shuffle(currentScene.spots || []),
        landscapeBlockers,
        8
      );
    }
  }

  if (!seed.hidden) {
    const seedCandidates = [
      currentSeedSpot,
      ...shuffle(currentScene.seedSpots || [])
    ];
    currentSeedSpot = findSafeObjectSpot(
      seed,
      seedCandidates,
      [pip, ...landscapeBlockers],
      8
    );
  }

  if (!secret.hidden) {
    const secretCandidates = [
      currentSecretSpot,
      ...shuffle(currentScene.secretItem?.spots || [])
    ];
    currentSecretSpot = findSafeObjectSpot(
      secret,
      secretCandidates,
      [pip, seed, ...landscapeBlockers],
      8
    );
  }

  if (!seed.hidden && (
    objectsOverlap(seed, pip, 8) ||
    landscapeBlockers.some(blocker => objectsOverlap(seed, blocker, 8))
  )) {
    currentSeedSpot = findSafeObjectSpot(
      seed,
      shuffle(currentScene.seedSpots || []),
      [pip, secret, ...landscapeBlockers],
      8
    );
  }

  if (!secret.hidden && (
    objectsOverlap(secret, pip, 8) ||
    objectsOverlap(secret, seed, 8) ||
    landscapeBlockers.some(blocker => objectsOverlap(secret, blocker, 8))
  )) {
    currentSecretSpot = findSafeObjectSpot(
      secret,
      shuffle(currentScene.secretItem?.spots || []),
      [pip, seed, ...landscapeBlockers],
      8
    );
  }
}

function positionObjects() {
  if (currentSpot && !$('pip').hidden) {
    mapPointToScene(currentSpot, $('pip'));
  }
  if (currentSeedSpot && !$('heart-seed').hidden) {
    mapPointToScene(currentSeedSpot, $('heart-seed'));
  }
  if (currentSecretSpot && !$('secret-item').hidden) {
    mapPointToScene(currentSecretSpot, $('secret-item'));
  }

  resolveObjectOverlaps();
}

function isRoundComplete() {
  return found && seedFoundThisRound && secretItemFoundThisRound;
}

function getHintTarget() {
  if (!found) return 'character';
  if (!seedFoundThisRound) return 'seed';
  if (!secretItemFoundThisRound) return 'secret';
  return null;
}

function describePoint(point) {
  if (!point) return 'Look carefully through the woodland scene.';
  const horizontal = point.x < 34 ? 'left' : point.x > 66 ? 'right' : 'middle';
  const vertical = point.y < 40 ? 'upper' : point.y > 65 ? 'lower' : 'middle';
  if (horizontal === 'middle' && vertical === 'middle') return 'Look around the middle of the woodland scene.';
  if (horizontal === 'middle') return 'Look in the ' + vertical + ' middle of the woodland scene.';
  if (vertical === 'middle') return 'Look around the middle-' + horizontal + ' part of the woodland scene.';
  return 'Look in the ' + vertical + '-' + horizontal + ' part of the woodland scene.';
}

function updateRoundObjective() {
  if (!currentScene || !currentCharacter) return;

  if (!found) {
    $('target-title').textContent = 'Find ' + currentCharacter.name;
    $('mission-line').textContent = (currentScene.intro + ' ' + (currentCharacter.clue || '')).trim();
    return;
  }

  if (!seedFoundThisRound) {
    $('target-title').textContent = 'Find the Heart Seed';
    $('mission-line').textContent = 'Wonderful! Now find the glowing Heart Seed hidden on this path.';
    return;
  }

  if (!secretItemFoundThisRound && currentSecretItem) {
    $('target-title').textContent = 'Find the secret';
    $('mission-line').textContent = 'One little ' + currentSecretItem.name.toLowerCase() + ' is still hiding somewhere nearby.';
    return;
  }

  $('target-title').textContent = 'Path complete';
  $('mission-line').textContent = 'All three little discoveries are safe. ✦';
}

function clearHintVisuals() {
  $('pip').classList.remove('hinted');
  $('heart-seed').classList.remove('hinted');
  $('secret-item').classList.remove('hinted');
}

function resetHintState() {
  clearTimeout(hintTimer);
  clearTimeout(hintOfferTimer);
  clearHintVisuals();
  hintLevel = 0;
  $('hint').classList.remove('is-offering');
  $('hint').textContent = 'A little hint';
  $('hint').disabled = isRoundComplete();
}

function offerHintLater() {
  clearTimeout(hintOfferTimer);
  hintOfferTimer = setTimeout(() => {
    if (isRoundComplete() || hintLevel > 0) return;
    $('hint').classList.add('is-offering');
    $('hint').textContent = found ? 'Need help finding the next little thing?' : 'Need a little hint?';
  }, SETTINGS.hintOfferMs);
}

function maybePlaceSecretItem() {
  const sceneItem = currentScene.secretItem;
  if (!sceneItem) {
    currentSecretItem = null;
    currentSecretSpot = null;
    $('secret-item').hidden = true;
    return;
  }

  currentSecretItem = sceneItem;
  currentSecretSpot = chooseSecretSpot(currentScene, currentSpot, currentSeedSpot);
  const secretButton = $('secret-item');
  secretButton.disabled = false;
  secretButton.classList.remove('collected');
  const image = secretButton.querySelector('img');
  image.src = 'assets/' + sceneItem.image;
  image.alt = '';
  $('secret-item').setAttribute('aria-label', 'Hidden secret: ' + sceneItem.name);
  $('secret-item').dataset.secretId = sceneItem.id || '';
  $('secret-item').hidden = false;
}

async function applySceneVisual(scene) {
  const root = $('scene');
  root.dataset.sceneVariant = scene?.visualVariant || 'default';
  root.dataset.sceneName = scene?.name || '';
}

async function loadRound() {
  clearTimers();
  found = false;
  friendCuePlayed = false;
  seedFoundThisRound = heartSeeds.has(roundIndex);
  secretItemFoundThisRound = false;
  mischiefEscapedThisRound = false;
  currentSecretItem = null;
  currentSecretSpot = null;
  hintLevel = 0;
  const token = ++loadToken;

  currentScene = journeyScenes[roundIndex];
  currentCharacter = journeyCast[roundIndex];
  applySceneVisual(currentScene);
  currentSpot = chooseSpot(currentScene);
  currentSeedSpot = chooseSeedSpot(currentScene, currentSpot);

  $('success').hidden = true;
  $('pip').style.transition = '';
  $('pip').hidden = true;
  $('heart-seed').hidden = true;
  $('secret-item').hidden = true;
  $('hint').disabled = true;
  $('hint').classList.remove('is-offering');
  $('hint').textContent = 'A little hint';
  clearHintVisuals();
  $('finish').hidden = true;

  $('path-number').textContent = 'Path ' + (roundIndex + 1) + ' of ' + SETTINGS.roundsPerJourney;
  $('place-name').textContent = currentScene.name;
  $('target-title').textContent = 'Find ' + currentCharacter.name;
  $('mission-line').textContent = (currentScene.intro + ' ' + (currentCharacter.clue || '')).trim();
  $('reference').src = 'assets/' + currentCharacter.image;
  $('reference').alt = currentCharacter.name;
  $('pip').querySelector('img').src = 'assets/' + currentCharacter.image;
  $('pip').setAttribute('aria-label', 'Find ' + currentCharacter.name);
  $('woods').alt = currentScene.name;
  $('status').textContent = 'Opening the next woodland path…';

  renderRoute();
  updateSeedMeter();
  maybePlaceSecretItem();

  $('stage').classList.add('scene-changing');

  const rawSceneImage = currentScene.image || '';
  const sceneImageCandidates = [
    new URL(rawSceneImage, document.baseURI).href,
    new URL('/games/woodland-search/' + rawSceneImage.replace(/^\.\//, ''), window.location.origin).href
  ].filter((value, index, values) => value && values.indexOf(value) === index);

  const image = $('woods');
  let sceneLoaded = false;

  for (const src of sceneImageCandidates) {
    image.src = src;

    try {
      await image.decode();
      sceneLoaded = true;
      break;
    } catch {
      if (image.complete && image.naturalWidth > 0) {
        sceneLoaded = true;
        break;
      }
    }
  }

  try {
    if (!sceneLoaded) throw new Error('Woodland scene image could not be loaded.');

    await Promise.all([
      $('pip').querySelector('img').decode().catch(() => {}),
      $('secret-item').querySelector('img').decode().catch(() => {})
    ]);
  } catch {
    if (token === loadToken) {
      $('status').textContent = 'This woodland picture could not open. Try leaving and starting again.';
      showStatusToast(5200);
      $('stage').classList.remove('scene-changing');
    }
    return;
  }

  if (token !== loadToken) return;

  $('pip').className = '';
  $('pip').hidden = false;
  $('pip').disabled = false;

  if (!seedFoundThisRound) {
    $('heart-seed').className = '';
    $('heart-seed').hidden = false;
    $('heart-seed').disabled = false;
  }

  positionObjects();
  $('hint').disabled = false;
  updateRoundObjective();
  resetHintState();
  $('status').textContent = 'Can you spot ' + currentCharacter.name + '? Take your time.';

  requestAnimationFrame(() => $('stage').classList.remove('scene-changing'));
  offerHintLater();
}

function startJourney() {
  clearTimers();
  buildJourneyCast();
  buildJourneyScenes();
  roundIndex = 0;
  heartSeeds = new Set();
  secretItems = new Set();
  secretFindBag = [];
  lastSecretFindCue = null;
  $('welcome').hidden = true;
  $('game').hidden = false;
  document.body.classList.add('game-active');
  lockGame(false);
  updateSeedMeter();
  loadRound();
}

function leaveJourney() {
  clearTimers();
  window.jltWoodlandGameMusic?.stop?.();
  ++loadToken;
  playCue('goodbye', { volume: 0.8 });
  document.body.classList.remove('game-active');
  $('game').hidden = true;
  $('welcome').hidden = false;
  $('success').hidden = true;
  $('pip').hidden = true;
  $('heart-seed').hidden = true;
  $('secret-item').hidden = true;
  $('finish').hidden = true;

  // Safari can retain the landscape viewport metrics for a moment while the
  // game screen is being hidden. Re-sync after returning to the welcome screen
  // so the phone-landscape layout is applied to the newly visible content.
  syncPhoneViewportMode();
  requestAnimationFrame(() => {
    syncPhoneViewportMode();
    window.dispatchEvent(new Event('resize'));
  });
  window.setTimeout(syncPhoneViewportMode, 120);

  $('play').focus({ preventScroll: true });
}

function updateSeedMeter() {
  const collected = Math.min(SETTINGS.roundsPerJourney, heartSeeds.size);
  $('seed-count').textContent = collected + ' / ' + SETTINGS.roundsPerJourney;
  document.querySelector('.seed-meter')?.setAttribute('aria-label', collected + ' of ' + SETTINGS.roundsPerJourney + ' hidden Heart Seeds found');
  updateSecretMeter();
}

function updateSecretMeter() {
  const collected = Math.min(SETTINGS.roundsPerJourney, secretItems.size);
  $('secret-count').textContent = collected + ' / ' + SETTINGS.roundsPerJourney;
  $('secret-meter')?.setAttribute('aria-label', collected + ' of ' + SETTINGS.roundsPerJourney + ' hidden woodland secrets found');
}

function renderRoute(target = $('route-strip')) {
  target.replaceChildren();
  const routeScenes = journeyScenes.length ? journeyScenes : scenes;
  routeScenes.slice(0, SETTINGS.roundsPerJourney).forEach((scene, index) => {
    const item = document.createElement('div');
    item.className = 'route-node';
    item.title = 'Path ' + (index + 1) + ': ' + scene.name;
    item.setAttribute('aria-label', item.title);
    if (index < roundIndex || (isRoundComplete() && index === roundIndex)) item.classList.add('is-complete');
    if (!isRoundComplete() && index === roundIndex) item.classList.add('is-current');

    const dot = document.createElement('span');
    dot.textContent = index < roundIndex || (isRoundComplete() && index === roundIndex) ? '✓' : String(index + 1);
    const label = document.createElement('strong');
    label.textContent = scene.shortName;

    item.append(dot, label);
    target.append(item);
  });
}

function renderResultRoute() {
  const target = $('result-route');
  target.replaceChildren();
  const routeScenes = journeyScenes.length ? journeyScenes : scenes;
  routeScenes.slice(0, SETTINGS.roundsPerJourney).forEach((scene, index) => {
    const dot = document.createElement('span');
    dot.className = index <= roundIndex ? 'is-lit' : '';
    dot.title = scene.name;
    dot.textContent = index <= roundIndex ? '✦' : '·';
    target.append(dot);
  });
}

function lockGame(locked) {
  $('viewport').inert = locked;
  $('hint').disabled = locked || isRoundComplete();
  $('sound').disabled = false;
  $('leave').disabled = false;
}

function startMischiefRun() {
  if (!currentCharacter?.mischief || mischiefEscapedThisRound || found) return false;
  const token = loadToken;

  const candidates = shuffle(currentScene.spots.filter(spot => {
    if (Math.hypot(spot.x - currentSpot.x, spot.y - currentSpot.y) <= 28) return false;
    const pixel = scenePixelPoint(spot);
    const seedPixel = currentSeedSpot ? scenePixelPoint(currentSeedSpot) : null;
    const secretPixel = currentSecretSpot ? scenePixelPoint(currentSecretSpot) : null;
    const farFromSeed = !seedPixel || Math.hypot(pixel.left - seedPixel.left, pixel.top - seedPixel.top) > 70;
    const farFromSecret = !secretPixel || Math.hypot(pixel.left - secretPixel.left, pixel.top - secretPixel.top) > 70;
    return farFromSeed && farFromSecret;
  }));
  const landscapeBlockers = getPhoneLandscapeBlockers();
  const pip = $('pip');
  const originalLeft = pip.style.left;
  const originalTop = pip.style.top;
  // Check the rendered bounds after cropping and clamping: distant image
  // coordinates can still collapse onto the same edge on a portrait phone.
  const nextSpot = findSafeObjectSpot(
    pip,
    [...candidates, ...shuffle(currentScene.spots || [])],
    [$('heart-seed'), $('secret-item'), ...landscapeBlockers],
    8
  );
  currentSpot = nextSpot;
  const nextLeft = pip.offsetLeft;
  const nextTop = pip.offsetTop;
  pip.style.left = originalLeft;
  pip.style.top = originalTop;

  mischiefEscapedThisRound = true;
  $('pip').classList.add('mischief-running');
  $('hint').disabled = true;
  $('status').textContent = currentCharacter.name + ' is scampering away! Quick — catch them!';
  showStatusToast(2200);

  requestAnimationFrame(() => {
    if (token !== loadToken) return;
    $('pip').style.transition = 'left 720ms cubic-bezier(.2,.8,.25,1), top 720ms cubic-bezier(.2,.8,.25,1)';
    $('pip').style.left = nextLeft + 'px';
    $('pip').style.top = nextTop + 'px';
  });

  window.setTimeout(() => {
    if (token !== loadToken) return;
    $('pip').style.transition = '';
    $('pip').classList.remove('mischief-running');
    if (!found) $('hint').disabled = false;
  }, 760);

  return true;
}

function playFriendFoundCue() {
  if (friendCuePlayed) return;
  friendCuePlayed = true;
  const foundCue = currentCharacter.name === 'Barnaby' ? 'barnabyFound' : chooseFriendFoundCue();
  playCue(foundCue, { interrupt: true, volume: 0.9 });
}

async function unlockCelebrationControls() {
  const token = loadToken;
  const minimum = new Promise(resolve => setTimeout(resolve, SETTINGS.celebrationMinMs));
  await Promise.all([
    audioLayer?.waitForIdle?.() || Promise.resolve(),
    minimum
  ]);
  if (token !== loadToken || $('success').hidden) return;
  $('continue-path').disabled = false;
  $('continue-path').focus({ preventScroll: true });
}

function showCelebration({ seedJustFound = false } = {}) {
  if (!isRoundComplete() || !$('success').hidden || !document.body.classList.contains('game-active')) return;
  clearTimeout(hintOfferTimer);
  clearTimeout(hintTimer);

  $('pip').classList.add('found');
  $('pip').disabled = true;
  $('hint').disabled = true;
  $('found-portrait').src = 'assets/' + currentCharacter.image;
  $('found-portrait').alt = currentCharacter.name;
  $('win-title').textContent = 'You found ' + currentCharacter.name + '!';
  $('celebration-copy').textContent = currentCharacter.foundLine;
  $('seed-result').hidden = !heartSeeds.has(roundIndex);
  $('secret-result').hidden = !secretItemFoundThisRound;
  if (secretItemFoundThisRound && currentSecretItem) {
    $('secret-result-image').src = 'assets/' + currentSecretItem.image;
    $('secret-result-image').alt = '';
    $('secret-result-name').textContent = currentSecretItem.name;
  }
  $('success').hidden = false;
  renderRoute();
  renderResultRoute();
  lockGame(true);
  document.querySelector('.celebration').focus({ preventScroll: true });

  const finalRound = roundIndex === SETTINGS.roundsPerJourney - 1;
  $('finish').hidden = !finalRound;

  if (finalRound) {
    $('found-kicker').textContent = 'Every path is glowing!';
    $('next-label').textContent =
      '10 paths explored. You found ' + heartSeeds.size + ' of 10 Heart Seeds and ' + secretItems.size + ' of 10 woodland secrets.';
    $('continue-path').textContent = 'Where shall we wander? ↻';
    $('continue-path').dataset.action = 'restart';

    if (seedJustFound) {
      audioLayer?.playSequence(['heartSeed', 'allFound'], { volume: 0.92, interrupt: true });
    } else {
      audioLayer?.play('allFound', { volume: 0.92, interrupt: false });
    }
  } else {
    const nextScene = journeyScenes[roundIndex + 1];
    $('found-kicker').textContent = secretItemFoundThisRound
      ? 'A little secret was waiting too.'
      : 'Wonderful spotting!';
    $('next-label').textContent = 'Next path: ' + nextScene.name + '.';
    $('continue-path').textContent = 'Where shall we wander? →';
    $('continue-path').dataset.action = 'continue';

    const nextWanderCue = chooseNextWanderCue();
    if (seedJustFound) {
      audioLayer?.playSequence(['heartSeed', nextWanderCue], { volume: 0.9, interrupt: true });
    } else {
      audioLayer?.play(nextWanderCue, { volume: 0.9, interrupt: false });
    }
  }

  $('continue-path').disabled = true;
  clearTimeout(celebrationTimer);
  void unlockCelebrationControls();
}

function handleCharacterFound() {
  if (found) return;
  if (currentCharacter?.mischief && !mischiefEscapedThisRound) {
    startMischiefRun();
    return;
  }

  found = true;
  $('pip').classList.add('found');
  $('pip').disabled = true;
  playFriendFoundCue();

  updateRoundObjective();
  resetHintState();
  $('status').textContent = seedFoundThisRound
    ? 'You found ' + currentCharacter.name + '! One little secret is still hiding nearby.'
    : 'You found ' + currentCharacter.name + '! Now look for the Heart Seed.';
  showStatusToast(4200);
  offerHintLater();

  if (isRoundComplete()) showCelebration();
}

function makeLeafPuff(event) {
  if (found || event.target.closest('#pip,#heart-seed,#secret-item,.mission-hud,.game-actions,.route-strip,.seed-meter,.secret-meter')) return;
  const rect = $('scene').getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const puff = document.createElement('span');
  puff.className = 'leaf-puff';
  puff.textContent = Math.random() > 0.45 ? '🍃' : '✦';
  puff.style.left = (event.clientX - rect.left) + 'px';
  puff.style.top = (event.clientY - rect.top) + 'px';
  $('scene').append(puff);
  setTimeout(() => puff.remove(), 850);
}

function collectHeartSeed(event) {
  event?.preventDefault();
  event?.stopPropagation();

  const seed = $('heart-seed');
  if (seedFoundThisRound || seed.disabled || seed.hidden) return;
  const token = loadToken;

  seedFoundThisRound = true;
  heartSeeds.add(roundIndex);
  updateSeedMeter();
  seed.classList.add('collected');
  seed.disabled = true;

  $('status').textContent = 'Heart Seed found — a hidden woodland secret! ✦';
  showStatusToast(2800);
  if (navigator.vibrate) navigator.vibrate(18);

  updateRoundObjective();
  resetHintState();

  if (isRoundComplete()) {
    celebrationTimer = setTimeout(() => {
      if (token === loadToken) showCelebration({ seedJustFound: true });
    }, 460);
    return;
  }

  playCue('heartSeed', { interrupt: true, volume: 0.82 });
  $('status').textContent = found
    ? 'Heart Seed found! Now look for the little secret hiding nearby.'
    : 'Heart Seed found! Keep searching for ' + currentCharacter.name + '.';
  showStatusToast(3200);
  offerHintLater();
  setTimeout(() => {
    if (token === loadToken) seed.hidden = true;
  }, 420);
}

function collectSecretItem(event) {
  event?.preventDefault();
  event?.stopPropagation();

  if (!currentSecretItem || secretItemFoundThisRound || $('secret-item').hidden) return;
  const token = loadToken;

  secretItemFoundThisRound = true;
  secretItems.add(currentSecretItem.id);
  updateSecretMeter();
  const secretMeter = $('secret-meter');
  secretMeter?.classList.remove('secret-earned');
  if (secretMeter) {
    void secretMeter.offsetWidth;
    secretMeter.classList.add('secret-earned');
  }
  $('secret-item').disabled = true;
  $('secret-item').classList.add('collected');
  $('status').textContent = currentSecretItem.name + ' found! A tiny woodland secret.';
  showStatusToast(2600);

  if (navigator.vibrate) navigator.vibrate(12);
  playCue(chooseSecretFindCue(), { interrupt: true, volume: 0.72 });

  updateRoundObjective();
  resetHintState();

  if (isRoundComplete()) {
    celebrationTimer = setTimeout(() => {
      if (token === loadToken) showCelebration();
    }, 460);
  } else {
    $('status').textContent = found
      ? (seedFoundThisRound ? 'Secret found! This path is complete. ✦' : 'Secret found! The Heart Seed is still hiding nearby.')
      : 'Secret found! Keep searching for ' + currentCharacter.name + '.';
    showStatusToast(3200);
    offerHintLater();
  }

  setTimeout(() => {
    if (token !== loadToken) return;
    $('secret-item').hidden = true;
    $('secret-item').classList.remove('collected');
  }, 420);
}

$('play').addEventListener('click', () => {
  // Mobile browsers can deliver an extra tap/click in quick succession.
  // Once the game is active, never start a second journey/audio sequence.
  if (document.body.classList.contains('game-active')) return;

  // Start the game first. Background music and Luna are optional layers and
  // must never be able to prevent the search itself from opening.
  try {
    startJourney();
  } catch (error) {
    console.error('Woodland Search could not start:', error);
    return;
  }

  setSound(loadSoundPreference());
  void window.jltWoodlandGameMusic?.start?.();
  void audioLayer?.playSequence?.(['welcome', 'beginSearch'], { volume: 0.92 });
});

$('leave').addEventListener('click', leaveJourney);

$('sound').addEventListener('click', () => {
  const currentlyEnabled = $('sound').getAttribute('aria-pressed') === 'true';
  if (currentlyEnabled) {
    setSound(false);
    return;
  }
  setSound(true);
  playCue('beginSearch', { volume: 0.9 });
});

$('hint').addEventListener('click', () => {
  if (isRoundComplete()) return;

  // Luna's hint is deliberately single-press gated: once a hint starts,
  // the button stays locked until her current dialogue has finished.
  // Hints remain unlimited; this only prevents audio spam/queue buildup.
  if (audioLayer?.isPlaying?.()) return;

  const target = getHintTarget();
  if (!target) return;
  const token = loadToken;

  clearTimeout(hintTimer);
  clearTimeout(hintOfferTimer);
  $('hint').classList.remove('is-offering');
  clearHintVisuals();

  const point = target === 'character' ? currentSpot : target === 'seed' ? currentSeedSpot : currentSecretSpot;

  const unlockHintAfterDialogue = (element, nextLabel) => {
    const unlock = () => {
      if (token !== loadToken || target !== getHintTarget() || isRoundComplete()) return;
      // Keep the visual hint glowing after Luna finishes speaking so
      // the child has time to actually spot and click the target. A later
      // gameplay action or new hint clears the glow.
      $('hint').disabled = false;
      $('hint').textContent = nextLabel;
    };

    // A second hint is available as soon as Luna has finished speaking.
    // The hints remain unlimited; this only prevents dialogue from stacking.
    void (audioLayer?.waitForIdle?.() || Promise.resolve()).then(unlock);
  };

  if (hintLevel === 0) {
    hintLevel = 1;
    const firstHint = target === 'character'
      ? (currentSpot.hint || 'Look closely around the woodland details.')
      : target === 'seed'
        ? 'The Heart Seed is still hiding nearby. ' + describePoint(currentSeedSpot)
        : 'A tiny ' + currentSecretItem.name.toLowerCase() + ' is still hiding nearby. ' + describePoint(currentSecretSpot);

    const element = target === 'character' ? $('pip') : target === 'seed' ? $('heart-seed') : $('secret-item');
    element.classList.add('hinted');
    $('status').textContent = firstHint;
    showStatusToast(4800);
    $('hint').disabled = true;
    $('hint').textContent = 'Hint playing…';

    playCue('hintOne', { interrupt: true, volume: 0.88 });
    unlockHintAfterDialogue(element, 'One more hint');
    return;
  }

  hintLevel = 2;
  const element = target === 'character' ? $('pip') : target === 'seed' ? $('heart-seed') : $('secret-item');
  element.classList.add('hinted');
  $('status').textContent = target === 'character'
    ? 'Watch for a tiny golden glow around ' + currentCharacter.name + '.'
    : target === 'seed'
      ? 'Watch for the golden Heart Seed glow.'
      : 'Watch for the little woodland secret glow.';
  showStatusToast(3500);
  $('hint').disabled = true;
  $('hint').textContent = 'Hint playing…';

  playCue('hintTwo', { interrupt: true, volume: 0.88 });
  unlockHintAfterDialogue(element, 'Glow again');
});

$('pip').addEventListener('click', event => {
  event.stopPropagation();
  handleCharacterFound();
});

$('heart-seed').addEventListener('pointerup', event => {
  if (event.pointerType === 'touch' || event.pointerType === 'pen') collectHeartSeed(event);
});
$('heart-seed').addEventListener('click', collectHeartSeed);

$('secret-item').addEventListener('pointerup', event => {
  if (event.pointerType === 'touch' || event.pointerType === 'pen') collectSecretItem(event);
});
$('secret-item').addEventListener('click', collectSecretItem);

$('viewport').addEventListener('pointerup', makeLeafPuff);

$('continue-path').addEventListener('click', () => {
  if ($('continue-path').disabled) return;

  if ($('continue-path').dataset.action === 'restart') {
    buildJourneyCast();
    buildJourneyScenes();
    roundIndex = 0;
    heartSeeds = new Set();
    secretItems = new Set();
    updateSeedMeter();
    loadRound();
    playCue('beginSearch', { volume: 0.9 });
    lockGame(false);
    return;
  }

  roundIndex += 1;
  lockGame(false);
  loadRound();
});

$('success').addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    leaveJourney();
    return;
  }

  if (event.key === 'Tab') {
    const controls = [...$('success').querySelectorAll('button:not(:disabled), a[href]')]
      .filter(element => element.getClientRects().length);
    const first = controls[0];
    const last = controls[controls.length - 1];

    if (!first) {
      event.preventDefault();
      document.querySelector('.celebration').focus({ preventScroll: true });
    } else if (event.shiftKey && (event.target === first || !controls.includes(event.target))) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && (event.target === last || !controls.includes(event.target))) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }
});

window.addEventListener('resize', () => {
  syncPhoneViewportMode();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (document.body.classList.contains('game-active')) positionObjects();
  }, 90);
});

window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    syncPhoneViewportMode();
    if (document.body.classList.contains('game-active')) positionObjects();
  }, 80);
});

window.visualViewport?.addEventListener('resize', syncPhoneViewportMode);

window.addEventListener('woodland-audio-error', () => {
  if (!document.body.classList.contains('game-active')) return;
  $('status').textContent = 'Luna audio could not start. Tap Sound off, then Sound on to try again.';
  showStatusToast(5200);
});

setSound(loadSoundPreference());
renderRoute();
