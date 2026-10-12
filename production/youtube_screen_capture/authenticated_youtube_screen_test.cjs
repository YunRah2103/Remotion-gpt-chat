#!/usr/bin/env node
// Authenticated YouTube browser playback proof; only sanitized metadata can exit the workflow.
// Requires existing YOUTUBE_COOKIES_TXT GitHub Actions secret. No file, login UI or cookie values leave the runner.
const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const puppeteer=require('puppeteer-core');
const {launch: streamLaunch,getStream,wss}=require('puppeteer-stream');

const sample=process.env.SAMPLE || 'youtube-watch';
const method=process.env.METHOD || 'x11grab';
const dir=path.resolve(process.env.OUTPUT_DIR || ('out/'+sample+'/'+method));
fs.mkdirSync(dir,{recursive:true});
const sources={
  'control-mp4':'https://raw.githubusercontent.com/chintan9/Big-Buck-Bunny/master/BigBuckBunny480p30s.mp4',
  'youtube-watch':'https://www.youtube.com/watch?v=YE7VzlLtp-4',
  'youtube-embed':'https://www.youtube.com/embed/YE7VzlLtp-4?autoplay=1&mute=0&playsinline=1',
  'youtube-nocookie':'https://www.youtube-nocookie.com/embed/YE7VzlLtp-4?autoplay=1&mute=0&playsinline=1'
};
if(!['youtube-watch','youtube-embed','youtube-nocookie'].includes(sample) || method!=='puppeteer-stream') throw Error('Invalid controlled YouTube test');
let report={sample,method,url:sources[sample],started:new Date().toISOString(),success:false,playbackVerified:false,hasRecordedMotion:false};
const log=(...args)=>console.log(new Date().toISOString(),...args);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser, stream, fileStream, ffmpeg;
function run(prog,args,timeout=15000) {
  return cp.spawnSync(prog,args,{encoding:'utf8',timeout,maxBuffer:5000000});
}
async function pageState(page){
  const results=[];
  for(const frame of page.frames()){
    try {
      const x=await Promise.race([
        frame.evaluate(()=>{
          const vid=document.querySelector('video');
          if(!vid) return {video:false,title:document.title,body:document.body?.innerText?.slice(0,850)||''};
          const q=vid.getVideoPlaybackQuality?.();
          return {video:true,title:document.title,currentTime:vid.currentTime,
            readyState:vid.readyState,paused:vid.paused,ended:vid.ended,videoWidth:vid.videoWidth,videoHeight:vid.videoHeight,
            frames:q?.totalVideoFrames, droppedFrames:q?.droppedVideoFrames,
            error:vid.error?.message||null,body:document.body?.innerText?.slice(0,450)||''};
        }),sleep(5000).then(()=>({timeout:true}))
      ]);
      results.push({frame:frame.url().slice(0,230),...x});
    }catch(e){results.push({frame:frame.url().slice(0,140),error:String(e).slice(0,130)});}
  }
  return results;
}
async function clickPlayback(page){
 for(const f of page.frames()){
  try{await f.evaluate(()=>{
    let v=document.querySelector('video'); if(v){v.muted=false;v.volume=1;v.play().catch(()=>{});}
    for(const sel of ['button.ytp-large-play-button','button.ytp-play-button']){
      const b=document.querySelector(sel);if(b && b.offsetWidth>0){b.click();break;}
    }
  });}catch{}
 }
}
async function captureStream(page){
  report.captureAttempted=true;
  try{
    stream=await Promise.race([getStream(page,{audio:true,video:true,videoBitsPerSecond:1800000}),sleep(14000).then(()=>{throw Error('getStream timed out')})]);
    fileStream=fs.createWriteStream(path.join(dir,'recorded.webm'));
    const ended=new Promise((res,rej)=>{fileStream.on('finish',res);fileStream.on('error',rej);});
    stream.pipe(fileStream);
    log('puppeteer-stream recording started');
    await sleep(5600);
    await stream.destroy();
    await Promise.race([ended,sleep(5000)]);
    log('puppeteer-stream recorded bytes',fs.existsSync(path.join(dir,'recorded.webm'))?fs.statSync(path.join(dir,'recorded.webm')).size:0);
  } catch(e){report.captureError=String(e);log('stream error',String(e));}
}
async function captureX11(){
  report.captureAttempted=true;
  const filename=path.join(dir,'recorded.mp4');
  ffmpeg=cp.spawn('ffmpeg',['-hide_banner','-loglevel','warning','-y','-f','x11grab','-draw_mouse','0',
    '-framerate','24','-video_size','960x540','-i',process.env.DISPLAY||':99',
    '-t','6','-an','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p',filename],{stdio:['ignore','ignore','pipe']});
  let stderr='';
  ffmpeg.stderr.on('data',d=>stderr+=d.toString());
  const code=await Promise.race([new Promise(res=>ffmpeg.on('close',res)),sleep(16000).then(()=>-999)]);
  if(code!==0)report.captureError='ffmpeg code '+code+': '+stderr.slice(-800);
  if(code===-999){ffmpeg.kill('SIGTERM');}
  log('x11 capture code',code);
}
async function runTest(){
 let launchOpts={headless:method==='puppeteer-stream'?'new':false,
   executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
   defaultViewport:{width:960,height:540},args:[
    '--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required',
    '--window-size=960,540','--hide-scrollbars','--disable-background-timer-throttling',
    '--disable-features=TranslateUI','--disable-popup-blocking'
  ]};
 browser=method==='puppeteer-stream'?await streamLaunch(launchOpts):await puppeteer.launch(launchOpts);

 // Import cookies only from this job's GitHub Actions secret and only for Google/YouTube.
 // Never dump secret values, headers, browser profiles, or logged-in screenshots into artifacts.
 const rawSecret = process.env.YOUTUBE_COOKIES_TXT || "";
 let cookies = [], expired = 0, ignored = 0;
 for(const row of rawSecret.split(/\r?\n/)){
   if(!row.trim() || (row.startsWith('#') && !row.startsWith('#HttpOnly_'))) continue;
   const parts=row.trim().split('\t');
   if(parts.length<7){ignored++;continue;}
   let [domain,includeSubs,cookiePath,secure,expires,name,...valueParts]=parts;
   domain=domain.replace(/^#HttpOnly_/,'').toLowerCase();
   const plainDomain=domain.replace(/^\./,'');
   if(!(
     plainDomain==='youtube.com' || plainDomain.endsWith('.youtube.com') ||
     plainDomain==='google.com' || plainDomain.endsWith('.google.com') ||
     plainDomain==='google.co.uk' || plainDomain.endsWith('.google.co.uk')
   )){ignored++;continue;}
   const value=valueParts.join('\t');
   if(!name||!value){ignored++;continue;}
   const exp=Number(expires);
   if(Number.isFinite(exp)&&exp>0&&exp < Date.now()/1000){expired++;continue;}
   const ck={name,value,domain,path:cookiePath||'/',secure:secure==='TRUE',httpOnly:row.startsWith('#HttpOnly_')};
   if(Number.isFinite(exp)&&exp>0)ck.expires=exp;
   cookies.push(ck);
 }
 report.cookieSecretSupplied=rawSecret.length>0;
 report.cookieEntriesParsed=cookies.length;
 report.cookieEntriesExpired=expired;
 report.cookieEntriesIgnored=ignored;
 // Access to the actual values is limited to the runner's Chromium session.
 if(cookies.length>0){
   try{ await browser.setCookie(...cookies); report.cookiesAppliedCount=cookies.length; }
   catch(e){ report.cookiesAppliedError=String(e).slice(0,180); }
 }

 const page=await browser.newPage();
 await page.setViewport({width:960,height:540});
 await page.setRequestInterception(false);
 const errs=[];
 page.on('pageerror',e=>errs.push('pageerror '+String(e).slice(0,300)));
 page.on('requestfailed',r=>{if(errs.length<20)errs.push('failed '+r.url().slice(0,140)+' '+r.failure()?.errorText);});
 const navStart=Date.now();
 try {
   if(sample==='control-mp4'){
     await page.goto('about:blank');
     await page.setContent('<html><body style="margin:0;background:black"><video muted autoplay playsinline controls style="width:960px;height:540px" src="'+sources[sample]+'"></video></body></html>');
   }else {
     await page.goto(sources[sample],{waitUntil:'domcontentloaded',timeout:30000});
   }
 }catch(e){report.navigationError=String(e).slice(0,200);}
 report.navMs=Date.now()-navStart;
 await sleep(4500);
 await clickPlayback(page);
 await sleep(1800);
 report.before=await pageState(page);
 try{await page.screenshot({path:path.join(dir,'before.png')});}catch(e){report.screenshotError=String(e);}
 if(method==='x11grab') {
   // capture while player is running and concurrently test advancement
   const rec=captureX11();
   await sleep(4500);
   report.during=await pageState(page);
   await rec;
 }else{
   const rec=captureStream(page);
   await sleep(4500);
   report.during=await pageState(page);
   await rec;
 }
 report.after=await pageState(page);
 report.failedRequestCount=errs.length;
 report.playbackVerified=report.before.some(a=>a.video&&report.after.some(b=>
   b.video && b.frame===a.frame && b.currentTime>a.currentTime+1.5 && b.videoWidth>0 && b.readyState>=2));
 try{await page.screenshot({path:path.join(dir,'after.png')});}catch{}
 await browser.close();browser=null;
 if(stream && !stream.destroyed)await stream.destroy().catch(()=>{});
 // Verify actual file, video/audio streams, and frame-to-frame differences.
 let file=['recorded.mp4','recorded.webm'].map(x=>path.join(dir,x)).find(x=>fs.existsSync(x)&&fs.statSync(x).size>4096);
 if(file){
  report.bytes=fs.statSync(file).size;
  const probe=run('ffprobe',['-v','error','-show_format','-show_streams','-of','json',file]);
  if(probe.status===0){
    const data=JSON.parse(probe.stdout);
    report.streams=data.streams.map(s=>({codec_type:s.codec_type,codec_name:s.codec_name,width:s.width,height:s.height,avg_frame_rate:s.avg_frame_rate}));
    report.duration=data.format.duration;
  }else report.probeError=probe.stderr.slice(-500);
  const convert=path.join(dir,'playable.mp4');
  if(!file.endsWith('.mp4')){
   const x=run('ffmpeg',['-hide_banner','-v','error','-y','-i',file,'-t','5',
      '-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-c:a','aac',convert],35000);
   if(x.status===0 && fs.existsSync(convert)){
      file=convert;report.mp4Bytes=fs.statSync(file).size;
   }else report.convertError=x.stderr.slice(-500);
  }
  const audioCheck=run('ffmpeg',['-hide_banner','-i',file,'-t','4','-map','0:a:0','-af','volumedetect','-f','null','-'],20000);
  const maxVol=(audioCheck.stderr||'').match(/max_volume:\s*(-?[0-9.]+) dB/);
  report.audioMaxDb=maxVol?Number(maxVol[1]):null;
  report.audibleSoundVerified=Number.isFinite(report.audioMaxDb)&&report.audioMaxDb>-55;
  const decode=run('ffmpeg',['-hide_banner','-v','error','-xerror','-i',file,'-t','4',
     '-map','0:v:0','-f','null','-'],30000);
  report.decodePassed=decode.status===0;
  if(!report.decodePassed)report.decodeError=decode.stderr.slice(-500);
  const hashes=run('ffmpeg',['-hide_banner','-v','error','-i',file,'-vf','fps=1,scale=96:54',
     '-an','-f','framemd5','-'],30000);
  const lines=hashes.stdout.split('\n').filter(l=>l.trim()&&!l.startsWith('#'));
  const hashesUnique=new Set(lines.map(x=>x.split(',').pop()?.trim()));
  report.uniqueFrames=hashesUnique.size;
  report.hasRecordedMotion=hashesUnique.size>=3;
  const pic=run('ffmpeg',['-hide_banner','-v','error','-y','-i',file,'-ss','2','-frames:v','1',
    path.join(dir,'captured_frame.jpg')],15000);
 }
 report.success=Boolean(report.playbackVerified && report.decodePassed && report.hasRecordedMotion);
 report.completed=new Date().toISOString();

 // Strip any account UI text / URLs and remove all recorded media before uploading artifact.
 const minimal=(frames)=>frames?.map(f=>({
   html5Video:!!f.video, seconds:typeof f.currentTime==='number'?f.currentTime:null,
   readyState:f.readyState||0, videoWidth:f.videoWidth||0, videoHeight:f.videoHeight||0,
   frames:f.frames||0, botChallenge:/sign in to confirm you.re not a bot|unusual traffic/i.test(f.body||''),
   playerError153:/error 153/i.test(f.body||''),
   signInPrompt:/sign in|log in/i.test(f.body||'')
 }));
 report.before=minimal(report.before);
 report.during=minimal(report.during);
 report.after=minimal(report.after);
 delete report.failedRequests;
 for(const name of ['recorded.webm','recorded.mp4','playable.mp4','captured_frame.jpg','before.png','after.png']){
    try{fs.unlinkSync(path.join(dir,name));}catch{}
 }

 log('RESULT',JSON.stringify(report));
}
(async()=>{try{await runTest();}catch(e){report.fatalError=String(e?.stack||e).slice(0,2000);log(report.fatalError);}
finally {
 try{if(stream&&!stream.destroyed)await stream.destroy();}catch{}
 try{if(ffmpeg&&!ffmpeg.killed)ffmpeg.kill('SIGTERM');}catch{}
 try{if(browser)await browser.close();}catch{}
 try{if(method==='puppeteer-stream' && wss) (await wss).close();}catch{}

 // Also scrub artifacts after any error path; keep only safe numeric validation results.
 delete report.failedRequests;
 if(Array.isArray(report.before))report.before=report.before.map(f=>({seconds:f.seconds,videoWidth:f.videoWidth,readyState:f.readyState,botChallenge:f.botChallenge,playerError153:f.playerError153,frames:f.frames}));
 if(Array.isArray(report.during))report.during=report.during.map(f=>({seconds:f.seconds,videoWidth:f.videoWidth,readyState:f.readyState,botChallenge:f.botChallenge,playerError153:f.playerError153,frames:f.frames}));
 if(Array.isArray(report.after))report.after=report.after.map(f=>({seconds:f.seconds,videoWidth:f.videoWidth,readyState:f.readyState,botChallenge:f.botChallenge,playerError153:f.playerError153,frames:f.frames}));
 for(const name of ['recorded.webm','recorded.mp4','playable.mp4','captured_frame.jpg','before.png','after.png']){
   try{fs.unlinkSync(path.join(dir,name));}catch{}
 }

 fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2));
 process.exit(report.success?0:2);
}})();
