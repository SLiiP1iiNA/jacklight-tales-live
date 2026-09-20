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

function positionObjects() {
  if (currentSpot && !$('pip').hidden && !mischiefEscapedThisRound) {
    mapPointToScene(currentSpot, $('pip'));
    requestAnimationFrame(() => clampToScene($('pip')));
  }
  if (currentSeedSpot && !$('heart-seed').hidden) {
    mapPointToScene(currentSeedSpot, $('heart-seed'));
    requestAnimationFrame(() => clampToScene($('heart-seed'), 6));
  }
  if (currentSecretSpot && !$('secret-item').hidden) {
    mapPointToScene(currentSecretSpot, $('secret-item'));
    requestAnimationFrame(() => clampToScene($('secret-item'), 6));
  }
}

function offerHintLater() {
  clearTimeout(hintOfferTimer);
  hintOfferTimer = setTimeout(() => {
    if (found || hintLevel > 0) return;
    $('hint').classList.add('is-offering');
    $('hint').textContent = 'Need a little hint?';
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
  $('secret-item').hidden = false;
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
  currentSpot = chooseSpot(currentScene);
  currentSeedSpot = chooseSeedSpot(currentScene, currentSpot);

  $('success').hidden = true;
  $('pip').hidden = true;
  $('heart-seed').hidden = true;
  $('secret-item').hidden = true;
  $('hint').disabled = true;
  $('hint').classList.remove('is-offering');
  $('hint').textContent = 'A little hint';
  $('continue-found').hidden = true;
  $('continue-found').disabled = false;
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
  $('woods').src = currentScene.image;

  try {
    await Promise.all([
      $('woods').decode(),
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
  updateSeedMeter();
  loadRound();
}

function leaveJourney() {
  clearTimers();
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
  scenes.slice(0, SETTINGS.roundsPerJourney).forEach((scene, index) => {
    const item = document.createElement('div');
    item.className = 'route-node';
    item.title = 'Path ' + (index + 1) + ': ' + scene.name;
    item.setAttribute('aria-label', item.title);
    if (index < roundIndex || (found && index === roundIndex)) item.classList.add('is-complete');
    if (!found && index === roundIndex) item.classList.add('is-current');

    const dot = document.createElement('span');
    dot.textContent = index < roundIndex || (found && index === roundIndex) ? '✓' : String(index + 1);
    const label = document.createElement('strong');
    label.textContent = scene.shortName;

    item.append(dot, label);
    target.append(item);
  });
}

function renderResultRoute() {
  const target = $('result-route');
  target.replaceChildren();
  scenes.slice(0, SETTINGS.roundsPerJourney).forEach((scene, index) => {
    const dot = document.createElement('span');
    dot.className = index <= roundIndex ? 'is-lit' : '';
    dot.title = scene.name;
    dot.textContent = index <= roundIndex ? '✦' : '·';
    target.append(dot);
  });
}

function lockGame(locked) {
  $('viewport').inert = locked;
  $('hint').disabled = locked || found;
  $('sound').disabled = false;
  $('leave').disabled = false;
}

function startMischiefRun() {
  if (!currentCharacter?.mischief || mischiefEscapedThisRound || found) return false;

  const candidates = shuffle(currentScene.spots.filter(spot => Math.hypot(spot.x - currentSpot.x, spot.y - currentSpot.y) > 28));
  const nextSpot = candidates[0] || chooseSpot(currentScene);
  const nextPixel = scenePixelPoint(nextSpot);

  mischiefEscapedThisRound = true;
  $('pip').classList.add('mischief-running');
  $('hint').disabled = true;
  $('status').textContent = currentCharacter.name + ' is scampering away! Quick — catch them!';
  showStatusToast(2200);

  requestAnimationFrame(() => {
    $('pip').style.transition = 'left 720ms cubic-bezier(.2,.8,.25,1), top 720ms cubic-bezier(.2,.8,.25,1)';
    $('pip').style.left = nextPixel.left + 'px';
    $('pip').style.top = nextPixel.top + 'px';
  });

  window.setTimeout(() => {
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
  playCue(foundCue, { interrupt: false, volume: 0.9 });
}

async function unlockCelebrationControls() {
  const minimum = new Promise(resolve => setTimeout(resolve, SETTINGS.celebrationMinMs));
  await Promise.all([
    audioLayer?.waitForIdle?.() || Promise.resolve(),
    minimum
  ]);
  if ($('success').hidden) return;
  $('continue-path').disabled = false;
  $('continue-path').focus({ preventScroll: true });
}

function showCelebration({ seedJustFound = false } = {}) {
  clearTimeout(hintOfferTimer);
  clearTimeout(hintTimer);
  $('continue-found').hidden = true;

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

  const finalRound = roundIndex === SETTINGS.roundsPerJourney - 1;
  $('finish').hidden = !finalRound;

  if (finalRound) {
    $('found-kicker').textContent = 'Every path is glowing!';
    $('next-label').textContent =
      '10 paths explored. You found ' + heartSeeds.size + ' of 10 Heart Seeds and ' + secretItems.size + ' of 10 woodland secrets.';
    $('continue-path').textContent = 'Where shall we wander? ↻';
    $('continue-path').dataset.action = 'restart';

    if (seedJustFound) {
      audioLayer?.playSequence(['heartSeed', 'allFound'], { volume: 0.92, interrupt: false });
    } else {
      audioLayer?.play('allFound', { volume: 0.92, interrupt: false });
    }
  } else {
    const nextScene = scenes[roundIndex + 1];
    $('found-kicker').textContent = secretItemFoundThisRound
      ? 'A little secret was waiting too.'
      : 'Wonderful spotting!';
    $('next-label').textContent = 'Next path: ' + nextScene.name + '.';
    $('continue-path').textContent = 'Where shall we wander? →';
    $('continue-path').dataset.action = 'continue';

    if (seedJustFound) {
      audioLayer?.playSequence(['heartSeed', 'nextLocation'], { volume: 0.9, interrupt: false });
    } else {
      audioLayer?.play('nextLocation', { volume: 0.9, interrupt: false });
    }
  }

  $('continue-path').disabled = true;
  clearTimeout(celebrationTimer);
  celebrationTimer = setTimeout(unlockCelebrationControls, SETTINGS.celebrationMinMs + 20);
  unlockCelebrationControls();
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
  $('hint').disabled = true;
  playFriendFoundCue();

  if (seedFoundThisRound) {
    showCelebration();
    return;
  }

  $('status').textContent = 'You found ' + currentCharacter.name + '! A hidden Heart Seed may still be nearby.';
  showStatusToast(4200);
  $('continue-found').hidden = false;
  $('continue-found').disabled = true;

  (async () => {
    await (audioLayer?.waitForIdle?.() || Promise.resolve());
    if (!$('continue-found').hidden && !found) $('continue-found').disabled = false;
    if (!$('continue-found').hidden && found) $('continue-found').disabled = false;
  })();
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

  seedFoundThisRound = true;
  heartSeeds.add(roundIndex);
  updateSeedMeter();
  seed.classList.add('collected');
  seed.disabled = true;

  $('status').textContent = 'Heart Seed found — a hidden woodland secret! ✦';
  showStatusToast(2800);
  if (navigator.vibrate) navigator.vibrate(18);

  if (found) {
    showCelebration({ seedJustFound: true });
    return;
  }

  playCue('heartSeed', { interrupt: false, volume: 0.82 });
  setTimeout(() => { seed.hidden = true; }, 420);
}

function collectSecretItem(event) {
  event?.preventDefault();
  event?.stopPropagation();

  if (!currentSecretItem || secretItemFoundThisRound || $('secret-item').hidden) return;

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
  playCue(chooseSecretFindCue(), { interrupt: false, volume: 0.72 });

  setTimeout(() => {
    $('secret-item').hidden = true;
    $('secret-item').classList.remove('collected');
  }, 420);
}

$('play').addEventListener('click', () => {
  setSound(true);
  startJourney();
  audioLayer?.playSequence?.(['welcome', 'beginSearch'], { volume: 0.92 });
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
  if (found || !currentSpot || mischiefEscapedThisRound) return;
  clearTimeout(hintTimer);
  clearTimeout(hintOfferTimer);
  $('hint').classList.remove('is-offering');

  if (hintLevel === 0) {
    hintLevel = 1;
    $('status').textContent = currentSpot.hint || 'Look closely around the woodland details.';
    showStatusToast(4500);
    $('hint').textContent = 'One more hint';
    playCue('hintOne', { interrupt: false, volume: 0.88 });
    return;
  }

  hintLevel = 2;
  $('pip').classList.add('hinted');
  $('status').textContent = 'Watch for a tiny golden glow.';
  showStatusToast(3500);
  $('hint').textContent = 'Glow shown';
  $('hint').disabled = true;
  playCue('hintTwo', { interrupt: false, volume: 0.88 });

  hintTimer = setTimeout(() => {
    $('pip').classList.remove('hinted');
    if (!found) {
      $('hint').disabled = false;
      $('hint').textContent = 'Glow again';
    }
  }, SETTINGS.hintMs);
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

$('continue-found').addEventListener('click', () => {
  $('continue-found').hidden = true;
  showCelebration();
});

$('continue-path').addEventListener('click', () => {
  if ($('continue-path').disabled) return;

  if ($('continue-path').dataset.action === 'restart') {
    buildJourneyCast();
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
