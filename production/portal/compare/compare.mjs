const $=id=>document.getElementById(id);
const a=$('a'), b=$('b');
let sourceA,sourceB,notes=[],syncing=false;
const status=t=>{$('status').textContent=t};
const offset=()=>Number($('offset').value)||0;
const duration=()=>Math.min(a.duration||0,Math.max(0,(b.duration||0)-Math.max(0,offset())));
const safeSeek=(v,t)=>{if(v.readyState>=1&&Number.isFinite(v.duration))v.currentTime=Math.max(0,Math.min(v.duration-.001,t))};
function jump(t){
 syncing=true;safeSeek(a,t);safeSeek(b,t+offset());
 $('timeline').value=duration()>0?String(100*t/duration()):'0';$('time').textContent=t.toFixed(2)+' / '+duration().toFixed(2)+'s';
 syncing=false;
}
function sync(){
 if(syncing||!Number.isFinite(a.currentTime))return;
 const target=a.currentTime+offset();
 if(b.readyState>=1&&Math.abs(b.currentTime-target)>.075)safeSeek(b,target);
 $('timeline').value=duration()>0?String(100*a.currentTime/duration()):'0';
 $('time').textContent=a.currentTime.toFixed(2)+' / '+duration().toFixed(2)+'s';
}
a.addEventListener('timeupdate',sync);
a.addEventListener('seeking',sync);
a.addEventListener('ended',()=>b.pause());
for(const [field,video,key] of [['aFile',a,'sourceA'],['bFile',b,'sourceB']]){
 $(field).addEventListener('change',e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>250*1024*1024){status('This local browser viewer limits each file to 250 MB');return}
  const previous=key==='sourceA'?sourceA:sourceB;
  if(previous)URL.revokeObjectURL(previous);
  const url=URL.createObjectURL(file);
  if(key==='sourceA')sourceA=url;else sourceB=url;
  video.src=url;video.load();video.playbackRate=Number($('rate').value);
  video.addEventListener('loadedmetadata',()=>jump(0),{once:true});
  status('Loaded '+file.name+' locally. Matched playback needs both videos.');
 });
}
$('play').addEventListener('click',async()=>{
 if(a.readyState<1||b.readyState<1){status('Load both videos first');return}
 try{await Promise.all([a.play(),b.play()]);status('Comparing at '+$('rate').value+'×')}
 catch(e){status('Playback blocked or unsupported video codec: '+e.message)}
});
$('pause').addEventListener('click',()=>{a.pause();b.pause()});
$('reset').addEventListener('click',()=>{a.pause();b.pause();jump(0)});
$('timeline').addEventListener('input',()=>jump(duration()*Number($('timeline').value)/100));
$('zoom').addEventListener('input',()=>{for(const video of [a,b])video.style.transform='scale('+$('zoom').value+')'});
$('rate').addEventListener('change',()=>{a.playbackRate=b.playbackRate=Number($('rate').value)});
$('offset').addEventListener('change',()=>jump(a.currentTime));
function download(blob,name){
 const url=URL.createObjectURL(blob);
 const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),800);
}
$('capture').addEventListener('click',()=>{
 if(a.readyState<2||b.readyState<2){status('Load and decode both frames first');return}
 try{
  const w=960,h=540,canvas=document.createElement('canvas');canvas.width=w*2;canvas.height=h;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#0e1722';ctx.fillRect(0,0,canvas.width,canvas.height);
  for(const [i,v] of [[0,a],[1,b]]){
   const ratio=Math.min(w/v.videoWidth,h/v.videoHeight);
   const dw=v.videoWidth*ratio,dh=v.videoHeight*ratio;
   ctx.drawImage(v,i*w+(w-dw)/2,(h-dh)/2,dw,dh);
  }
  canvas.toBlob(blob=>blob?download(blob,'comparison-'+a.currentTime.toFixed(2)+'.png'):
    status('Canvas capture failed'), 'image/png');
 }catch(err){status('Browser blocked frame export: '+err.message)}
});
function renderNotes(){
 const holder=$('notes');holder.replaceChildren();
 for(const entry of notes){
  const li=document.createElement('li'),button=document.createElement('button');
  button.textContent=entry.atSeconds.toFixed(2)+'s';
  button.addEventListener('click',()=>jump(entry.atSeconds));
  li.append(button,document.createTextNode(' '+entry.text));holder.append(li);
 }
}
$('addNote').addEventListener('click',()=>{
 const note=$('note').value.trim();if(!note)return;
 notes.push({atSeconds:+a.currentTime.toFixed(3),offsetSeconds:offset(),text:note.slice(0,1000)});
 $('note').value='';renderNotes();
});
$('export').addEventListener('click',()=>download(new Blob([JSON.stringify({
 schemaVersion:1,createdAt:new Date().toISOString(),notes
},null,2)],{type:'application/json'}),'shot-review.json'));
$('clearNotes').addEventListener('click',()=>{notes=[];renderNotes()});
