const $=id=>document.getElementById(id);
const playCue=name=>window.jltGameAudio?.play(name);
const {characters,scenes}=window.WOODLAND_SEARCH_DATA;
const SETTINGS=window.WOODLAND_SEARCH_SETTINGS;

let castBag=[];
let upcomingCharacter;
let characterIndex=0;
let sceneBag=[];
let lastScene='';
let lastSpotKey='';
let currentScene=null;
let currentSpot=null;
let found=false;
let hintLevel=0;
let hintTimer;
let celebrationTimer;
let resizeTimer;
let round=0;
let transitionBusy=false;

function readMemory(){
  try{
    const value=JSON.parse(localStorage.getItem(SETTINGS.memoryKey)||'{}');
    return value&&typeof value==='object'?value:{};
  }catch{return {};}
}

function saveMemory(scene){
  try{localStorage.setItem(SETTINGS.memoryKey,JSON.stringify({character:characterIndex,scene:scene.image}));}catch{}
}

function chooseCharacter(){
  if(!castBag.length){
    castBag=characters.map((_,i)=>i);
    for(let i=castBag.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [castBag[i],castBag[j]]=[castBag[j],castBag[i]];
    }
    if(castBag[castBag.length-1]===characterIndex){
      [castBag[0],castBag[castBag.length-1]]=[castBag[castBag.length-1],castBag[0]];
    }
  }
  return castBag.pop();
}

function nextScene(){
  if(!sceneBag.length){
    sceneBag=[...scenes];
    for(let i=sceneBag.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [sceneBag[i],sceneBag[j]]=[sceneBag[j],sceneBag[i]];
    }
    if(sceneBag[sceneBag.length-1].image===lastScene){
      [sceneBag[0],sceneBag[sceneBag.length-1]]=[sceneBag[sceneBag.length-1],sceneBag[0]];
    }
  }
  const scene=sceneBag.pop();
  lastScene=scene.image;
  return scene;
}

function chooseSpot(scene){
  const choices=scene.spots.filter((spot,index)=>`${scene.image}:${index}`!==lastSpotKey);
  const pool=choices.length?choices:scene.spots;
  const spot=pool[Math.floor(Math.random()*pool.length)];
  const index=scene.spots.indexOf(spot);
  lastSpotKey=`${scene.image}:${index}`;
  return spot;
}

function setControlsLocked(locked){
  $('viewport').inert=locked;
  $('back').inert=locked;
  $('hint').inert=locked;
  $('shuffle').inert=locked;
  if($('fullscreen'))$('fullscreen').inert=locked;
}

/*
  Coordinates are intentionally safe already, but this final guard measures the
  actual rendered PNG and nudges it back inside the scene if a browser/device
  would clip even one edge. It also runs again after rotation/resizing.
*/
function clampTargetToScene(){
  if(!currentSpot||$('pip').hidden)return;
  const scene=$('scene');
  const target=$('pip');
  const sceneRect=scene.getBoundingClientRect();
  const targetRect=target.getBoundingClientRect();
  if(!sceneRect.width||!sceneRect.height||!targetRect.width||!targetRect.height)return;

  const pad=SETTINGS.targetEdgePadding??8;
  let dx=0,dy=0;
  if(targetRect.left<sceneRect.left+pad)dx=(sceneRect.left+pad)-targetRect.left;
  if(targetRect.right>sceneRect.right-pad)dx=(sceneRect.right-pad)-targetRect.right;
  if(targetRect.top<sceneRect.top+pad)dy=(sceneRect.top+pad)-targetRect.top;
  if(targetRect.bottom>sceneRect.bottom-pad)dy=(sceneRect.bottom-pad)-targetRect.bottom;

  if(dx||dy){
    target.style.left=`${target.offsetLeft+dx}px`;
    target.style.top=`${target.offsetTop+dy}px`;
  }
}

function positionTarget(){
  if(!currentSpot)return;

  const target=$('pip');
  const scene=$('scene');
  const image=$('woods');
  const rect=scene.getBoundingClientRect();

  /*
    The game is full-bleed on landscape screens. Because the woodland image
    uses object-fit: cover, ultrawide monitors and phones crop a little from
    the top/bottom. Map the hand-picked source-image coordinates through that
    cover crop so the character still sits on the intended rock/flower/path.
  */
  const sourceW=image.naturalWidth||1672;
  const sourceH=image.naturalHeight||941;
  if(rect.width&&rect.height&&sourceW&&sourceH){
    const scale=Math.max(rect.width/sourceW,rect.height/sourceH);
    const renderedW=sourceW*scale;
    const renderedH=sourceH*scale;
    const offsetX=(rect.width-renderedW)/2;
    const offsetY=(rect.height-renderedH)/2;
    const left=offsetX+(currentSpot.x/100)*renderedW;
    const top=offsetY+(currentSpot.y/100)*renderedH;
    target.style.left=`${left}px`;
    target.style.top=`${top}px`;
  }else{
    target.style.left=`${currentSpot.x}%`;
    target.style.top=`${currentSpot.y}%`;
  }

  requestAnimationFrame(clampTargetToScene);
}

