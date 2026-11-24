/* Private, local Christmas journey. Original prototype and save data remain intact. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const ASSETS = 'assets/placeholders/';
const KEY = 'jacklight-christmas-v4';
const clone = x => JSON.parse(JSON.stringify(x));
const scenes = {
 crossroads:{title:'Outside our burrow',file:'Winter_Crossroads',out:true,text:'Choose a path. Make yourself at home.'},
 home:{title:"Barnaby’s burrow",file:'Interior_Burrow',out:false,text:'Make a star for our window.'},
 market:{title:'The Christmas village',file:'Christmas_Village_Background',out:true,text:'A lantern to make. A tree to decorate.'},
 square:{title:'Our Christmas tree',file:'Christmas_Village_Square',out:true,text:'Your colours. Our Christmas tree.'},
 approach:{title:'Alder’s lantern shop',file:'Approach_Lanternmaker',out:true,text:'Alder has left the door open for you.'},
 workshop:{title:'At Alder’s workbench',file:'Interior_Lanternmaker',out:false,text:'Make a lantern. Light up the village.'}
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
let state={version:1,drafts:{},placements:{},edits:{},placementUndo:null}, storageOK=true;
try{
 const raw=JSON.parse(localStorage.getItem(KEY)||'null');
 if(raw?.version===1){
  for(const type of Object.keys(defs))if(raw.drafts?.[type])state.drafts[type]=cleanArt(raw.drafts[type],type);
  for(const [slot,v] of Object.entries(raw.placements||{})){
   if(v&&((slot==='window'&&v.type==='window')||(slot==='lantern'&&v.type==='lantern')||(/^tree[0-7]$/.test(slot)&&['star','bow','orange'].includes(v.type))))state.placements[slot]={type:v.type,art:cleanArt(v.art,v.type)};
  }
  for(const [slot,v] of Object.entries(raw.edits||{})){if(state.placements[slot]&&state.placements[slot].type===v?.type)state.edits[slot]={type:v.type,art:cleanArt(v.art,v.type)};}
  const recovery=raw.placementUndo;
  if(recovery&&/^tree[0-7]$/.test(recovery.slot)){
   const valid=v=>v&&['star','bow','orange'].includes(v.type);
   state.placementUndo={slot:recovery.slot,previous:valid(recovery.previous)?{type:recovery.previous.type,art:cleanArt(recovery.previous.art,recovery.previous.type)}:null,edit:valid(recovery.edit)?{type:recovery.edit.type,art:cleanArt(recovery.edit.art,recovery.edit.type)}:null};
  }
 }
}catch(e){storageOK=false;}
function save(){
 try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch(e){storageOK=false;}
}
let scene='crossroads',requestedScene=scene,portrait=innerWidth/innerHeight<1.12,sceneToken=0,pending=null,uid=0;
let worldWidth=0,worldHeight=0,sceneReady=false;
let edit=null,art=blank(),undo=[],redo=[],colour=palette[0][1],tool='fill',size=18,stroke=null,beforeStroke=null;
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const preferenceKey=KEY+'-preferences';let preferences={};
try{const saved=JSON.parse(localStorage.getItem(preferenceKey)||'{}');if(saved&&typeof saved==='object')preferences=saved;}catch(e){}
const modestDevice=Boolean(navigator.connection?.saveData||(navigator.deviceMemory&&navigator.deviceMemory<=4)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4));
let light=typeof preferences.light==='boolean'?preferences.light:modestDevice;
let calm=motionPreference.matches||preferences.calm===true;
let captionsOn=preferences.captions===true;
function savePreferences(){try{localStorage.setItem(preferenceKey,JSON.stringify(preferences));}catch(e){}}

const mount=$('#market-view');
const icons={
 home:'<path d="m3 11 9-8 9 8M5 10v10h14V10M9 20v-7h6v7"/>',
 map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2ZM9 3v16M15 5v16"/>',
 sound:'<path d="m11 5-6 4H2v6h3l6 4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
 settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>',
 star:'<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.4l6.1-.9Z"/>',
 woods:'<path d="m12 2-6 8h3l-5 7h6v5h4v-5h6l-5-7h3Z"/>',
 lantern:'<path d="M9 6V4a3 3 0 0 1 6 0v2M7 7h10l2 3v11H5V10ZM5 10h14M9 10v11M15 10v11"/>'
};
function icon(name){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>';}

mount.innerHTML='<div id="scene-stage"><div id="scene-camera"><div id="scene-world"><img id="scene-image" alt="" fetchpriority="high" decoding="async"><div id="scene-items"></div></div></div><canvas id="snow" aria-hidden="true"></canvas></div>'+
 '<header class="scene-header"><div class="world-brand"><span>JackLight Tales</span><strong>The Whispering Woods</strong></div><nav aria-label="World controls"><button id="crossroads" class="world-control" aria-label="Return to the crossroads">'+icon('home')+'</button><button id="places" class="world-control labelled-control" aria-label="Open the woodland paths">'+icon('map')+'<span>Explore</span></button><button id="settings" class="world-control" aria-label="Open settings">'+icon('settings')+'</button></nav></header>'+
 '<button id="stop-walk" hidden>Wait, Barnaby</button><footer class="scene-footer"><div class="place-caption"><span class="season-label">A Christmas made by you</span><h1 id="place-title"></h1></div><p id="scene-message" aria-live="polite"></p><div class="scene-actions" id="scene-actions"></div></footer>'+
 '<dialog class="dialog" id="settings-dialog" aria-labelledby="settings-title"><div class="dialog-head"><div><p class="eyebrow">Make yourself comfortable</p><h2 id="settings-title">Your visit</h2></div><button data-close="settings-dialog" aria-label="Close settings">✕</button></div><div class="setting-row"><div><strong>Music &amp; Luna</strong><p>Gentle music and a familiar voice.</p></div><button id="sound" aria-pressed="false">Sound off</button></div><div class="setting-row"><div><strong>Gentle mode</strong><p>No falling snow or animated journeys.</p></div><button id="calm" aria-label="Gentle mode" aria-pressed="'+calm+'">'+(calm?'On':'Off')+'</button></div><div class="setting-row"><div><strong>Light mode</strong><p>Less snow and softer effects for smoother play.</p></div><button id="light-mode" aria-label="Light mode" aria-pressed="'+light+'">'+(light?'On':'Off')+'</button></div><p class="visit-note">Your colours stay saved in this browser.<br>Private preview · not released.</p></dialog>'+
 '<dialog class="dialog" id="places-dialog" aria-labelledby="places-title"><div class="dialog-head"><div><p class="eyebrow">Follow your curiosity</p><h2 id="places-title">Where shall we go?</h2></div><button class="close" data-close="places-dialog" aria-label="Close places">✕</button></div><div class="place-grid">'+[['crossroads','Our woodland paths'],['home','Inside our burrow'],['market','The village'],['square','Our Christmas tree'],['approach','Alder’s shop']].map(([id,t])=>'<button class="place-card" data-go="'+id+'"><img loading="lazy" src="'+ASSETS+scenes[id].file+'.webp" alt=""><strong>'+t+'</strong></button>').join('')+'</div></dialog>'+
 '<dialog class="dialog" id="activities-dialog" aria-labelledby="activities-title"><div class="dialog-head"><div><p class="eyebrow">Something made by you</p><h2 id="activities-title">A gift for our tree</h2><p>Choose a decoration to make your own.</p></div><button class="close" data-close="activities-dialog" aria-label="Close decorations">✕</button></div><div class="activity-grid" id="activity-cards"></div></dialog>'+
 '<dialog class="dialog" id="paint-dialog" aria-labelledby="paint-title"><header class="paint-heading"><div><h2 id="paint-title"></h2><p>Tap to fill. Brush marks stay inside the piece you start on.</p></div><button data-close="paint-dialog" aria-label="Keep picture and close">✕</button></header><div class="paint-layout"><aside class="paintbox" aria-label="Paintbox"><div class="paint-colours"><p class="paintbox-label">Your colours</p><div class="palette">'+palette.map(([name,c])=>'<button class="swatch" style="--paint:'+c+'" data-colour="'+c+'" aria-label="'+name+'" aria-pressed="'+(c===colour)+'"></button>').join('')+'</div><label class="custom-colour">Mix your own colour <input id="custom-colour" type="color" value="'+colour+'" aria-label="Choose any colour"></label></div><div class="paint-tools"><button data-tool="fill" aria-label="Fill a piece" aria-pressed="true">Fill</button><button data-tool="brush" aria-label="Paint with a brush" aria-pressed="false">Brush</button><button data-tool="erase" aria-label="Clear a piece" aria-pressed="false">Clear</button><div class="brush-size" aria-label="Brush size" hidden>'+[8,18,34].map((n,i)=>'<button data-size="'+n+'" aria-label="'+['Small','Medium','Large'][i]+' brush" aria-pressed="'+(n===size)+'">'+['•','●','⬤'][i]+'</button>').join('')+'</div></div><div class="paint-history"><div class="history-tools"><button id="undo">Undo</button><button id="redo">Redo</button></div><button id="reset-picture">Start again</button></div></aside><div class="paper-desk"><div class="drawing-wrap" id="drawing"></div></div></div><footer class="paint-footer"><p id="paint-status" aria-live="polite"></p><div><button id="save-picture">Save a picture</button><button id="finish" class="gold"></button></div></footer></dialog>'+
 '<dialog class="dialog" id="reset-dialog" aria-labelledby="reset-title"><h2 id="reset-title">A fresh sheet?</h2><p>This clears this picture. You can still use Undo afterwards.</p><div class="dialog-actions"><button data-close="reset-dialog">Keep painting</button><button id="confirm-reset" class="gold">Start again</button></div></dialog>'+
 '<dialog class="dialog" id="export-dialog" aria-labelledby="export-title"><div class="dialog-head"><h2 id="export-title">Your Christmas keepsake</h2><button data-close="export-dialog" aria-label="Close picture preview">✕</button></div><img id="export-image" alt="Your finished colouring picture"><p class="storage-note">Save this picture to keep it outside this browser.</p><div class="dialog-actions"><a id="download-picture" class="gold" download>Download PNG</a></div></dialog>';
document.body.classList.toggle('calm',calm);document.body.classList.toggle('light-mode',light);
function shape(r,attrs=''){return '<'+r.tag+' '+r.attrs+' '+attrs+'/>';}
// One set of regions and brush marks serves the editor, bench and placed lantern.
// Material overlays change presentation only; saved colour values remain untouched.
function svgArt(type,value,{interactive=false,tight=false,material=false,lit=false}={}){
 const id='art'+(++uid), shaded=material&&type==='lantern', crafted=material&&!shaded;
 const materials=shaded?'<linearGradient id="'+id+'-edge" x2="1" y2=".3"><stop stop-color="#fff6d7" stop-opacity=".38"/><stop offset=".25" stop-color="#fff" stop-opacity="0"/><stop offset=".72" stop-color="#251607" stop-opacity=".16"/><stop offset="1" stop-color="#150d06" stop-opacity=".45"/></linearGradient><linearGradient id="'+id+'-glass" x2=".9" y2="1"><stop stop-color="#fff9dd" stop-opacity=".48"/><stop offset=".22" stop-color="#fff" stop-opacity=".04"/><stop offset=".75" stop-color="#101c22" stop-opacity=".16"/><stop offset="1" stop-color="#101722" stop-opacity=".35"/></linearGradient><radialGradient id="'+id+'-light" cx=".5" cy=".75" r=".75"><stop stop-color="#fff7c5" stop-opacity=".9"/><stop offset=".32" stop-color="#ffd27d" stop-opacity=".48"/><stop offset="1" stop-color="#ffb952" stop-opacity="0"/></radialGradient><pattern id="'+id+'-grain" width="13" height="38" patternUnits="userSpaceOnUse"><path d="M3 0Q8 15 3 38M10 0Q5 20 10 38" fill="none" stroke="#32200c" stroke-opacity=".12" stroke-width="1"/></pattern>':'';
 const craftMaterials=crafted?'<linearGradient id="'+id+'-craft" x2=".65" y2="1"><stop stop-color="#fff5d9" stop-opacity=".3"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#392217" stop-opacity=".23"/></linearGradient><pattern id="'+id+'-texture" width="12" height="16" patternUnits="userSpaceOnUse"><path d="'+(type==='bow'?'M2 0L6 6L2 12M8 0L12 6L8 12':type==='orange'?'M3 3h.5M9 11h.5':'M3 0Q6 8 3 16')+'" fill="none" stroke="#56371f" stroke-opacity=".12" stroke-width="1.2"/></pattern>':'';
 const shapeMarkup=defs[type].regions.map(r=>{
  const glass=['front','side'].includes(r.id),grain=['frame','foot'].includes(r.id);
  const ink=value.strokes.filter(s=>s.region===r.id).map(s=>'<path d="'+strokePath(s.points)+'" stroke="'+s.colour+'" stroke-width="'+s.size+'" fill="none" stroke-linecap="round" stroke-linejoin="round"/>').join('');
  const craftSurface=crafted?shape(r,'fill="url(#'+id+'-craft)" pointer-events="none"')+shape(r,'fill="url(#'+id+'-texture)" pointer-events="none"'):'';
  const surface=shaded?shape(r,'fill="url(#'+id+(glass?'-glass':'-edge')+')" pointer-events="none"')+(grain?shape(r,'fill="url(#'+id+'-grain)" pointer-events="none"'):'')+(glass&&lit?shape(r,'class="glass-light" fill="url(#'+id+'-light)" pointer-events="none"'):''):'';
  return '<g>'+shape(r,'fill="'+(value.fills[r.id]||'#ffffff')+'"')+'<g clip-path="url(#'+id+'-'+r.id+')" pointer-events="none">'+ink+'</g>'+surface+craftSurface+shape(r,'fill="none" stroke="'+(material?'#493824':'#282523')+'" stroke-width="'+(material?'3':'6')+'" stroke-linejoin="round" pointer-events="none"')+(interactive?shape(r,'fill="transparent" data-region="'+r.id+'" role="button" tabindex="0" aria-label="'+r.label+'"'):'')+'</g>';
 }).join('');
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+(tight?defs[type].view:'0 0 800 600')+'" '+(interactive?'aria-label="Colour '+defs[type].name+'"':'aria-hidden="true"')+'><defs>'+materials+craftMaterials+defs[type].regions.map(r=>'<clipPath id="'+id+'-'+r.id+'">'+shape(r)+'</clipPath>').join('')+'</defs>'+shapeMarkup+'</svg>';
}
function strokePath(points){return points.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ') +(points.length===1?' l.1 .1':'');}
function openDialog(id){cancelLanternReveal();stopNarration();$('#'+id).showModal();updateSnow();if(id!=='paint-dialog')readCue(currentCue(),{once:['places-dialog','activities-dialog'].includes(id)});}
function closeDialog(id){stopNarration();if(id==='paint-dialog'){if(stroke)cancelStroke();saveDraft();endBenchPainting();}$('#'+id).close();updateSnow();}
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeDialog(b.dataset.close));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',updateSnow));
$('#paint-dialog').addEventListener('cancel',()=>{if(stroke)cancelStroke();saveDraft();endBenchPainting();});
$('#paint-dialog').addEventListener('close',()=>{endBenchPainting();if(scene==='workshop')renderScene();});
$('#places').onclick=()=>{if(!pending&&!walking)openDialog('places-dialog');};
$('#settings').onclick=()=>{if(mount.getAttribute('aria-busy')==='true')return;if(walking)stopTravel();openDialog('settings-dialog');};
const woodlandLink=document.createElement('a');woodlandLink.className='place-card';woodlandLink.href='../woodland-search/index.html';woodlandLink.innerHTML='<img loading="lazy" src="../woodland-search/assets/evergreen/09-the-winding-woodland-path.webp" alt=""><strong>Woodland Search</strong>';woodlandLink.onclick=()=>{stopNarration(true);music.stop();};$('.place-grid').append(woodlandLink);
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{closeDialog('places-dialog');go(b.dataset.go);});
$('#activity-cards').innerHTML=['star','bow','orange'].map(t=>'<button class="activity-card" data-art="'+t+'"><span class="mini-art">'+svgArt(t,blank())+'</span><strong>'+defs[t].name+'</strong></button>').join('');
document.querySelectorAll('[data-art]').forEach(b=>b.onclick=()=>{closeDialog('activities-dialog');openPaint(b.dataset.art);});
function action(label,fn){const b=document.createElement('button');b.textContent=label;b.onclick=fn;$('#scene-actions').append(b);return b;}
function position(button,xy){button.dataset.x=xy[0];button.dataset.y=xy[1];button.style.left=xy[0]+'%';button.style.top=xy[1]+'%';}
function hotspot(label,wide,tall,fn){
 const b=document.createElement('button');b.className='path-stop';b.setAttribute('aria-label',label);
 const symbol=/[Ss]tar|decoration|tree/.test(label)?'star':/Woodland/.test(label)?'woods':/lantern|Alder/.test(label)?'lantern':/burrow|inside|outside/.test(label)?'home':'map';
 b.innerHTML='<span class="destination-orb">'+icon(symbol)+'</span><span class="destination-label">'+label+'</span>';position(b,portrait?tall:wide);b.onclick=fn;$('#scene-items').append(b);
}
// Leave the treetop clear for the later story-led star activity.
const branchesWide=[[52,28],[46,38],[57,40],[43,48],[54,50],[40,59],[50,61],[61,60]];
const branchesTall=[[53,28],[47,36],[60,38],[44,45],[57,47],[39,54],[52,56],[66,55]];
const treeCount=()=>branchesWide.reduce((n,_,i)=>n+Number(!!state.placements['tree'+i]),0);
function treeLights(){
 const count=treeCount();if(!count)return;
 const layer=document.createElement('div');layer.className='tree-lights';layer.setAttribute('aria-hidden','true');
 const anchors=portrait?branchesTall:branchesWide;
 // Three small, steady lights per completed decoration. No animation loop or media download.
 anchors.forEach(([x,y],i)=>{if(state.placements['tree'+i])for(let tier=0;tier<3;tier++){
  const dot=document.createElement('span');dot.style.left=(x+[-2.3,2.5,.8][tier])+'%';dot.style.top=(y+[-2,2.4,4][tier])+'%';layer.append(dot);
 }});
 $('#scene-items').append(layer);
}
function creation(slot,wide,tall,width,phoneWidth){
 const v=state.placements[slot];if(!v)return;
 const b=document.createElement('button');b.dataset.slot=slot;b.className='creation'+(slot==='lantern'?' lit':'');b.setAttribute('aria-label','Edit your '+defs[v.type].name);b.style.width=(portrait?phoneWidth:width)+'%';position(b,portrait?tall:wide);b.innerHTML=svgArt(v.type,v.art,{tight:true,material:true});b.onclick=()=>openPaint(v.type,slot);$('#scene-items').append(b);
}
function benchLantern(){
 const stored=state.edits.lantern?.art||state.placements.lantern?.art||state.drafts.lantern||blank();
 const returning=!!state.placements.lantern,label=returning?'Change your lantern':'Colour a lantern';
 const b=document.createElement('button');b.id='bench-lantern';b.className='creation bench-lantern';b.setAttribute('aria-label',label);
 position(b,portrait?[41,55]:[43,64]);b.style.width=(portrait?26:14)+'%';
 b.innerHTML=svgArt('lantern',stored,{tight:true,material:true})+'<span class="bench-invitation">'+label+'</span>';
 b.onclick=()=>openPaint('lantern',state.placements.lantern?'lantern':null);$('#scene-items').append(b);
}
function placedLantern(){
 const placed=state.placements.lantern;if(!placed)return;
 const pool=document.createElement('div');pool.className='lantern-pool';pool.setAttribute('aria-hidden','true');position(pool,portrait?[78,66]:[76,82]);$('#scene-items').append(pool);
 const b=document.createElement('button');b.id='placed-lantern';b.className='creation world-lantern';b.setAttribute('aria-label','Change your lantern');
 b.style.width=(portrait?12.5:8)+'%';position(b,portrait?[79,56.2]:[76.6,72.2]);
 b.innerHTML='<span class="lantern-halo" aria-hidden="true"></span>'+svgArt('lantern',placed.art,{tight:true,material:true,lit:true});
 b.onclick=async()=>{if(await go('workshop'))openPaint('lantern','lantern');};$('#scene-items').append(b);
}
let revealTimer=0,revealSerial=0;
function cancelLanternReveal(){clearTimeout(revealTimer);revealSerial++;mount.classList.remove('lantern-reveal','lantern-ignited');}
function revealLantern(){
 const serial=++revealSerial;sceneCue='lantern_reward';
 if(calm){readCue('lantern_reward');return;}
 mount.classList.add('lantern-reveal');
 $('#scene-message').textContent='A little light, made by you.';
 revealTimer=setTimeout(()=>{
  if(serial!==revealSerial||scene!=='approach')return;
  mount.classList.add('lantern-ignited');
  if(!document.hidden&&!topDialog())readCue('lantern_reward');
 },650);
}
function placeDecoration(slot){
 if(!pending)return;
 const wasComplete=treeCount()===8;
 state.placementUndo={slot,previous:state.placements[slot]?clone(state.placements[slot]):null,edit:state.edits[slot]?clone(state.edits[slot]):null};
 state.placements[slot]=clone(pending);delete state.edits[slot];pending=null;save();renderScene();
 const complete=treeCount()===8;
 if(complete&&!wasComplete)mount.classList.add('tree-celebrating');
 $('#scene-message').textContent=complete?'Every branch made by you. Your Christmas tree is glowing!':'A little more Christmas magic. '+treeCount()+' of 8 branches decorated.';
 fitTrailSigns();fitTreeItems();
 onSceneNarration('square','tree_reward',false);
}
function undoDecoration(){
 const recovery=state.placementUndo;if(!recovery)return;stopNarration();
 if(recovery.previous)state.placements[recovery.slot]=clone(recovery.previous);else delete state.placements[recovery.slot];
 if(recovery.edit)state.edits[recovery.slot]=clone(recovery.edit);else delete state.edits[recovery.slot];
 state.placementUndo=null;save();renderScene();$('#scene-message').textContent='Your last decoration has been undone. Your colouring is still saved.';
 $('#place-title').focus({preventScroll:true});
}
// Lay out all eight targets together, including empty branches, so placing and editing agree.
function footerContentTop(){return Math.min(innerHeight,...Array.from($('.scene-footer').children).filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect().top));}
function fitTreeItems(){
 if(scene!=='square'||!worldWidth)return;
 const r=$('#scene-world').getBoundingClientRect(),header=$('.scene-header nav').getBoundingClientRect();
 const itemSize=Math.max(52,Math.min(78,worldWidth*.052)),gap=itemSize+7;
 const top=header.bottom+32,bottom=Math.max(top+112,Math.min(innerHeight-(portrait?148:92),footerContentTop()-itemSize/2-12));
 const anchors=(portrait?branchesTall:branchesWide).map(([x,y])=>({x:Math.max(32,Math.min(innerWidth-32,r.left+x*worldWidth/100)),y:Math.max(top,Math.min(bottom,r.top+y*worldHeight/100))}));
 for(let pass=0;pass<60;pass++)for(let i=0;i<8;i++)for(let j=i+1;j<8;j++){
  const a=anchors[i],b=anchors[j],dx=b.x-a.x,dy=b.y-a.y;
  if(Math.abs(dx)<gap&&Math.abs(dy)<gap){const horizontal=Math.abs(dx)>=Math.abs(dy),ux=horizontal?(Math.sign(dx)||1):0,uy=horizontal?0:(Math.sign(dy)||1),push=(gap-Math.abs(horizontal?dx:dy))/2+.1;
   a.x=Math.max(32,Math.min(innerWidth-32,a.x-ux*push));b.x=Math.max(32,Math.min(innerWidth-32,b.x+ux*push));
   a.y=Math.max(top,Math.min(bottom,a.y-uy*push));b.y=Math.max(top,Math.min(bottom,b.y+uy*push));
  }
 }
 $('#scene-items').querySelectorAll('[data-slot^="tree"]').forEach(b=>{const a=anchors[Number(b.dataset.slot.slice(4))];b.style.left=(a.x-r.left)+'px';b.style.top=(a.y-r.top)+'px';if(b.classList.contains('creation')){b.style.width=itemSize+'px';b.style.height=itemSize+'px';}});
}
function renderScene(){
 mount.classList.remove('tree-celebrating');mount.classList.toggle('tree-complete',scene==='square'&&treeCount()===8);
 mount.classList.toggle('can-undo-decoration',scene==='square'&&!pending&&!!state.placementUndo);mount.dataset.place=scene;mount.dataset.placing=String(!!pending);$('#crossroads').hidden=scene==='crossroads';$('#place-title').textContent=scenes[scene].title;
 $('#scene-message').textContent=pending?'Choose a glowing branch for your decoration.':scenes[scene].text;
 if(!pending&&scene==='square')$('#scene-message').textContent=treeCount()===8?'Your tree is glowing. Every decoration is yours to change.':treeCount()?treeCount()+' of 8 branches decorated. Shall we make another?':'Eight branches waiting for your colours.';
 if(!pending&&state.placements.lantern&&['approach','workshop'].includes(scene))$('#scene-message').textContent=scene==='approach'?'Your lantern is glowing here. Come inside to change its colours.':'Your lantern, ready for new colours whenever you like.';
 if(!pending&&scene==='home'&&state.placements.window)$('#scene-message').textContent='Your star is hanging in our window. Its colours are yours to change.';
 $('#scene-items').replaceChildren();$('#scene-actions').replaceChildren();$('#places').disabled=!!pending;$('#crossroads').disabled=!!pending;
 if(scene==='square')treeLights();
 if(pending){
  (portrait?branchesTall:branchesWide).forEach((xy,i)=>{const b=document.createElement('button');b.className='branch';position(b,xy);b.textContent=state.placements['tree'+i]?'↺':'+';b.setAttribute('aria-label',(state.placements['tree'+i]?'Replace decoration on':'Choose')+' branch '+(i+1));b.dataset.slot='tree'+i;b.onclick=()=>placeDecoration('tree'+i);$('#scene-items').append(b);});
  action('Keep painting',()=>{const p=pending;pending=null;renderScene();openPaint(p.type,null,p.art);});
  action('Choose later',()=>{stopNarration();pending=null;sceneCue='village_tree';renderScene();});
 }else if(scene==='crossroads'){
  hotspot('Our burrow',[18,53],[28,59],()=>travel('home'));
  hotspot('Woodland Search',[51,42],[51,43],()=>travel('woods'));
  hotspot('Christmas village',[81,56],[75,49],()=>travel('market'));
 }else if(scene==='home'){
  hotspot(state.placements.window?'Change your window star':'Colour a window star',[31,70],[33,60],()=>openPaint('window',state.placements.window?'window':null));
  hotspot('Step outside',[76,45],[76,43],()=>go('crossroads'));
  action(state.placements.window?'Change your window star':'Make a window star',()=>openPaint('window',state.placements.window?'window':null));action('Explore the village',()=>go('crossroads'));
 }else if(scene==='market'){
  hotspot('Home to the burrow',[17,76],[20,72],()=>go('crossroads'));
  hotspot('The village tree',[57,43],[56,41],()=>travel('square',{row:1,wide:[[50,85],[53,68],[55,57]],tall:[[50,82],[52,67],[54,57]],scale:.62}));hotspot('Alder’s workshop',[34,48],[31,49],()=>travel('approach',{row:0,wide:[[50,85],[44,72],[35,59]],tall:[[50,82],[41,70],[32,59]],scale:.67}));
  action('Our Christmas tree',()=>go('square'));action('Visit Alder',()=>go('approach'));action('Home to the burrow',()=>go('home'));
 }else if(scene==='square'){
  hotspot('Back to the village',[23,74],[20,72],()=>go('market'));
  if(state.placementUndo)action('Undo last decoration',undoDecoration).classList.add('placement-undo');
  hotspot('Make a decoration',[67,69],[72,65],()=>openDialog('activities-dialog'));
  action('Make a tree decoration',()=>openDialog('activities-dialog'));action('Visit Alder',()=>go('approach'));action('Go home',()=>go('home'));
 }else if(scene==='approach'){
  hotspot('Back to the village',[40,82],[22,79],()=>go('market'));
  hotspot('Come inside',[59,51],[59,47],()=>travel('workshop',{row:1,wide:[[50,85],[53,72],[58,67]],tall:[[50,82],[54,69],[59,57]],scale:.67}));
  action('Enter Alder’s workshop',()=>go('workshop'));action('Visit the tree',()=>go('square'));action('Go home',()=>go('home'));
 }else{
  benchLantern();
  hotspot('Step outside',[88,50],[80,65],()=>go('approach'));
  const host=document.createElement('img');host.id='alder-host';host.src=ASSETS+'Alder_Welcome.webp';host.alt='Alder the badger welcomes you at his workbench';host.style.width=portrait?'45%':'31%';host.style.left=portrait?'70%':'68%';host.style.top=portrait?'45%':'53%';const hostWindow=document.createElement('div');hostWindow.style.cssText='position:absolute;inset:0;pointer-events:none;clip-path:inset(0 0 '+(portrait?'45.2':'34.4')+'% 0)';hostWindow.append(host);$('#scene-items').append(hostWindow);
  action(state.placements.lantern?'Change your lantern':'Make my lantern',()=>openPaint('lantern',state.placements.lantern?'lantern':null));action('Step outside',()=>go('approach'));
 }
 if(scene==='home')creation('window',[31,23],[33,34],11,17);
 if(scene==='approach')placedLantern();
 if(scene==='square'&&!pending)branchesWide.forEach((xy,i)=>creation('tree'+i,xy,branchesTall[i],5.5,8));
 syncExplorer();fitTrailSigns();fitTreeItems();updateSnow();
}
function fitScene(){
 const img=$('#scene-image'), stage=$('#scene-stage');
 if(!img.naturalWidth)return;
 const scale=Math.max(stage.clientWidth/img.naturalWidth,stage.clientHeight/img.naturalHeight);
 const w=img.naturalWidth*scale,h=img.naturalHeight*scale;
 worldWidth=w;worldHeight=h;explorer.style.width=h*(portrait?.19:.24)+'px';
 Object.assign($('#scene-world').style,{width:w+'px',height:h+'px',left:(portrait&&scene==='approach'?Math.min((stage.clientWidth-w)/2,stage.clientWidth-w*.88):(stage.clientWidth-w)/2)+'px',top:(portrait&&scenes[scene].out?Math.min(0,Math.max(stage.clientHeight-h,stage.clientHeight*.84-h*.82)):(stage.clientHeight-h)/2)+'px'});placeBarnaby();fitTrailSigns();fitTreeItems();
}
function fitTrailSigns(){
 const world=$('#scene-world'),stage=$('#scene-stage'),r=world.getBoundingClientRect();const minY=$('.scene-header nav').getBoundingClientRect().bottom+24;
 const footerTop=footerContentTop();
 world.querySelectorAll('.path-stop').forEach(b=>{
  const label=b.querySelector('.destination-label'),hw=Math.max(b.offsetWidth,label.offsetWidth)/2+12,hh=b.offsetHeight/2,below=label.offsetTop+label.offsetHeight-hh;
  // Tree navigation sits outside the decorating area, including on short screens.
  const x=scene==='square'?(Number(b.dataset.x)<50?hw:stage.clientWidth-hw):r.left+Number(b.dataset.x)*world.clientWidth/100;
  const y=scene==='square'?footerTop-12-below:r.top+Number(b.dataset.y)*world.clientHeight/100;
  b.style.left=(Math.max(hw,Math.min(stage.clientWidth-hw,x))-r.left)+'px';b.style.top=(Math.max(minY+hh,Math.min(footerTop-12-below,y))-r.top)+'px';
 });
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
 while(scenePictures.size>(light?1:3))scenePictures.delete(scenePictures.keys().next().value);
 return ready;
}
async function go(next,message,voiceCue){
 cancelLanternReveal();if(voiceCue==='lantern_reward'&&!calm)mount.classList.add('lantern-reveal');stopNarration();stopTravel(false);requestedScene=next;const token=++sceneToken,world=$('#scene-world');
 world.classList.add('loading');$('#scene-items').inert=true;mount.setAttribute('aria-busy','true');
 $('#scene-message').textContent='Following the woodland path…';
 try{
  const picture=await loadScenePicture(next);
  if(token!==sceneToken)return;
  const previous=$('#scene-image');picture.id='scene-image';picture.alt=scenes[next].title+' in the snowy Whispering Woods';
  if(previous!==picture)previous.replaceWith(picture);
  const changed=sceneReady&&scene!==next;scene=next;renderScene();fitScene();sceneReady=true;
  if(changed&&!calm&&!light)$('#scene-camera').animate([{opacity:0,transform:'scale(1.035)'},{opacity:1,transform:'scale(1)'}],{duration:650,easing:'cubic-bezier(.22,.61,.36,1)'});
  if(message){$('#scene-message').textContent=message;fitTrailSigns();fitTreeItems();}
  if(voiceCue==='lantern_reward')revealLantern();else onSceneNarration(next,voiceCue,changed);
  if(changed){$('#place-title').tabIndex=-1;$('#place-title').focus({preventScroll:true});}
  return true;
 }catch(error){
  if(token!==sceneToken)return;
  cancelLanternReveal();requestedScene=scene;$('#scene-message').textContent='This picture could not load. Open Paths to choose a place and try again.';sceneCue='try_again';readCue('try_again');
 }finally{
  if(token===sceneToken){world.classList.remove('loading');$('#scene-items').inert=false;mount.setAttribute('aria-busy','false');}
 }
}
let benchIntro=null;
function endBenchPainting(){benchIntro?.cancel();benchIntro=null;$('#drawing').inert=false;mount.classList.remove('at-bench','at-craft','at-table');}
function openPaint(type,slot=null,value=null){
 const origin=type==='lantern'?$('#bench-lantern')?.getBoundingClientRect():null;
 $('#paint-dialog').classList.add('craft-mode');$('#paint-dialog').dataset.art=type;
 $('#drawing').style.aspectRatio=defs[type].view.split(' ').slice(2).join('/');
 $('#paint-dialog').classList.toggle('lantern-mode',type==='lantern');$('#paint-dialog').classList.remove('expanded-tools');$('#paint-options').setAttribute('aria-expanded','false');$('#paint-options').textContent='More';
 mount.classList.add('at-craft');mount.classList.toggle('at-table',type==='window');mount.classList.toggle('at-bench',type==='lantern');
 edit={type,slot};art=clone(value||(slot?(state.edits[slot]?.art||state.placements[slot]?.art):null)||state.drafts[type]||blank());undo=[];redo=[];stroke=null;
 $('#paint-title').textContent=defs[type].name;
 $('.paint-heading p').textContent=slot==='lantern'?'Try new colours, then hang your lantern back outside.':slot==='window'?'Try new colours for your window star.':type==='lantern'?'Choose a colour, then touch your lantern.':type==='window'?'Make a wooden star for our window.':'Make something lovely for our tree.';
 $('#finish').textContent=slot?.startsWith('tree')?'Put it back on the tree':slot==='lantern'?'Hang it back outside':defs[type].finish;
 syncPalette(true);renderPaint();openDialog('paint-dialog');paintActions=0;paintCue=slot?'edit_creation':pictureCues[type];introCue=slot?null:paintCue;readCue(paintCue);if(!storageOK)readCue('saving_unavailable',{once:true});
 if(type==='lantern'&&origin&&!calm&&!light){
  const target=$('#drawing').getBoundingClientRect();$('#drawing').inert=true;
  benchIntro=$('#drawing').animate([{transform:'translate('+(origin.x+origin.width/2-target.x-target.width/2)+'px,'+(origin.y+origin.height/2-target.y-target.height/2)+'px) scale('+(origin.width/target.width)+')',opacity:.4},{transform:'none',opacity:1}],{duration:520,easing:'cubic-bezier(.22,.61,.36,1)'});
  benchIntro.finished.then(()=>{$('#drawing').inert=false;}).catch(()=>{});
 }
}
function paintStatus(message){
 $('#paint-status').textContent=message||(storageOK?'Saved on this device.':'Browser saving is unavailable. Use “Save a picture” to keep your art.');
}
function renderPaint(){
 $('#drawing').innerHTML=svgArt(edit.type,art,{interactive:true,tight:true,material:true});$('#undo').disabled=!undo.length;$('#bench-undo').disabled=!undo.length;$('#redo').disabled=!redo.length;paintStatus();
}
function saveDraft(){if(edit){if(edit.slot)state.edits[edit.slot]={type:edit.type,art:clone(art)};else state.drafts[edit.type]=clone(art);save();}}
function commit(previous){
 undo.push(previous);if(undo.length>(light?12:25))undo.shift();redo=[];saveDraft();renderPaint();onPaintAction();
}
let palettePage=0;
const moreColours=document.createElement('button');moreColours.id='more-colours';moreColours.type='button';moreColours.textContent='More colours';moreColours.setAttribute('aria-label','Show more colours');moreColours.hidden=true;$('.palette').after(moreColours);
function syncPalette(followSelection=false){
 const paged=portrait&&innerWidth<=700;
 if(followSelection){const index=palette.findIndex(p=>p[1]===colour);if(index>=0)palettePage=Math.floor(index/8);}
 $('.paint-colours').classList.toggle('paged-colours',paged);moreColours.hidden=!paged;
 document.querySelectorAll('[data-colour]').forEach((b,i)=>{b.hidden=paged&&Math.floor(i/8)!==palettePage;});
 moreColours.setAttribute('aria-label',palettePage?'Show warm colours':'Show cool colours');
}
moreColours.onclick=()=>{palettePage=1-palettePage;syncPalette();};
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
const benchUndo=document.createElement('button');benchUndo.id='bench-undo';benchUndo.textContent='Undo';benchUndo.onclick=()=>$('#undo').onclick();$('.paint-tools').append(benchUndo);
const paintOptions=document.createElement('button');paintOptions.id='paint-options';paintOptions.textContent='More';paintOptions.setAttribute('aria-expanded','false');paintOptions.setAttribute('aria-controls','paint-history colour-mixer save-picture');
$('.paint-history').id='paint-history';$('.custom-colour').id='colour-mixer';
paintOptions.onclick=()=>{const expanded=$('#paint-dialog').classList.toggle('expanded-tools');paintOptions.setAttribute('aria-expanded',expanded);paintOptions.textContent=expanded?'Less':'More';};$('.paint-tools').append(paintOptions);
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
 mount.classList.remove('travelling');$('#scene-camera').style.transform='';$('#stop-walk').hidden=true;$('#places').disabled=!!pending;updateSnow();
 if(announce){walker.frame=0;drawBarnaby();explorer.setAttribute('aria-label','Barnaby waiting on the path');$('#scene-message').textContent='Take your time. Choose a path when you’re ready.';}
}
const routes={
 home:{row:0,wide:[[50,85],[37,77],[24,70],[18,61]],tall:[[50,82],[39,72],[24,62],[19,56]],scale:.66},
 market:{row:2,wide:[[50,85],[64,76],[77,65],[81,54]],tall:[[50,82],[65,70],[80,59],[78,51]],scale:.64},
 woods:{row:1,wide:[[50,85],[51,73],[51,61]],tall:[[50,82],[50,68],[50,55]],scale:.57}
};
function smoothRoute(points){
 const result=[points[0]];
 for(let i=0;i<points.length-1;i++){
  const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
  for(let k=1;k<=12;k++){const t=k/12;result.push([0,1].map(axis=>.5*((2*b[axis])+(-a[axis]+c[axis])*t+(2*a[axis]-5*b[axis]+4*c[axis]-d[axis])*t*t+(-a[axis]+3*b[axis]-3*c[axis]+d[axis])*t*t*t)));}
 }
 return result;
}
function travel(destination,custom){
 if(walking||mount.getAttribute('aria-busy')==='true')return;
 stopNarration();
 const route=custom||routes[destination];if(!route){go(destination);return;}
 const arrive=()=>{stopTravel(false);if(destination==='woods'){location.href='../woodland-search/index.html';}else go(destination);};
 if(calm||!walkImage.complete||!walkImage.naturalWidth){arrive();return;}
 if(scenes[destination])loadScenePicture(destination).catch(()=>{});
 const routePoints=(portrait?route.tall:route.wide).map(p=>p.slice());routePoints[0]=[walker.x,walker.y];const points=smoothRoute(routePoints);
 const world=$('#scene-world'), lengths=points.slice(1).map((p,i)=>Math.hypot((p[0]-points[i][0])*world.clientWidth/100,(p[1]-points[i][1])*world.clientHeight/100));
 const total=lengths.reduce((a,b)=>a+b,0), duration=Math.max(2100,Math.min(5200,total*9));
 walking=true;$('#scene-items').inert=true;$('#places').disabled=true;const token=++walkToken;mount.classList.add('travelling');updateSnow();$('#stop-walk').hidden=false;
 $('#scene-message').textContent=destination==='woods'?'Into the woods, together…':destination==='home'?'Home is just a few pawsteps away…':'Let’s follow the lanterns…';
 explorer.setAttribute('aria-label','Barnaby walking '+(route.row===0?'left':route.row===2?'right':'forward'));
 const startScale=walker.scale;walker.row=route.row;let elapsed=0,last=0,lastFrame=-1,lastRow=-1,stride=0,previousDistance=0;
 const step=time=>{
  if(token!==walkToken)return;
  if(document.hidden){last=0;walkFrame=requestAnimationFrame(step);return;}
  if(last)elapsed+=Math.min(time-last,45);last=time;
  const t=Math.min(elapsed/duration,1), progress=t*t*(3-2*t);let distance=progress*total, segment=0;
  while(segment<lengths.length-1&&distance>lengths[segment]){distance-=lengths[segment];segment++;}
  const part=lengths[segment]?distance/lengths[segment]:1;
  walker.x=points[segment][0]+(points[segment+1][0]-points[segment][0])*part;
  walker.y=points[segment][1]+(points[segment+1][1]-points[segment][1])*part;
  walker.scale=startScale+(route.scale-startScale)*progress;
  // Pose follows distance travelled, so feet slow down with the approach.
  const dx=(points[segment+1][0]-points[segment][0])*worldWidth,dy=(points[segment+1][1]-points[segment][1])*worldHeight;
  const lateral=Math.abs(dx)/Math.max(1,Math.abs(dy));
  if(lateral>.8)walker.row=dx<0?0:2;else if(lateral<.45)walker.row=1;
  stride+=(progress*total-previousDistance)/Math.max(12,worldHeight*.03*walker.scale);previousDistance=progress*total;
  walker.frame=Math.floor(stride)%4;
  if(!light)$('#scene-camera').style.transform='scale('+(1+progress*.035)+')';
  if(lastFrame!==walker.frame||lastRow!==walker.row){explorer.setAttribute('aria-label','Barnaby walking '+(walker.row===0?'left':walker.row===2?'right':'forward'));drawBarnaby();lastFrame=walker.frame;lastRow=walker.row;}
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
let soundOn=false,caption=null,activeCue=null,paintCue='fill_help',helpCue='fill_help',paintActions=0,introCue=null,encourageTimer=0;
const heard=new Set();
const restoredArt=[...Object.values(state.drafts),...Object.values(state.placements).map(p=>p.art),...Object.values(state.edits).map(p=>p.art)].some(a=>Object.keys(a.fills).length||a.strokes.length);
let sceneCue=restoredArt?'welcome_back':'welcome';
const sceneCues={crossroads:'crossroads',home:'burrow',market:'village',square:'village_tree',approach:'alder_door',workshop:'alder_workshop'};
const pictureCues={window:'window_star',star:'wooden_star',bow:'wool_bow',orange:'orange_slice',lantern:'lantern'};
const toolsCue={fill:'fill_help',brush:'brush_help',erase:'clear_help'};
function topDialog(){return [...document.querySelectorAll('dialog[open]')].at(-1);}
function currentCue(){
 const d=topDialog();
 if(d?.id==='activities-dialog'||d?.id==='settings-dialog')return null;
 if(activeCue&&luna.isPlaying())return activeCue;
 return d?({ 'places-dialog':'paths_menu','activities-dialog':'village_tree','paint-dialog':paintCue,'reset-dialog':'start_again','export-dialog':'save_picture','luna-help-dialog':helpCue }[d.id]||sceneCue):sceneCue;
}
function restoreCaption(){
 if(caption?.node.isConnected&&caption.node.textContent===caption.text)caption.node.textContent=caption.before;
 caption=null;mount.classList.remove('narrating');
}
function showCaption(id,force=false){
 const words=window.CHRISTMAS_LUNA.clips[id]?.text;if(!words)return;
 restoreCaption();if(!captionsOn&&!force)return;const d=topDialog();
 const node=d?.querySelector('[data-luna-caption]')||$('#scene-message');
 caption={id,node,before:node.textContent,text:words};node.textContent=words;if(!d)mount.classList.add('narrating');
}
function stopNarration(immediate=false){
 clearTimeout(encourageTimer);introCue=null;activeCue=null;luna.stop({immediate});restoreCaption();
}
function readCue(id,{once=false}={}){
 if(!soundOn||document.hidden||!luna.slots[id]||(once&&heard.has(id)))return;
 activeCue=id;showCaption(id);
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
const captionsRow=document.createElement('div');captionsRow.className='setting-row';
captionsRow.innerHTML='<div><strong>Luna captions</strong><p>Read along while Luna speaks.</p></div><button id="captions" aria-label="Luna captions" aria-pressed="'+captionsOn+'">'+(captionsOn?'On':'Off')+'</button>';
$('#settings-dialog .visit-note').before(captionsRow);
$('#captions').onclick=()=>{captionsOn=!captionsOn;preferences.captions=captionsOn;savePreferences();$('#captions').setAttribute('aria-pressed',captionsOn);$('#captions').textContent=captionsOn?'On':'Off';if(!captionsOn)restoreCaption();};
const listen=document.createElement('button');listen.type='button';listen.className='world-control labelled-control';listen.innerHTML=icon('sound')+'<span>Luna</span>';listen.setAttribute('data-luna-listen','');listen.setAttribute('aria-label','Listen to Luna');$('#settings').before(listen);
const paintHelp=document.createElement('dialog');paintHelp.id='luna-help-dialog';paintHelp.className='dialog';paintHelp.setAttribute('aria-labelledby','luna-help-title');
paintHelp.innerHTML='<div class="dialog-head"><h2 id="luna-help-title">A little help</h2><button class="close" aria-label="Close colouring help">✕</button></div><div class="luna-help-choices">'+[['fill_help','Filling colours'],['brush_help','Using the brush'],['clear_help','Clearing a piece'],['undo_redo_help','Undo and redo']].map(([id,label])=>'<button data-help-cue="'+id+'">'+label+'</button>').join('')+'</div>';
mount.append(paintHelp);paintHelp.querySelector('.close').onclick=()=>closeDialog('luna-help-dialog');
document.querySelectorAll('dialog').forEach(d=>{
 if(d.id==='settings-dialog')return;
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
 else if(changed){const revisit=(state.placements.lantern&&['approach','workshop'].includes(next))||(next==='home'&&state.placements.window);sceneCue=revisit?'edit_creation':sceneCues[next];readCue(sceneCue,{once:next!=='crossroads'});}
}
function onPaintAction(){
 introCue=null;paintActions++;clearTimeout(encourageTimer);
 if(!storageOK){readCue('saving_unavailable',{once:true});return;}
 if(paintActions>=4&&!heard.has('encouragement'))encourageTimer=setTimeout(()=>{
  if(topDialog()?.id==='paint-dialog'&&!stroke&&!luna.isPlaying())readCue('encouragement',{once:true});
 },2500);
}
window.addEventListener('christmas-audio-ended',e=>{
 if(activeCue===e.detail.name)activeCue=null;
 const finishedCaption=caption;
 if((!topDialog()||topDialog()?.id==='paint-dialog')&&finishedCaption?.id===e.detail.name)setTimeout(()=>{if(caption===finishedCaption)restoreCaption();},1800);
 if(e.detail.name===introCue&&topDialog()?.id==='paint-dialog'&&paintActions===0&&tool==='fill'){
  introCue=null;readCue('fill_help',{once:true});
 }
});
window.addEventListener('christmas-audio-error',()=>{
 if(activeCue)showCaption(activeCue,true);
 document.querySelectorAll('[data-luna-listen]').forEach(b=>b.title='Read along, or tap Listen to try Luna again.');
});
window.addEventListener('pagehide',()=>{cancelLanternReveal();stopNarration(true);music.stop();});
let snowFrame=0,flakes=[],lastSnow=0;
const snow=$('#snow'),ctx=snow.getContext('2d');
function resizeSnow(){
 const dpr=Math.min(devicePixelRatio||1,light?1:1.25);snow.width=Math.round(innerWidth*dpr);snow.height=Math.round(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
 flakes=Array.from({length:light?(portrait?8:12):(portrait?20:32)},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:.8+Math.random()*1.7,s:9+Math.random()*15}));
}
function tick(t){
 snowFrame=requestAnimationFrame(tick);if(t-lastSnow<(light?50:33))return;const dt=Math.min((t-lastSnow)/1000,.08);lastSnow=t;ctx.clearRect(0,0,innerWidth,innerHeight);ctx.fillStyle='#fff9';ctx.beginPath();
 for(const f of flakes){f.y+=f.s*dt;f.x+=Math.sin(t/3000+f.y/100)*4*dt;if(f.y>innerHeight+4){f.y=-4;f.x=Math.random()*innerWidth;}ctx.moveTo(f.x+f.r,f.y);ctx.arc(f.x,f.y,f.r,0,Math.PI*2);}ctx.fill();
}
function updateSnow(){
 cancelAnimationFrame(snowFrame);snowFrame=0;
 const active=scenes[scene].out&&!walking&&!calm&&!document.hidden&&!document.querySelector('dialog[open]');
 snow.hidden=!active;if(active){lastSnow=performance.now();snowFrame=requestAnimationFrame(tick);}
}
$('#calm').onclick=()=>{calm=!calm;preferences.calm=calm;savePreferences();if(calm&&walking)stopTravel();document.body.classList.toggle('calm',calm);$('#calm').setAttribute('aria-pressed',calm);$('#calm').textContent=calm?'On':'Off';updateSnow();};
const onMotionPreference=e=>{calm=e.matches||preferences.calm===true;if(calm&&walking)stopTravel();document.body.classList.toggle('calm',calm);$('#calm').setAttribute('aria-pressed',calm);$('#calm').textContent=calm?'On':'Off';updateSnow();};
if(motionPreference.addEventListener)motionPreference.addEventListener('change',onMotionPreference);else motionPreference.addListener(onMotionPreference);
$('#light-mode').onclick=()=>{light=!light;preferences.light=light;savePreferences();document.body.classList.toggle('light-mode',light);$('#light-mode').setAttribute('aria-pressed',light);$('#light-mode').textContent=light?'On':'Off';while(scenePictures.size>(light?1:3))scenePictures.delete(scenePictures.keys().next().value);resizeSnow();updateSnow();};
document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('page-hidden',document.hidden);updateSnow();if(document.hidden){stopNarration(true);music.stop();}else if(soundOn)void music.start();});
let resizeFrame=0;
window.addEventListener('resize',()=>{
 if(brushMatrix)brushMatrix=null;
 if(resizeFrame)return;
 resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;const p=innerWidth/innerHeight<1.12;if(p!==portrait){portrait=p;go(requestedScene);}else fitScene();syncPalette(true);resizeSnow();updateSnow();});
});
resizeSnow();go('crossroads');
})();
