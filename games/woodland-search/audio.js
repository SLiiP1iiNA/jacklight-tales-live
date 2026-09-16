(() => {
const get=id=>document.getElementById(id), audio=get('story-audio');
let tracks=[], queue=[], current=-1, urls=[], version=0;
const audioRoots=['../../assets/audio/audiobooks','audio'];
const seriesStarts={1:1,2:31,3:61,4:91,5:121,6:151};
function mix(items){for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items;}
function refill(){queue=tracks.map((_,i)=>i);if(get('random-audio').checked){mix(queue);if(queue.length>1&&queue[0]===current)[queue[0],queue[1]]=[queue[1],queue[0]];}}
function reset(list){audio.pause();audio.removeAttribute('src');audio.load();urls.forEach(URL.revokeObjectURL);urls=[];tracks=list;current=-1;refill();get('play-audio').disabled=!tracks.length;get('next-audio').disabled=!tracks.length;get('play-audio').textContent='Play story';get('audio-status').textContent=tracks.length?`${tracks.length} stories ready. Press Play when you like.`:'No stories in this collection yet.';}
async function next(){
 if(!tracks.length)return;
 if(!queue.length)refill();current=queue.shift();const track=tracks[current];audio.src=track.src;get('audio-status').textContent=track.title;
 try{await audio.play();}catch{get('audio-status').textContent=`${track.title} is ready. Press Play, or try another story if it cannot load.`;}
}
get('play-audio').addEventListener('click',async()=>{if(current<0){await next();return;}if(audio.paused){try{await audio.play();}catch{get('audio-status').textContent='This recording cannot play. Try the next story.';}}else audio.pause();});
get('next-audio').addEventListener('click',next);
get('random-audio').addEventListener('change',()=>{refill();if(current>=0){queue=queue.filter(i=>i!==current);if(!get('random-audio').checked)queue=tracks.map((_,i)=>i).filter(i=>i>current);}});
audio.addEventListener('ended',next);audio.addEventListener('play',()=>get('play-audio').textContent='Pause story');audio.addEventListener('pause',()=>get('play-audio').textContent='Play story');audio.addEventListener('error',()=>get('audio-status').textContent='This recording could not play. Try the next story.');
get('audio-files').addEventListener('change',event=>{version++;const files=[...event.target.files].sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));reset([]);const list=files.map(f=>({src:URL.createObjectURL(f),title:f.name.replace(/\.[^.]+$/,'')}));tracks=list;urls=list.map(t=>t.src);current=-1;refill();get('play-audio').disabled=!list.length;get('next-audio').disabled=!list.length;get('audio-status').textContent=`${list.length} local recordings ready. These stay on your device.`;});
get('load-series').addEventListener('click',async()=>{
 const token=++version,series=get('series').value;
 if(location.protocol==='file:'){get('audio-status').textContent='Choose recordings from this device to listen here, or open with Live Server to load the series folders.';return;}
 get('load-series').disabled=true;get('audio-status').textContent='Looking for this story collection…';const list=[];
 try{
  for(let n=1;n<=30;n++){
   if(token!==version)return;
   const episode=seriesStarts[series]+n-1;
   const files=[`series-${series.padStart(2,'0')}/episode-${String(episode).padStart(3,'0')}.mp3`,`series-${series.padStart(2,'0')}/${String(n).padStart(2,'0')}.mp3`];
   for(const root of audioRoots){
    for(const file of files){
     const src=`${root}/${file}`;
    try{const res=await fetch(src,{method:'HEAD',signal:AbortSignal.timeout(3000)});if(res.ok&&!/text\/html/i.test(res.headers.get('content-type')||'')){list.push({src,title:`Series ${series} · Story ${n}`});break;}}catch{}
    }
    if(list.length&&list[list.length-1].title===`Series ${series} · Story ${n}`)break;
   }
  }
  if(token===version)reset(list);
 }finally{get('load-series').disabled=false;}
});
})();
