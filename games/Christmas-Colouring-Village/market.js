/* Private, local Christmas journey. Original prototype and save data remain intact. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const ASSETS = 'assets/placeholders/';
const KEY = 'jacklight-christmas-v4';
const clone = x => JSON.parse(JSON.stringify(x));
const scenes = {
 crossroads:{title:'Outside our burrow',file:'Winter_Crossroads',out:true,text:'Choose a path for Barnaby. A little wonder waits in every direction.'},
 home:{title:"Barnaby’s burrow",file:'Interior_Burrow',out:false,text:'A warm place to begin. Make a keepsake for the window, or step outside into the snow.'},
 market:{title:'The Christmas village',file:'Christmas_Village_Background',out:true,text:'Where shall we go? The village tree and Alder’s workshop are waiting.'},
 square:{title:'Our Christmas tree',file:'Christmas_Village_Square',out:true,text:'A little more Christmas, made by you. Colour a decoration, then choose its branch.'},
 approach:{title:'Alder’s lantern shop',file:'Approach_Lanternmaker',out:true,text:'A warm welcome behind the wooden door. Shall we make a lantern?'},
 workshop:{title:'At Alder’s workbench',file:'Interior_Lanternmaker',out:false,text:'Choose your favourite colours. We’ll hang your finished lantern outside and light it.'}
};
const path = (id,label,d) => ({id,label,tag:'path',attrs:'d="'+d+'"'});
const rect = (id,label,x,y,w,h,r=0) => ({id,label,tag:'rect',attrs:'x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'"'});
const circle = (id,label,x,y,r) => ({id,label,tag:'circle',attrs:'cx="'+x+'" cy="'+y+'" r="'+r+'"'});
const defs = {
 window:{name:'Mum’s window star',finish:'Hang in our window',view:'140 25 520 520',regions:[
 path('loop','Hanging ribbon','M376 102 Q354 40 400 35 Q446 40 424 102 L408 102 Q424 58 400 58 Q376 58 392 102 Z'),
 path('stick1','First wooden stick','M384 91 L414 103 L265 531 L235 519 Z'),
 path('stick2','Second wooden stick','M386 103 L416 91 L565 519 L535 531 Z'),
 path('stick3','Third wooden stick','M546 535 L557 507 L160 253 L146 280 Z'),
 path('stick4','Fourth wooden stick','M152 247 L648 247 L648 278 L152 278 Z'),
 path('stick5','Fifth wooden stick','M254 535 L243 507 L640 253 L654 280 Z'),
 rect('wool1','Top wool binding',380,92,40,38,9),rect('wool2','Left wool binding',151,243,45,40,9),
 rect('wool3','Right wool binding',604,243,45,40,9),rect('wool4','Lower left wool binding',236,490,43,39,9),
 rect('wool5','Lower right wool binding',521,490,43,39,9)]},
 star:{name:'A wooden tree star',finish:'Choose a branch',view:'140 20 520 530',regions:[
 path('ribbon','Hanging ribbon','M382 103 Q350 39 400 30 Q450 39 418 103 L401 99 Q427 58 400 53 Q373 58 399 99 Z'),
 path('wood','Wooden star','M400 90 L460 250 L635 260 L500 370 L542 540 L400 445 L258 540 L300 370 L165 260 L340 250 Z')]},
 bow:{name:'A woolly Christmas bow',finish:'Choose a branch',view:'145 90 510 450',regions:[
 path('lefttail','Left ribbon tail','M369 282 L402 304 L316 530 L280 484 L220 500 L330 275 Z'),
 path('righttail','Right ribbon tail','M431 282 L398 304 L484 530 L520 484 L580 500 L470 275 Z'),
 path('leftloop','Left bow loop','M368 245 C310 140 170 102 163 190 C143 300 251 354 370 309 Z'),
 path('rightloop','Right bow loop','M432 245 C490 140 630 102 637 190 C657 300 549 354 430 309 Z'),
 rect('knot','Middle of the bow',354,234,92,97,24)]},
 orange:{name:'A dried orange slice',finish:'Choose a branch',view:'188 40 424 520',regions:[
 path('string','Hanging thread','M390 150 Q339 48 400 39 Q461 48 410 150 L395 139 Q431 65 400 61 Q369 65 405 139 Z'),
 circle('rind','Orange peel',400,345,198),circle('pith','Pale inner ring',400,345,170),
 ...Array.from({length:8},(_,i)=>{const a=i*Math.PI/4-.03,b=(i+1)*Math.PI/4+.03;
 const p=t=>[(400+148*Math.cos(t)).toFixed(2),(345+148*Math.sin(t)).toFixed(2)].join(' ');
 return path('slice'+i,'Orange segment '+(i+1),'M400 345 L'+p(a)+' A148 148 0 0 1 '+p(b)+' Z');}),
 circle('centre','Centre of the orange',400,345,21)]},
 lantern:{name:'Alder’s wooden lantern',finish:'Light my lantern',view:'180 20 440 550',regions:[
 path('handle','Curved brass handle','M296 164 L296 113 C296 12 504 12 504 113 L504 164 L477 164 L477 113 C477 50 323 50 323 113 L323 164 Z'),
 path('cap','Brass lantern cap','M267 165 Q400 103 533 165 L553 206 L247 206 Z'),
 rect('frame','Rounded wooden frame',235,207,330,326,35),
 rect('front','Front glass pane',268,246,161,242,17),
 path('side','Side glass pane','M459 246 L529 264 L529 468 L459 488 Z'),
 path('foot','Wooden lantern base','M237 510 L563 510 L581 550 L219 550 Z')]
 }
};
const palette = [['Berry red','#bd3749'],['Rose','#ef8093'],['Orange','#ed9639'],['Honey','#efc052'],['Cream','#fff1c1'],['Fern','#84ab63'],['Forest','#326b51'],['Mint','#a4d4b1'],['Night blue','#344e83'],['Sky','#65a9cf'],['Ice','#bde5ee'],['Purple','#8461ab'],['Plum','#9d497a'],['Wood','#a87344'],['Black','#333139'],['White','#ffffff']];
const blank = () => ({fills:{},strokes:[]});
function cleanArt(value,type) {
 const art=blank(), ids=new Set(defs[type].regions.map(r=>r.id));
 if (!value || typeof value!=='object') return art;
 for (const [id,c] of Object.entries(value.fills||{})) if(ids.has(id)&&/^#[0-9a-f]{6}$/i.test(c))art.fills[id]=c;
 if(Array.isArray(value.strokes))art.strokes=value.strokes.slice(-100).filter(s=>ids.has(s.region)&&/^#[0-9a-f]{6}$/i.test(s.colour)&&[8,18,34].includes(s.size)&&Array.isArray(s.points)).map(s=>({...s,points:s.points.slice(0,700).filter(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&Math.abs(n)<2000))})).filter(s=>s.points.length);
 return art;
}
let state={version:1,drafts:{},placements:{},edits:{}}, storageOK=true;
try{
 const raw=JSON.parse(localStorage.getItem(KEY)||'null');
 if(raw?.version===1){
  for(const type of Object.keys(defs))if(raw.drafts?.[type])state.drafts[type]=cleanArt(raw.drafts[type],type);
  for(const [slot,v] of Object.entries(raw.placements||{})){
   if(v&&((slot==='window'&&v.type==='window')||(slot==='lantern'&&v.type==='lantern')||(/^tree[0-7]$/.test(slot)&&['star','bow','orange'].includes(v.type))))state.placements[slot]={type:v.type,art:cleanArt(v.art,v.type)};
  }
  for(const [slot,v] of Object.entries(raw.edits||{})){if(state.placements[slot]&&state.placements[slot].type===v?.type)state.edits[slot]={type:v.type,art:cleanArt(v.art,v.type)};}
 }
}catch(e){storageOK=false;}
function save(){
 try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch(e){storageOK=false;}
}
let scene='crossroads',requestedScene=scene,portrait=innerWidth/innerHeight<1.12,sceneToken=0,pending=null,uid=0;
let worldWidth=0,worldHeight=0,sceneReady=false;
let edit=null,art=blank(),undo=[],redo=[],colour=palette[0][1],tool='fill',size=18,stroke=null,beforeStroke=null;
let calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
const mount=$('#market-view');
mount.innerHTML='<div id="scene-stage"><div id="scene-world"><img id="scene-image" alt="" fetchpriority="high" decoding="async"><div id="scene-items"></div></div><canvas id="snow" aria-hidden="true"></canvas></div>'+
 '<header class="scene-header"><div><p class="eyebrow">Winter in the Whispering Woods</p><h1 id="place-title"></h1></div><nav aria-label="Village controls"><button id="crossroads" aria-label="Return to the crossroads">⌂ <span>Crossroads</span></button><button id="places" aria-label="Open the woodland paths">✧ <span>Paths</span></button><button id="sound" aria-pressed="false">Sound off</button><button id="calm" aria-pressed="'+calm+'">Gentle mode</button></nav></header>'+
 '<button id="stop-walk" hidden>Wait, Barnaby</button><footer class="scene-footer"><p id="scene-message" aria-live="polite"></p><div class="scene-actions" id="scene-actions"></div><small>Local storybook preview</small></footer>'+
 '<dialog class="dialog" id="places-dialog" aria-labelledby="places-title"><div class="dialog-head"><div><p class="eyebrow">Follow your curiosity</p><h2 id="places-title">Where shall we go?</h2></div><button class="close" data-close="places-dialog" aria-label="Close places">✕</button></div><div class="place-grid">'+[['crossroads','Our woodland paths'],['home','Inside our burrow'],['market','The village'],['square','Our Christmas tree'],['approach','Alder’s shop']].map(([id,t])=>'<button class="place-card" data-go="'+id+'"><strong>'+t+'</strong></button>').join('')+'</div></dialog>'+
 '<dialog class="dialog" id="activities-dialog" aria-labelledby="activities-title"><div class="dialog-head"><div><p class="eyebrow">Something made by you</p><h2 id="activities-title">A gift for our tree</h2><p>Choose a decoration to make your own.</p></div><button class="close" data-close="activities-dialog" aria-label="Close decorations">✕</button></div><div class="activity-grid" id="activity-cards"></div></dialog>'+
 '<dialog class="dialog" id="paint-dialog" aria-labelledby="paint-title"><header class="paint-heading"><div><h2 id="paint-title"></h2><p>Tap to fill. Brush marks stay inside the piece you start on.</p></div><button data-close="paint-dialog" aria-label="Keep picture and close">✕</button></header><div class="paint-layout"><aside class="paintbox" aria-label="Paintbox"><div class="paint-colours"><p class="paintbox-label">Your colours</p><div class="palette">'+palette.map(([name,c])=>'<button class="swatch" style="--paint:'+c+'" data-colour="'+c+'" aria-label="'+name+'" aria-pressed="'+(c===colour)+'"></button>').join('')+'</div><label class="custom-colour">Mix your own colour <input id="custom-colour" type="color" value="'+colour+'" aria-label="Choose any colour"></label></div><div class="paint-tools"><button data-tool="fill" aria-label="Fill a piece" aria-pressed="true">Fill</button><button data-tool="brush" aria-label="Paint with a brush" aria-pressed="false">Brush</button><button data-tool="erase" aria-label="Clear a piece" aria-pressed="false">Clear</button><div class="brush-size" aria-label="Brush size" hidden>'+[8,18,34].map((n,i)=>'<button data-size="'+n+'" aria-label="'+['Small','Medium','Large'][i]+' brush" aria-pressed="'+(n===size)+'">'+['•','●','⬤'][i]+'</button>').join('')+'</div></div><div class="paint-history"><div class="history-tools"><button id="undo">Undo</button><button id="redo">Redo</button></div><button id="reset-picture">Start again</button></div></aside><div class="paper-desk"><div class="drawing-wrap" id="drawing"></div></div></div><footer class="paint-footer"><p id="paint-status" aria-live="polite"></p><div><button id="save-picture">Save a picture</button><button id="finish" class="gold"></button></div></footer></dialog>'+
 '<dialog class="dialog" id="reset-dialog" aria-labelledby="reset-title"><h2 id="reset-title">A fresh sheet?</h2><p>This clears this picture. You can still use Undo afterwards.</p><div class="dialog-actions"><button data-close="reset-dialog">Keep painting</button><button id="confirm-reset" class="gold">Start again</button></div></dialog>'+
 '<dialog class="dialog" id="export-dialog" aria-labelledby="export-title"><div class="dialog-head"><h2 id="export-title">Your Christmas keepsake</h2><button data-close="export-dialog" aria-label="Close picture preview">✕</button></div><img id="export-image" alt="Your finished colouring picture"><p class="storage-note">Save this picture to keep it outside this browser.</p><div class="dialog-actions"><a id="download-picture" class="gold" download>Download PNG</a></div></dialog>';
document.body.classList.toggle('calm',calm);
function shape(r,attrs=''){return '<'+r.tag+' '+r.attrs+' '+attrs+'/>';}
function svgArt(type,value,{interactive=false,tight=false}={}){
 const id='art'+(++uid);
 const shapeMarkup=defs[type].regions.map(r=>{
 const ink=value.strokes.filter(s=>s.region===r.id).map(s=>'<path d="'+strokePath(s.points)+'" stroke="'+s.colour+'" stroke-width="'+s.size+'" fill="none" stroke-linecap="round" stroke-linejoin="round"/>').join('');
 return '<g>'+shape(r,'fill="'+(value.fills[r.id]||'#ffffff')+'"')+'<g clip-path="url(#'+id+'-'+r.id+')" pointer-events="none">'+ink+'</g>'+shape(r,'fill="none" stroke="#282523" stroke-width="6" stroke-linejoin="round" pointer-events="none"')+(interactive?shape(r,'fill="transparent" data-region="'+r.id+'" role="button" tabindex="0" aria-label="'+r.label+'"'):'')+'</g>';
 }).join('');
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+(tight?defs[type].view:'0 0 800 600')+'" '+(interactive?'aria-label="Colour '+defs[type].name+'"':'aria-hidden="true"')+'><defs>'+defs[type].regions.map(r=>'<clipPath id="'+id+'-'+r.id+'">'+shape(r)+'</clipPath>').join('')+'</defs>'+shapeMarkup+'</svg>';
}
function strokePath(points){return points.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ') +(points.length===1?' l.1 .1':'');}
function openDialog(id){stopNarration();$('#'+id).showModal();updateSnow();if(id!=='paint-dialog')readCue(currentCue(),{once:['places-dialog','activities-dialog'].includes(id)});}
function closeDialog(id){stopNarration();if(id==='paint-dialog'){if(stroke)cancelStroke();saveDraft();}$('#'+id).close();updateSnow();}
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeDialog(b.dataset.close));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',updateSnow));
$('#paint-dialog').addEventListener('cancel',()=>{if(stroke)cancelStroke();saveDraft();});
$('#places').onclick=()=>{if(!pending&&!walking)openDialog('places-dialog');};
const woodlandLink=document.createElement('a');woodlandLink.className='place-card';woodlandLink.href='../woodland-search/index.html';woodlandLink.innerHTML='<strong>Woodland Search ↗</strong>';woodlandLink.onclick=()=>{stopNarration(true);music.stop();};$('.place-grid').append(woodlandLink);
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{closeDialog('places-dialog');go(b.dataset.go);});
$('#activity-cards').innerHTML=['star','bow','orange'].map(t=>'<button class="activity-card" data-art="'+t+'"><span class="mini-art">'+svgArt(t,blank())+'</span><strong>'+defs[t].name+'</strong></button>').join('');
document.querySelectorAll('[data-art]').forEach(b=>b.onclick=()=>{closeDialog('activities-dialog');openPaint(b.dataset.art);});
function action(label,fn){const b=document.createElement('button');b.textContent=label;b.onclick=fn;$('#scene-actions').append(b);}
function position(button,xy){button.dataset.x=xy[0];button.dataset.y=xy[1];button.style.left=xy[0]+'%';button.style.top=xy[1]+'%';}
function hotspot(label,wide,tall,fn){
 const b=document.createElement('button');b.className='path-stop';b.textContent=label;position(b,portrait?tall:wide);b.onclick=fn;$('#scene-items').append(b);
}
const branchesWide=[[49,28],[44,38],[57,39],[48,47],[60,51],[42,57],[52,60],[56,62]];
const branchesTall=[[49,24],[43,34],[57,34],[48,43],[60,47],[41,52],[51,57],[57,58]];
function creation(slot,wide,tall,width,phoneWidth){
 const v=state.placements[slot];if(!v)return;
 const b=document.createElement('button');b.className='creation'+(slot==='lantern'?' lit':'');b.setAttribute('aria-label','Edit your '+defs[v.type].name);b.style.width=(portrait?phoneWidth:width)+'%';position(b,portrait?tall:wide);b.innerHTML=svgArt(v.type,v.art,{tight:true});b.onclick=()=>openPaint(v.type,slot);$('#scene-items').append(b);
}
function renderScene(){
 mount.dataset.place=scene;mount.dataset.placing=String(!!pending);$('#crossroads').hidden=scene==='crossroads';$('#place-title').textContent=scenes[scene].title;
 $('#scene-message').textContent=pending?'Choose a glowing branch for your decoration.':scenes[scene].text;
 $('#scene-items').replaceChildren();$('#scene-actions').replaceChildren();$('#places').disabled=!!pending;$('#crossroads').disabled=!!pending;
 if(pending){
  (portrait?branchesTall:branchesWide).forEach((xy,i)=>{const b=document.createElement('button');b.className='branch';position(b,xy);b.textContent=state.placements['tree'+i]?'↺':'+';b.setAttribute('aria-label',(state.placements['tree'+i]?'Replace decoration on':'Choose')+' branch '+(i+1));b.onclick=()=>{state.placements['tree'+i]=pending;delete state.edits['tree'+i];pending=null;save();renderScene();$('#scene-message').textContent='Your colours belong here. What shall we make next?';onSceneNarration('square','tree_reward',false);};$('#scene-items').append(b);});
  action('Keep painting',()=>{const p=pending;pending=null;renderScene();openPaint(p.type,null,p.art);});
  action('Choose later',()=>{stopNarration();pending=null;sceneCue='village_tree';renderScene();});
 }else if(scene==='crossroads'){
  hotspot('Our burrow',[19,66],[28,59],()=>travel('home'));
  hotspot('Woodland Search',[51,42],[51,43],()=>travel('woods'));
  hotspot('Christmas village',[81,56],[75,49],()=>travel('market'));
 }else if(scene==='home'){
  hotspot('Colour a window star',[31,70],[33,60],()=>openPaint('window',state.placements.window?'window':null));
  hotspot('Step outside',[76,45],[76,43],()=>go('crossroads'));
  action('Make a window star',()=>openPaint('window',state.placements.window?'window':null));action('Explore the village',()=>go('crossroads'));
 }else if(scene==='market'){
  hotspot('The village tree',[57,43],[56,41],()=>travel('square',{row:1,wide:[[50,85],[53,68],[55,57]],tall:[[50,82],[52,67],[54,57]],scale:.62}));hotspot('Alder’s workshop',[34,48],[31,49],()=>travel('approach',{row:0,wide:[[50,85],[44,72],[35,59]],tall:[[50,82],[41,70],[32,59]],scale:.67}));
  action('Our Christmas tree',()=>go('square'));action('Visit Alder',()=>go('approach'));action('Home to the burrow',()=>go('home'));
 }else if(scene==='square'){
  hotspot('Make a decoration',[50,72],[50,62],()=>openDialog('activities-dialog'));
  action('Make a tree decoration',()=>openDialog('activities-dialog'));action('Visit Alder',()=>go('approach'));action('Go home',()=>go('home'));
 }else if(scene==='approach'){
  hotspot('Come inside',[59,51],[59,47],()=>travel('workshop',{row:1,wide:[[50,85],[53,72],[58,67]],tall:[[50,82],[54,69],[59,57]],scale:.67}));
  action('Enter Alder’s workshop',()=>go('workshop'));action('Visit the tree',()=>go('square'));action('Go home',()=>go('home'));
 }else{
  hotspot('Colour a lantern',[46,74],[43,60],()=>openPaint('lantern',state.placements.lantern?'lantern':null));
  const host=document.createElement('img');host.id='alder-host';host.src=ASSETS+'Alder_Welcome.webp';host.alt='Alder the badger welcomes you at his workbench';host.style.width=portrait?'45%':'31%';host.style.left=portrait?'70%':'68%';host.style.top=portrait?'45%':'53%';const hostWindow=document.createElement('div');hostWindow.style.cssText='position:absolute;inset:0;pointer-events:none;clip-path:inset(0 0 '+(portrait?'45.2':'34.4')+'% 0)';hostWindow.append(host);$('#scene-items').append(hostWindow);
  action('Make my lantern',()=>openPaint('lantern',state.placements.lantern?'lantern':null));action('Step outside',()=>go('approach'));
 }
 if(scene==='home')creation('window',[31,23],[33,34],11,17);
 if(scene==='approach')creation('lantern',[76.6,72.2],[79,56.2],9,14);
 if(scene==='square'&&!pending)branchesWide.forEach((xy,i)=>creation('tree'+i,xy,branchesTall[i],5.5,8));
 syncExplorer();fitTrailSigns();updateSnow();
}
function fitScene(){
 const img=$('#scene-image'), stage=$('#scene-stage');
 if(!img.naturalWidth)return;
 const scale=Math.max(stage.clientWidth/img.naturalWidth,stage.clientHeight/img.naturalHeight);
 const w=img.naturalWidth*scale,h=img.naturalHeight*scale;
 worldWidth=w;worldHeight=h;explorer.style.width=h*(portrait?.19:.24)+'px';
 Object.assign($('#scene-world').style,{width:w+'px',height:h+'px',left:(portrait&&scene==='approach'?Math.min((stage.clientWidth-w)/2,stage.clientWidth-w*.88):(stage.clientWidth-w)/2)+'px',top:(portrait&&scenes[scene].out?Math.min(0,Math.max(stage.clientHeight-h,stage.clientHeight*.84-h*.82)):(stage.clientHeight-h)/2)+'px'});placeBarnaby();fitTrailSigns();
}
function fitTrailSigns(){
 const world=$('#scene-world'),stage=$('#scene-stage'),r=world.getBoundingClientRect();const minY=$('.scene-header nav').getBoundingClientRect().bottom+24;
 world.querySelectorAll('.path-stop').forEach(b=>{const hw=b.offsetWidth/2+10,hh=b.offsetHeight/2;const x=r.left+Number(b.dataset.x)*world.clientWidth/100;const y=r.top+Number(b.dataset.y)*world.clientHeight/100;b.style.left=(Math.max(hw,Math.min(stage.clientWidth-hw,x))-r.left)+'px';b.style.top=(Math.max(minY+hh,Math.min(stage.clientHeight-110-hh,y))-r.top)+'px';});
}
// Keep only three decoded scenery promises. Load a destination once, during its walk.
const scenePictures=new Map();
function loadScenePicture(next){
 const src=ASSETS+scenes[next].file+(portrait?'_Portrait':'')+'.webp';
 let ready=scenePictures.get(src);
 if(ready){scenePictures.delete(src);scenePictures.set(src,ready);return ready;}
 const picture=new Image();picture.decoding='async';picture.src=src;
 ready=picture.decode().then(()=>picture).catch(error=>{scenePictures.delete(src);throw error;});
 scenePictures.set(src,ready);
 while(scenePictures.size>3)scenePictures.delete(scenePictures.keys().next().value);
 return ready;
}
async function go(next,message,voiceCue){
 stopNarration();stopTravel(false);requestedScene=next;const token=++sceneToken,world=$('#scene-world');
 world.classList.add('loading');$('#scene-items').inert=true;mount.setAttribute('aria-busy','true');
 $('#scene-message').textContent='Following the woodland path…';
 try{
  const picture=await loadScenePicture(next);
  if(token!==sceneToken)return;
  const previous=$('#scene-image');picture.id='scene-image';picture.alt=scenes[next].title+' in the snowy Whispering Woods';
  if(previous!==picture)previous.replaceWith(picture);
  const changed=sceneReady&&scene!==next;scene=next;renderScene();fitScene();sceneReady=true;
  if(message)$('#scene-message').textContent=message;
  onSceneNarration(next,voiceCue,changed);
  if(changed){$('#place-title').tabIndex=-1;$('#place-title').focus({preventScroll:true});}
 }catch(error){
  if(token!==sceneToken)return;
  requestedScene=scene;$('#scene-message').textContent='This picture could not load. Open Paths to choose a place and try again.';sceneCue='try_again';readCue('try_again');
 }finally{
  if(token===sceneToken){world.classList.remove('loading');$('#scene-items').inert=false;mount.setAttribute('aria-busy','false');}
 }
}
function openPaint(type,slot=null,value=null){
 edit={type,slot};art=clone(value||(slot?(state.edits[slot]?.art||state.placements[slot]?.art):null)||state.drafts[type]||blank());undo=[];redo=[];stroke=null;
 $('#paint-title').textContent=defs[type].name;
 $('#finish').textContent=slot?.startsWith('tree')?'Put it back on the tree':defs[type].finish;
 renderPaint();openDialog('paint-dialog');paintActions=0;paintCue=slot?'edit_creation':pictureCues[type];introCue=slot?null:paintCue;readCue(paintCue);if(!storageOK)readCue('saving_unavailable',{once:true});
}
function paintStatus(message){
 $('#paint-status').textContent=message||(storageOK?'Your picture saves here as you paint. Take your time.':'Browser saving is unavailable. Use “Save a picture” to keep your art.');
}
function renderPaint(){
 $('#drawing').innerHTML=svgArt(edit.type,art,{interactive:true});$('#undo').disabled=!undo.length;$('#redo').disabled=!redo.length;paintStatus();
}
function saveDraft(){if(edit){if(edit.slot)state.edits[edit.slot]={type:edit.type,art:clone(art)};else state.drafts[edit.type]=clone(art);save();}}
function commit(previous){
 undo.push(previous);if(undo.length>25)undo.shift();redo=[];saveDraft();renderPaint();onPaintAction();
}
function selectColour(c){colour=c;$('#custom-colour').value=c;document.querySelectorAll('[data-colour]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.colour===c));}
document.querySelectorAll('[data-colour]').forEach(b=>b.onclick=()=>selectColour(b.dataset.colour));
$('#custom-colour').oninput=e=>selectColour(e.target.value);
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{stopNarration();tool=b.dataset.tool;paintCue=toolsCue[tool];readCue(paintCue,{once:true});$('.brush-size').hidden=tool!=='brush';document.querySelectorAll('[data-tool]').forEach(x=>x.setAttribute('aria-pressed',x===b));paintStatus(tool==='brush'?'Start on a piece, then paint. Your brush stays inside it.':tool==='erase'?'Tap a piece to clear its colour and brush marks.':'Tap a piece to fill it with your colour.');});
document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{size=+b.dataset.size;document.querySelectorAll('[data-size]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
function fillRegion(id){
 if(tool!=='erase'&&art.fills[id]===colour)return;
 if(tool==='erase'&&!art.fills[id]&&!art.strokes.some(s=>s.region===id))return;
 const prev=clone(art);
 if(tool==='erase'){delete art.fills[id];art.strokes=art.strokes.filter(s=>s.region!==id);}else art.fills[id]=colour;
 commit(prev);
}
$('#drawing').addEventListener('keydown',e=>{
 if((e.key==='Enter'||e.key===' ')&&e.target.dataset.region){e.preventDefault();const id=e.target.dataset.region;fillRegion(id);$('#drawing [data-region="'+id+'"]').focus();}
});
let brushFrame=0,brushMatrix=null;
function point(e){const matrix=brushMatrix||$('#drawing svg').getScreenCTM().inverse();const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix);return [Math.round(Math.max(0,Math.min(800,p.x))*10)/10,Math.round(Math.max(0,Math.min(600,p.y))*10)/10];}
function liveStroke(){
 brushFrame=0;const p=$('#live-stroke');if(p&&stroke)p.setAttribute('d',strokePath(stroke.points));
}
$('#drawing').addEventListener('pointerdown',e=>{
 if(e.button!==0||stroke)return;
 const region=e.target.dataset.region;if(!region)return;e.preventDefault();clearTimeout(encourageTimer);introCue=null;
 if(tool!=='brush'){fillRegion(region);return;}
 if(art.strokes.length>=100||art.strokes.reduce((n,s)=>n+s.points.length,0)>=5000){paintStatus('This picture has lots of brushwork. You can fill pieces, undo a stroke, or finish your creation.');return;}
 brushMatrix=$('#drawing svg').getScreenCTM().inverse();
 beforeStroke=clone(art);stroke={region,colour,size,points:[point(e)],pointer:e.pointerId,limit:Math.min(700,5000-art.strokes.reduce((n,s)=>n+s.points.length,0))};
 const group=e.target.parentElement.querySelector('g');
 group.insertAdjacentHTML('beforeend','<path id="live-stroke" fill="none" stroke="'+colour+'" stroke-width="'+size+'" stroke-linecap="round" stroke-linejoin="round"/>');liveStroke();
 $('#drawing').setPointerCapture(e.pointerId);
});
$('#drawing').addEventListener('pointermove',e=>{
 if(!stroke||stroke.pointer!==e.pointerId)return;
 const p=point(e),last=stroke.points.at(-1);if(Math.hypot(p[0]-last[0],p[1]-last[1])>2&&stroke.points.length<stroke.limit){stroke.points.push(p);if(!brushFrame)brushFrame=requestAnimationFrame(liveStroke);}
});
$('#drawing').addEventListener('pointerup',e=>{
 if(!stroke||stroke.pointer!==e.pointerId)return;
 cancelAnimationFrame(brushFrame);brushFrame=0;brushMatrix=null;
 const {pointer,limit,...completed}=stroke;art.strokes.push(completed);stroke=null;const prev=beforeStroke;beforeStroke=null;commit(prev);
});
function cancelStroke(){cancelAnimationFrame(brushFrame);brushFrame=0;brushMatrix=null;if(beforeStroke)art=beforeStroke;stroke=null;beforeStroke=null;if(edit)renderPaint();}
$('#drawing').addEventListener('pointercancel',cancelStroke);
$('#undo').onclick=()=>{if(!undo.length)return;redo.push(clone(art));art=undo.pop();saveDraft();renderPaint();};
$('#redo').onclick=()=>{if(!redo.length)return;undo.push(clone(art));art=redo.pop();saveDraft();renderPaint();};
$('#reset-picture').onclick=()=>openDialog('reset-dialog');
$('#confirm-reset').onclick=()=>{const prev=clone(art);art=blank();commit(prev);closeDialog('reset-dialog');};
$('#finish').onclick=()=>{
 saveDraft();const made={type:edit.type,art:clone(art)},slot=edit.slot;closeDialog('paint-dialog');if(slot)delete state.edits[slot];
 if(made.type==='window'){state.placements.window=made;save();go('home','Your very own star, hanging in our window. Tap it whenever you want to change it.','window_reward');}
 else if(made.type==='lantern'){state.placements.lantern=made;save();go('approach','Your lantern is glowing outside Alder’s door. Those are your colours lighting the snow.','lantern_reward');}
 else if(slot?.startsWith('tree')){state.placements[slot]=made;save();go('square',null,'tree_reward');}
 else{pending=made;go('square',null,'choose_branch');}
};
let exportURL=null;
$('#save-picture').onclick=async()=>{
 if($('#save-picture').disabled)return;$('#save-picture').disabled=true;
 const type=edit.type, snapshot=clone(art);paintStatus('Preparing your picture…');
 const source=svgArt(type,snapshot).replace('aria-hidden="true"','width="1600" height="1200"').replace('<defs>','<rect width="800" height="600" fill="white"/><defs>');
 const url=URL.createObjectURL(new Blob([source],{type:'image/svg+xml'}));
 try{
  const img=new Image();img.src=url;await img.decode();
  const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1200;canvas.getContext('2d').drawImage(img,0,0,1600,1200);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Export failed');
  if(exportURL)URL.revokeObjectURL(exportURL);exportURL=URL.createObjectURL(blob);
  if($('#paint-dialog').open){$('#export-image').src=exportURL;$('#download-picture').href=exportURL;$('#download-picture').download='My-Christmas-'+type+'.png';openDialog('export-dialog');paintStatus();}
 }catch(e){paintStatus('The picture could not be prepared. Please try again.');readCue('try_again');}finally{URL.revokeObjectURL(url);$('#save-picture').disabled=false;}
};

// Barnaby is a sprite character on the path, never painted into the scenery.
const explorer=document.createElement('div');
explorer.id='barnaby-explorer';
explorer.setAttribute('role','img');
explorer.setAttribute('aria-label','Barnaby looking towards his burrow');
explorer.innerHTML='<span class="paw-shadow"></span><canvas width="320" height="320" aria-hidden="true"></canvas>';
$('#scene-world').append(explorer);
const explorerCtx=explorer.querySelector('canvas').getContext('2d');
const walkImage=new Image();
const walkAnchors=[[160.6,254],[145.6,254],[128.2,256],[109.6,255],[162,259],[149.4,259],[136.8,259],[124.6,259],[171.4,257],[159.5,257],[148.8,257],[136.1,257]];
let walker={x:50,y:83,row:0,frame:0,scale:1}, walking=false, walkFrame=0, walkToken=0;
walkImage.onload=()=>drawBarnaby();
walkImage.onerror=()=>{$('#scene-message').textContent='Barnaby’s picture could not load. The paths are still available.';};
walkImage.src=ASSETS+'Barnaby_Crossroads_Walk.webp';
function drawBarnaby(){
 if(!walkImage.naturalWidth)return;
 const cell=walkImage.naturalWidth/4, i=walker.row*4+walker.frame, a=walkAnchors[i];
 explorerCtx.clearRect(0,0,320,320);
 explorerCtx.drawImage(walkImage,walker.frame*cell,walker.row*cell,cell,cell,160-a[0],304-a[1],cell,cell);
}
function placeBarnaby(){
 explorer.style.transform='translate3d('+(walker.x*worldWidth/100)+'px,'+(walker.y*worldHeight/100)+'px,0) translate(-50%,-95%) scale('+walker.scale+')';
}
function syncExplorer(){
 explorer.hidden=!scenes[scene].out;
 if(!walking){walker={x:50,y:portrait?82:85,row:scene==='crossroads'?0:1,frame:0,scale:1};drawBarnaby();}
 explorer.setAttribute('aria-label',scene==='crossroads'?'Barnaby looking towards his burrow':'Barnaby on the village path');
 placeBarnaby();
}
function stopTravel(announce=true){
 cancelAnimationFrame(walkFrame);walkToken++;walking=false;
 $('#scene-items').inert=mount.getAttribute('aria-busy')==='true';
 mount.classList.remove('travelling');$('#stop-walk').hidden=true;$('#places').disabled=!!pending;
 if(announce){walker.frame=0;drawBarnaby();explorer.setAttribute('aria-label','Barnaby waiting on the path');$('#scene-message').textContent='Take your time. Choose a path when you’re ready.';}
}
const routes={
 home:{row:0,wide:[[50,85],[37,77],[24,70],[18,61]],tall:[[50,82],[39,72],[24,62],[19,56]],scale:.66},
 market:{row:2,wide:[[50,85],[64,76],[77,65],[81,54]],tall:[[50,82],[65,70],[80,59],[78,51]],scale:.64},
 woods:{row:1,wide:[[50,85],[51,73],[51,61]],tall:[[50,82],[50,68],[50,55]],scale:.57}
};
function travel(destination,custom){
 if(walking||mount.getAttribute('aria-busy')==='true')return;
 stopNarration();
 const route=custom||routes[destination];if(!route){go(destination);return;}
 const arrive=()=>{stopTravel(false);if(destination==='woods'){location.href='../woodland-search/index.html';}else go(destination);};
 if(calm||!walkImage.complete||!walkImage.naturalWidth){arrive();return;}
 if(scenes[destination])loadScenePicture(destination).catch(()=>{});
 const points=(portrait?route.tall:route.wide).map(p=>p.slice());points[0]=[walker.x,walker.y];
 const world=$('#scene-world'), lengths=points.slice(1).map((p,i)=>Math.hypot((p[0]-points[i][0])*world.clientWidth/100,(p[1]-points[i][1])*world.clientHeight/100));
 const total=lengths.reduce((a,b)=>a+b,0), duration=Math.max(1600,Math.min(3600,total*5.5));
 walking=true;$('#scene-items').inert=true;$('#places').disabled=true;const token=++walkToken;mount.classList.add('travelling');$('#stop-walk').hidden=false;
 $('#scene-message').textContent=destination==='woods'?'Into the woods, together…':destination==='home'?'Home is just a few pawsteps away…':'Let’s follow the lanterns…';
 explorer.setAttribute('aria-label','Barnaby walking '+(route.row===0?'left':route.row===2?'right':'forward'));
 const startScale=walker.scale;walker.row=route.row;let elapsed=0,last=0,lastFrame=-1;
 const step=time=>{
  if(token!==walkToken)return;
  if(document.hidden){last=0;walkFrame=requestAnimationFrame(step);return;}
  if(last)elapsed+=Math.min(time-last,45);last=time;
  const t=Math.min(elapsed/duration,1);let distance=t*total, segment=0;
  while(segment<lengths.length-1&&distance>lengths[segment]){distance-=lengths[segment];segment++;}
  const part=lengths[segment]?distance/lengths[segment]:1;
  walker.x=points[segment][0]+(points[segment+1][0]-points[segment][0])*part;
  walker.y=points[segment][1]+(points[segment+1][1]-points[segment][1])*part;
  walker.scale=startScale+(route.scale-startScale)*t;
  walker.frame=Math.floor(elapsed/125)%4;
  if(lastFrame!==walker.frame){drawBarnaby();lastFrame=walker.frame;}
  placeBarnaby();
  if(t<1)walkFrame=requestAnimationFrame(step);else arrive();
 };
 walkFrame=requestAnimationFrame(step);
}
$('#stop-walk').onclick=()=>stopTravel();
$('#crossroads').onclick=()=>{stopTravel(false);go('crossroads');};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&walking)stopTravel();});
window.addEventListener('pageshow',e=>{if(e.persisted){stopTravel(false);go('crossroads');}});

// Christmas narration uses the proven Woodland voice envelopes and device mix.
const luna=window.jltChristmasAudio,music=window.jltChristmasMusic;
let soundOn=false,caption=null,paintCue='fill_help',helpCue='fill_help',paintActions=0,introCue=null,encourageTimer=0;
const heard=new Set();
const restoredArt=[...Object.values(state.drafts),...Object.values(state.placements).map(p=>p.art),...Object.values(state.edits).map(p=>p.art)].some(a=>Object.keys(a.fills).length||a.strokes.length);
let sceneCue=restoredArt?'welcome_back':'welcome';
const sceneCues={crossroads:'crossroads',home:'burrow',market:'village',square:'village_tree',approach:'alder_door',workshop:'alder_workshop'};
const pictureCues={window:'window_star',star:'wooden_star',bow:'wool_bow',orange:'orange_slice',lantern:'lantern'};
const toolsCue={fill:'fill_help',brush:'brush_help',erase:'clear_help'};
function topDialog(){return [...document.querySelectorAll('dialog[open]')].at(-1);}
function currentCue(){
 const d=topDialog();
 if(d?.id==='activities-dialog')return null;
 if(caption&&(d?d.contains(caption.node):caption.node.id==='scene-message'))return caption.id;
 return d?({ 'places-dialog':'paths_menu','activities-dialog':'village_tree','paint-dialog':paintCue,'reset-dialog':'start_again','export-dialog':'save_picture','luna-help-dialog':helpCue }[d.id]||sceneCue):sceneCue;
}
function restoreCaption(){
 if(caption?.node.isConnected&&caption.node.textContent===caption.text)caption.node.textContent=caption.before;
 caption=null;
}
function showCaption(id){
 const words=window.CHRISTMAS_LUNA.clips[id]?.text;if(!words)return;
 restoreCaption();const d=topDialog();
 const node=d?.querySelector('[data-luna-caption]')||$('#scene-message');
 caption={id,node,before:node.textContent,text:words};node.textContent=words;
}
function stopNarration(immediate=false){
 clearTimeout(encourageTimer);introCue=null;luna.stop({immediate});restoreCaption();
}
function readCue(id,{once=false}={}){
 if(!soundOn||document.hidden||!luna.slots[id]||(once&&heard.has(id)))return;
 showCaption(id);
 void luna.play(id).then(started=>{if(started)heard.add(id);});
}
function refreshSoundButtons(){
 document.querySelectorAll('[data-luna-sound]').forEach(b=>{b.textContent=soundOn?'Sound on':'Sound off';b.setAttribute('aria-pressed',soundOn);});
}
function setSound(value,speak=true){
 soundOn=!!value;luna.setEnabled(soundOn);music.setEnabled(soundOn);refreshSoundButtons();
 if(!soundOn){stopNarration(true);return;}
 void music.start();if(speak&&!walking&&mount.getAttribute('aria-busy')!=='true')readCue(currentCue());
}
const audioButtons='<button type="button" data-luna-listen aria-label="Listen to Luna">Listen</button><button type="button" data-luna-sound aria-pressed="false">Sound off</button>';
$('#sound').setAttribute('data-luna-sound','');
const listen=document.createElement('button');listen.type='button';listen.textContent='Listen';listen.setAttribute('data-luna-listen','');listen.setAttribute('aria-label','Listen to Luna');$('#sound').before(listen);
const paintHelp=document.createElement('dialog');paintHelp.id='luna-help-dialog';paintHelp.className='dialog';paintHelp.setAttribute('aria-labelledby','luna-help-title');
paintHelp.innerHTML='<div class="dialog-head"><h2 id="luna-help-title">A little help</h2><button class="close" aria-label="Close colouring help">✕</button></div><div class="luna-help-choices">'+[['fill_help','Filling colours'],['brush_help','Using the brush'],['clear_help','Clearing a piece'],['undo_redo_help','Undo and redo']].map(([id,label])=>'<button data-help-cue="'+id+'">'+label+'</button>').join('')+'</div>';
mount.append(paintHelp);paintHelp.querySelector('.close').onclick=()=>closeDialog('luna-help-dialog');
document.querySelectorAll('dialog').forEach(d=>{
 const bar=document.createElement('div');bar.className='luna-controls';bar.innerHTML=d.id==='activities-dialog'?'<button type="button" data-luna-sound aria-pressed="false">Sound off</button>':audioButtons;
 if(d.id==='paint-dialog'){
  const hint=d.querySelector('.paint-heading p');hint.setAttribute('data-luna-caption','');hint.setAttribute('aria-live','polite');
  bar.insertAdjacentHTML('beforeend','<button type="button" id="luna-help">Help</button>');
  d.querySelector('.paint-heading>div').append(bar);
 }else{
  const p=document.createElement('p');p.className='luna-caption';p.setAttribute('data-luna-caption','');p.setAttribute('aria-live','polite');d.append(bar,p);
 }
 d.addEventListener('cancel',()=>stopNarration());
});
paintHelp.addEventListener('close',updateSnow);
$('#luna-help').onclick=()=>{helpCue=toolsCue[tool];openDialog('luna-help-dialog');};
document.querySelectorAll('[data-help-cue]').forEach(b=>b.onclick=()=>{stopNarration();helpCue=b.dataset.helpCue;showCaption(helpCue);if(!soundOn)setSound(true,false);readCue(helpCue);});
document.querySelectorAll('[data-luna-sound]').forEach(b=>b.onclick=()=>setSound(!soundOn));
document.querySelectorAll('[data-luna-listen]').forEach(b=>b.onclick=()=>{if(walking||mount.getAttribute('aria-busy')==='true')return;if(!soundOn)setSound(true,false);readCue(currentCue());});
function onSceneNarration(next,cue,changed){
 if(cue){sceneCue=cue;readCue(cue);}
 else if(changed){sceneCue=sceneCues[next];readCue(sceneCue,{once:next!=='crossroads'});}
}
function onPaintAction(){
 introCue=null;paintActions++;clearTimeout(encourageTimer);
 if(!storageOK){readCue('saving_unavailable',{once:true});return;}
 if(paintActions>=4&&!heard.has('encouragement'))encourageTimer=setTimeout(()=>{
  if(topDialog()?.id==='paint-dialog'&&!stroke&&!luna.isPlaying())readCue('encouragement',{once:true});
 },2500);
}
window.addEventListener('christmas-audio-ended',e=>{
 if(e.detail.name===introCue&&topDialog()?.id==='paint-dialog'&&paintActions===0&&tool==='fill'){
  introCue=null;readCue('fill_help',{once:true});
 }
});
window.addEventListener('christmas-audio-error',()=>{
 document.querySelectorAll('[data-luna-listen]').forEach(b=>b.title='Read along, or tap Listen to try Luna again.');
});
window.addEventListener('pagehide',()=>{stopNarration(true);music.stop();});
let snowFrame=0,flakes=[],lastSnow=0;
const snow=$('#snow'),ctx=snow.getContext('2d');
function resizeSnow(){
 const dpr=Math.min(devicePixelRatio||1,1.25);snow.width=Math.round(innerWidth*dpr);snow.height=Math.round(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
 flakes=Array.from({length:portrait?20:32},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:.8+Math.random()*1.7,s:9+Math.random()*15}));
}
function tick(t){
 snowFrame=requestAnimationFrame(tick);if(t-lastSnow<33)return;const dt=Math.min((t-lastSnow)/1000,.08);lastSnow=t;ctx.clearRect(0,0,innerWidth,innerHeight);ctx.fillStyle='#fff9';
 for(const f of flakes){f.y+=f.s*dt;f.x+=Math.sin(t/3000+f.y/100)*4*dt;if(f.y>innerHeight+4){f.y=-4;f.x=Math.random()*innerWidth;}ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,Math.PI*2);ctx.fill();}
}
function updateSnow(){
 cancelAnimationFrame(snowFrame);snowFrame=0;
 const active=scenes[scene].out&&!calm&&!document.hidden&&!document.querySelector('dialog[open]');
 snow.hidden=!active;if(active){lastSnow=performance.now();snowFrame=requestAnimationFrame(tick);}
}
$('#calm').onclick=()=>{calm=!calm;if(calm&&walking)stopTravel();document.body.classList.toggle('calm',calm);$('#calm').setAttribute('aria-pressed',calm);updateSnow();};
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{calm=e.matches;if(calm&&walking)stopTravel();document.body.classList.toggle('calm',calm);$('#calm').setAttribute('aria-pressed',calm);updateSnow();});
document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('page-hidden',document.hidden);updateSnow();if(document.hidden){stopNarration(true);music.stop();}else if(soundOn)void music.start();});
let resizeFrame=0;
window.addEventListener('resize',()=>{
 if(brushMatrix)brushMatrix=null;
 if(resizeFrame)return;
 resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;const p=innerWidth/innerHeight<1.12;if(p!==portrait){portrait=p;go(requestedScene);}else fitScene();resizeSnow();updateSnow();});
});
resizeSnow();go('crossroads');
})();
