/* Small local movement preview. No framework, video, storage changes or network service. */
(() => {
  'use strict';
  const el = id => document.getElementById(id);
  const view=el('market-view'), stage=el('market-stage'), world=el('market-world');
  const scenery=el('market-scenery'), explorer=el('market-explorer');
  const character=el('market-character').getContext('2d');
  const snow=el('market-snow'), flakes=snow.getContext('2d');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const scenes=[
    {file:'Market_Arrival',name:'The Christmas market',next:'Along the lane →',glows:[[10,39],[29,56],[94,44]],path:{x:52,near:78,far:67},hint:'Follow the arrow with Barnaby, or tap ahead on his snowy path.'},
    {file:'Christmas_Lane',name:'The lantern lane',next:'To the village tree →',glows:[[15,60],[35,45],[86,49]],path:{x:76,near:78,far:67},hint:'Warm windows, snowy footsteps. Follow the path beside the tree.'},
    {file:'Village_Square',name:'The village square',next:'At the village tree',glows:[[15,58],[28,51],[94,53]],path:{x:76,near:78,far:67},hint:'A tree waiting for your Christmas colours. Decorating is coming in the next build.'}
  ];
  const sprite=new Image(); sprite.decoding='async';
  sprite.src='assets/placeholders/Barnaby_Market_Walk_Review.webp?v=alternating-stride';
  let index=0, position={x:52,y:74}, walking=null, row=1, lastFrame=-1;
  let w=innerWidth,h=innerHeight,worldW=0,worldH=0,offset=0;
  let raf=0, lastTime=0, snowTime=0, active=true, busy=false, manualCalm=false;
  let spriteReady=false, transitionToken=0;
  const imageCache=new Map();
  const particles=Array.from({length:36},(_,i)=>({x:(i*.61803398875)%1,y:(i*.381966)%1,r:i%4===0?2.5:1.2,speed:8+i%7*2,phase:i*1.7}));
  const calm=()=>manualCalm||reduced.matches;
  const status=text=>{el('market-status').textContent=text;};
  function sceneUrl(i){return `assets/placeholders/${scenes[i].file}_Review${matchMedia('(max-width: 700px)').matches?'_Mobile':''}.webp`;}
  function getScene(i){
    const url=sceneUrl(i);
    if(!imageCache.has(url)){
      const img=new Image();img.decoding='async';img.src=url;
      imageCache.set(url,img.decode().then(()=>img).catch(e=>{imageCache.delete(url);throw e;}));
    }
    return imageCache.get(url);
  }
  function drawSprite(frame=0){
    if(!spriteReady)return;
    const key=row*5+frame;if(key===lastFrame)return;lastFrame=key;
    const sw=sprite.naturalWidth/5,sh=sprite.naturalHeight/2;
    // Align the character, not the generator's uneven empty cell margins.
    // Values are measured head/hip centres in the original 1983px atlas.
    const centres=row===0?[230,615,998,1386,1768]:[232,611,996,1384,1769];
    const anchor=(centres[frame]/1983*5-frame)*320;
    character.clearRect(0,0,320,320);
    character.drawImage(sprite,frame*sw,row*sh,sw,sh,160-anchor,0,320,320);
  }
  function locate(){
    const depth=.73+(position.y-65)/60;
    explorer.style.left=position.x+'%';explorer.style.top=position.y+'%';
    explorer.style.width=(17*depth)+'%';
    // Track the explorer only when the scene is wider than the viewport.
    const focus=w<700&&index>0?w*.82:w*.5;
    offset=Math.max(w-worldW,Math.min(0,focus-worldW*position.x/100));
    const top=w<700?Math.max(h-worldH,Math.min(0,h*.72-worldH*position.y/100)):(h-worldH)/2;
    world.style.transform=`translate3d(${offset}px,${top}px,0)`;
  }
  function resize(){
    w=stage.clientWidth;h=stage.clientHeight;
    worldW=Math.max(w,h*1609/977);worldH=worldW*977/1609;
    world.style.width=worldW+'px';world.style.height=worldH+'px';
    const dpr=Math.min(devicePixelRatio||1,1.25);
    snow.width=Math.round(w*dpr);snow.height=Math.round(h*dpr);flakes.setTransform(dpr,0,0,dpr,0,0);
    locate();lastTime=0;startLoop();
  }
  function updateControls(){
    el('market-back').disabled=busy||!spriteReady||index===0;
    el('market-forward').disabled=busy||!spriteReady||index===scenes.length-1;
    el('market-forward').textContent=busy?'Walking…':scenes[index].next;
    stage.setAttribute('aria-busy',String(busy));
  }
  function stopWalk(){walking=null;el('market-marker').hidden=true;drawSprite(0);}
  function walkTo(target,finish){
    stopWalk();row=target.y<position.y?0:1;
    if(calm()){position={...target};locate();drawSprite(0);finish?.();return;}
    const distance=Math.abs(target.y-position.y);
    if(distance<.15){drawSprite(0);finish?.();return;}
    // Whole strides tie the foot cycle to distance, not to an unrelated timer.
    const cycles=Math.max(1,Math.round(distance/4.5));
    walking={from:{...position},to:target,elapsed:0,duration:cycles*880,cycles,finish};
    drawSprite(1);
    const marker=el('market-marker');marker.style.left=target.x+'%';marker.style.top=target.y+'%';marker.hidden=Boolean(finish);
    startLoop();
  }
  async function travel(direction){
    const next=index+direction;if(busy||!spriteReady||next<0||next>=scenes.length)return;
    busy=true;updateControls();const token=++transitionToken;
    try{
      // Decode before walking: a slow connection cannot reveal an empty scene.
      const image=await getScene(next);
      if(token!==transitionToken||!active)return;
      const path=scenes[index].path;
      const destination={x:path.x,y:direction>0?path.far:path.near};
      walkTo(destination,async()=>{
        view.classList.add('changing');
        if(!calm())await new Promise(resolve=>setTimeout(resolve,280));
        if(token!==transitionToken||!active)return;
        index=next;scenery.src=image.src;el('market-source').srcset=image.src;scenery.alt=scenes[index].name+' in the snowy Whispering Woods';
        const entry=scenes[index].path;
        position={x:entry.x,y:direction>0?74:70};
        row=direction>0?0:1;lastFrame=-1;locate();drawSprite(0);renderLights();
        el('market-place').textContent=scenes[index].name;status(scenes[index].hint);
        view.classList.remove('changing');busy=false;updateControls();
        if(index+1<scenes.length)getScene(index+1).catch(()=>{});
        stage.focus({preventScroll:true});
      });
    }catch{busy=false;updateControls();status('That path could not load. Please try the arrow again.');}
  }
  function renderLights(){
    el('market-lights').replaceChildren(...scenes[index].glows.map(([x,y])=>{
      const light=document.createElement('span');light.className='market-glow';light.style.left=x+'%';light.style.top=y+'%';return light;
    }));
  }
  function animate(time){
    raf=0;if(!active||document.hidden)return;
    const dt=lastTime?Math.min(50,time-lastTime):0;lastTime=time;
    if(walking){
      const walk=walking;walk.elapsed+=dt;
      const t=Math.min(1,walk.elapsed/walk.duration);
      position={x:walk.from.x+(walk.to.x-walk.from.x)*t,y:walk.from.y+(walk.to.y-walk.from.y)*t};
      locate();drawSprite(1+Math.min(walk.cycles*4-1,Math.floor(t*walk.cycles*4))%4);
      if(t===1){walking=null;el('market-marker').hidden=true;drawSprite(0);walk.finish?.();}
    }
    // Snow draws at ~30fps, at bounded resolution and with fewer flakes on phones.
    if(!calm()&&time-snowTime>32){
      const step=Math.min(60,time-snowTime)/1000;snowTime=time;flakes.clearRect(0,0,w,h);
      const count=w<700?22:36;
      for(let i=0;i<count;i++){
        const p=particles[i];p.y=(p.y+p.speed*step/h)%1;
        const x=p.x*w+Math.sin(time*.0003+p.phase)*13;
        flakes.beginPath();flakes.fillStyle=i%4===0?'rgba(255,250,238,.7)':'rgba(255,250,238,.42)';
        flakes.arc(x,p.y*h,p.r,0,Math.PI*2);flakes.fill();
      }
    }
    if(walking||!calm())raf=requestAnimationFrame(animate);
  }
  function startLoop(){if(!raf&&active&&!document.hidden)raf=requestAnimationFrame(animate);}
  function updateMotion(){
    view.classList.toggle('calm',calm());el('market-calm').setAttribute('aria-pressed',String(calm()));
    el('market-calm').textContent=calm()?'Calm motion on':'Calm motion';
    if(calm()){
      flakes.clearRect(0,0,w,h);
      if(walking){const end=walking;walking=null;position={...end.to};locate();drawSprite(0);el('market-marker').hidden=true;end.finish?.();}
    }
    startLoop();
  }
  el('market-forward').onclick=()=>travel(1);el('market-back').onclick=()=>travel(-1);
  el('market-calm').onclick=()=>{manualCalm=!manualCalm;updateMotion();};
  reduced.addEventListener('change',updateMotion);
  stage.addEventListener('pointerup',event=>{
    if(busy||!spriteReady)return;
    const rect=world.getBoundingClientRect();
    const x=(event.clientX-rect.left)/rect.width*100,y=(event.clientY-rect.top)/rect.height*100;
    const path=scenes[index].path;
    if(y<path.far-3||y>path.near+4||Math.abs(x-path.x)>12)return;
    walkTo({x:path.x,y:Math.max(path.far,Math.min(path.near,y))});
    status('Snowy footsteps. Follow the arrow whenever you are ready.');
  });
  stage.addEventListener('keydown',event=>{
    if(!['ArrowUp','ArrowDown','Escape'].includes(event.key))return;
    event.preventDefault();
    if(event.key==='Escape'){
      transitionToken++;stopWalk();busy=false;view.classList.remove('changing');updateControls();status('A little pause in the snow.');
    }else if(event.key==='ArrowUp')travel(1);
    else if(event.key==='ArrowDown')travel(-1);
  });
  el('market-sound').onclick=()=>{
    el('sound').click();const on=el('sound').getAttribute('aria-pressed')==='true';
    el('market-sound').setAttribute('aria-pressed',String(on));el('market-sound').textContent=on?'Sound on':'Sound off';
  };
  const reopen=document.createElement('button');reopen.textContent='Market walk';reopen.id='reopen-market';
  document.querySelector('.top-actions').prepend(reopen);
  el('market-old').onclick=()=>{
    transitionToken++;stopWalk();busy=false;active=false;view.hidden=true;view.classList.remove('changing');
    document.body.classList.remove('market-active');cancelAnimationFrame(raf);raf=0;reopen.focus();
  };
  reopen.onclick=()=>{
    active=true;view.hidden=false;document.body.classList.add('market-active');resize();updateControls();
    const on=el('sound').getAttribute('aria-pressed')==='true';el('market-sound').setAttribute('aria-pressed',String(on));el('market-sound').textContent=on?'Sound on':'Sound off';
    stage.focus();
  };
  document.addEventListener('visibilitychange',()=>{
    view.classList.toggle('paused',document.hidden);lastTime=0;
    if(document.hidden){cancelAnimationFrame(raf);raf=0;}else startLoop();
  });
  new ResizeObserver(resize).observe(stage);
  matchMedia('(max-width: 700px)').addEventListener('change',()=>{
    const current=index;
    getScene(current).then(img=>{
      if(index===current&&!busy){scenery.src=img.src;el('market-source').srcset=img.src;}
    }).catch(()=>{});
  });
  sprite.decode().then(()=>{spriteReady=true;drawSprite(0);updateControls();}).catch(()=>status('Barnaby’s artwork could not load. Please refresh this local preview.'));
  getScene(0).then(img=>{scenery.src=img.src;el('market-source').srcset=img.src;getScene(1).catch(()=>{});}).catch(()=>status('The market image could not load. Please refresh.'));
  renderLights();status(scenes[0].hint);updateControls();updateMotion();resize();
})();
