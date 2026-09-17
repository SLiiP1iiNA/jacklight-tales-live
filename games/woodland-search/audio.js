(() => {
const get=id=>document.getElementById(id), audio=get('story-audio');
let tracks=[], queue=[], current=-1, loadedSeries=null, loading=false;

function mix(items){for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items;}
function refill(){queue=tracks.map((_,i)=>i);if(get('random-audio')?.checked)mix(queue);}
function setMobileState(playing){const button=get('mobile-audio');if(!button)return;button.setAttribute('aria-pressed',String(playing));button.textContent=playing?'❚❚ Pause story':'♫ Story audio';}
function reset(list,seriesNumber){audio.pause();audio.removeAttribute('src');audio.load();tracks=list;current=-1;loadedSeries=seriesNumber;refill();get('play-audio').disabled=!tracks.length;get('next-audio').disabled=!tracks.length;get('play-audio').textContent='Play story';setMobileState(false);get('audio-status').textContent=tracks.length?`${tracks.length} stories ready. Choose Play when you like.`:'This series is not available yet.';}

async function loadSeries(seriesNumber){
 if(loading)return tracks.length;
 loading=true;
 get('load-series').disabled=true;
 get('audio-status').textContent='Opening the audiobook shelf…';
 try{
  const response=await fetch('../../content/audio-library.json',{cache:'no-store'});
  if(!response.ok)throw new Error('catalog');
  const catalog=await response.json();
  const series=catalog.series?.find(item=>Number(item.number)===Number(seriesNumber));
  if(!series){reset([],seriesNumber);return 0;}
  const list=[];
  const padding=Number(catalog.numberPadding)||3;
  for(let i=0;i<series.episodeCount;i++){
   const episode=series.startEpisode+i;
   let src=series.audioOverrides?.[episode];
   if(!src){
    const padded=String(episode).padStart(padding,'0');
    const filename=(catalog.filenameRule||'episode-{episode}.mp3').replace('{episode}',padded);
    src=new URL(`../../${series.folder.replace(/^\/+|\/$/g,'')}/${filename}`,location.href).href;
   }
   if(series.audioOverrides?.[episode])list.push({src,title:`Series ${series.number} · Episode ${episode}`});
  }
  reset(list,seriesNumber);
  return list.length;
 }catch{
  reset([],seriesNumber);
  get('audio-status').textContent='The story shelf could not open. Please try again.';
  return 0;
 }finally{
  loading=false;
  get('load-series').disabled=false;
 }
}

async function next(){
 if(!tracks.length)return;
 if(!queue.length)refill();
 current=queue.shift();
 const track=tracks[current];
 audio.src=track.src;
 get('audio-status').textContent=track.title;
 try{await audio.play();}catch{get('audio-status').textContent=`${track.title} is ready. Tap Play to begin.`;}
}

get('play-audio').addEventListener('click',async()=>{
 if(!tracks.length)await loadSeries(get('series').value);
 if(!tracks.length)return;
 if(current<0){await next();return;}
 if(audio.paused){try{await audio.play();}catch{get('audio-status').textContent='This story could not start. Try another one.';}}else audio.pause();
});
get('next-audio').addEventListener('click',next);
get('random-audio').addEventListener('change',refill);
get('load-series').addEventListener('click',()=>loadSeries(get('series').value));
get('series').addEventListener('change',()=>{reset([],null);get('audio-status').textContent='Press “Load this series” to open this shelf.';});

const mobileAudio=get('mobile-audio');
mobileAudio?.addEventListener('click',async()=>{
 if(!tracks.length||loadedSeries!==1)await loadSeries(1);
 if(!tracks.length)return;
 if(current<0){await next();return;}
 if(audio.paused){try{await audio.play();}catch{get('audio-status').textContent='Tap again to start the story.';}}else audio.pause();
});

audio.addEventListener('ended',next);
audio.addEventListener('play',()=>{get('play-audio').textContent='Pause story';setMobileState(true);});
audio.addEventListener('pause',()=>{get('play-audio').textContent='Play story';setMobileState(false);});
audio.addEventListener('error',()=>{get('audio-status').textContent='This story could not play. Try the next one.';setMobileState(false);});
})();