async function start(){
  if(transitionBusy)return;
  transitionBusy=true;
  playCue('transition');

  const token=++round;
  clearTimeout(hintTimer);
  clearTimeout(celebrationTimer);
  found=false;
  hintLevel=0;
  currentSpot=null;

  $('welcome').hidden=true;
  $('game').hidden=false;
  $('success').hidden=true;
  $('next-step').hidden=true;
  document.body.classList.add('game-active');
  $('stage').classList.add('scene-changing');
  setControlsLocked(false);

  const c=characters[characterIndex];
  await new Promise(resolve=>setTimeout(resolve,SETTINGS.transitionMs));
  if(token!==round){transitionBusy=false;return;}

  $('target-title').textContent=`Find ${c.name}`;
  $('reference').src=`assets/${c.image}`;
  $('reference').alt=c.name;
  $('pip').querySelector('img').src=`assets/${c.image}`;
  $('pip').setAttribute('aria-label',`Found ${c.name}`);

  currentScene=nextScene();
  saveMemory(currentScene);
  $('place-name').textContent=currentScene.name;
  $('woods').alt=currentScene.name;

  $('pip').hidden=true;
  $('hint').disabled=true;
  $('hint').textContent='A little hint';
  $('woods').src=`assets/${currentScene.image}`;
  $('stage').style.setProperty('--scene-image',`url("assets/${currentScene.image}")`);
  $('status').textContent='Opening another woodland path…';

  try{
    await Promise.all([
      $('woods').decode(),
      $('pip').querySelector('img').decode().catch(()=>{})
    ]);
  }catch{
    if(token===round){
      $('stage').classList.remove('scene-changing');
      $('status').textContent='This picture could not load. Return to games and try again.';
    }
    transitionBusy=false;
    return;
  }
  if(token!==round){transitionBusy=false;return;}

  currentSpot=chooseSpot(currentScene);
  $('pip').className='';
  $('pip').disabled=false;
  $('pip').hidden=false;
  positionTarget();
  $('hint').disabled=false;
  $('status').textContent=`Can you spot ${c.name}?`;

  requestAnimationFrame(()=>{
    $('stage').classList.remove('scene-changing');
    transitionBusy=false;
  });
}

function back(){
  if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
  round++;
  clearTimeout(hintTimer);
  clearTimeout(celebrationTimer);
  transitionBusy=false;
  currentSpot=null;
  document.body.classList.remove('game-active');
  $('game').hidden=true;
  $('welcome').hidden=false;
  setControlsLocked(false);
  $('play').focus({preventScroll:true});
}

$('play').addEventListener('click',()=>{
  playCue('welcome');
  const saved=readMemory();
  characterIndex=Number.isInteger(saved.character)?saved.character:-1;
  lastScene=saved.scene||lastScene;
  characterIndex=chooseCharacter();
  start();
});

$('again').addEventListener('click',()=>{
  playCue('next');
  characterIndex=upcomingCharacter;
  start();
});

$('back').addEventListener('click',back);
$('finish').addEventListener('click',back);

$('shuffle').addEventListener('click',()=>{
  if(found)return;
  characterIndex=chooseCharacter();
  start();
});

$('hint').addEventListener('click',()=>{
  if(found||!currentSpot)return;
  clearTimeout(hintTimer);
  playCue('hint');

  if(hintLevel===0){
    hintLevel=1;
    $('status').textContent=currentSpot.hint||'Look closely around the woodland details.';
    $('hint').textContent='One more hint';
    return;
  }

  hintLevel=2;
  $('pip').classList.add('hinted');
  $('status').textContent='Watch for a tiny golden glow.';
  $('hint').textContent='Hint shown';
  $('hint').disabled=true;
  hintTimer=setTimeout(()=>{
    $('pip').classList.remove('hinted');
    if(!found){
      $('hint').disabled=false;
      $('hint').textContent='Glow again';
    }
  },SETTINGS.hintMs);
});

$('pip').addEventListener('click',()=>{
  if(found)return;
  found=true;
  clearTimeout(hintTimer);
  clearTimeout(celebrationTimer);
  upcomingCharacter=chooseCharacter();

  const c=characters[characterIndex];
  const next=characters[upcomingCharacter];
  playCue('found');

  $('pip').className='found';
  $('hint').disabled=true;
  $('win-title').textContent=`You found ${c.name}!`;
  $('found-portrait').src=`assets/${c.image}`;
  $('found-portrait').alt=c.name;
  $('next-portrait').src=`assets/${next.image}`;
  $('next-portrait').alt=next.name;
  $('next-label').textContent=`Next: ${next.name}`;
  $('again').textContent=`Find ${next.name} →`;
  $('next-step').hidden=true;
  $('status').textContent=`You found ${c.name}!`;
  $('success').hidden=false;
  setControlsLocked(true);
  document.querySelector('.celebration')?.focus({preventScroll:true});

  celebrationTimer=setTimeout(()=>{
    $('next-step').hidden=false;
    $('status').textContent='Another woodland friend is ready when you are.';
  },Math.min(700, SETTINGS.celebrationRevealMs || 700));
});

$('success').addEventListener('keydown',e=>{
  if(e.key==='Escape'){back();return;}
  if(e.key==='Tab'){
    const focusable=[$('again'),$('finish')].filter(el=>el&&!el.hidden&&el.offsetParent!==null);
    const first=focusable[0],last=focusable[focusable.length-1];
    if(e.shiftKey&&document.activeElement===first){
      e.preventDefault();
      last?.focus({preventScroll:true});
    }else if(!e.shiftKey&&document.activeElement===last){
      e.preventDefault();
      first?.focus({preventScroll:true});
    }
  }
});

if(!document.fullscreenEnabled)$('fullscreen').hidden=true;
$('fullscreen').addEventListener('click',async()=>{
  try{
    if(document.fullscreenElement)await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  }catch{
    $('status').textContent='Full screen is unavailable here.';
  }
});

document.addEventListener('fullscreenchange',()=>{
  $('fullscreen').textContent=document.fullscreenElement?'Exit full screen':'Full screen';
});

window.addEventListener('resize',()=>{
  clearTimeout(resizeTimer);
  resizeTimer=setTimeout(()=>{
    if(document.body.classList.contains('game-active')&&!found)positionTarget();
  },80);
});
