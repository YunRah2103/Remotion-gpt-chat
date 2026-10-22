/**
 * Agent13 reproducible NATIVE render. Default: six-shot VIDEO-ONLY WIP.
 * No synthetic Cedar, no guessed subtitle times, no static-frame substitution.
 * Optional --voice manifest.json hard-fails until real MP3 and approvals exist.
 */
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,copyFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {verifyNativeMp4} from './native-qa.mjs';
import {verifyOriginalNarration} from './audio-qa.mjs';
import {buildPicturePlan,missingPicturePrerequisites} from './timing.ts';
import {REVIEW_CUT_FRAMES,REVIEW_SHOTS,REVIEW_TOTAL_FRAMES} from './preview-plan.ts';

const ROOT=resolve(fileURLToPath(new URL('../../../../../',import.meta.url)));
const ENTRY='production/yunex/f1_sparks_ep004/quality/editor/entry.tsx';
const OUTPUT=resolve('out/ep004-agent13');
const cutList=()=>REVIEW_SHOTS.map((shot,i)=>({
 shot,startFrame:REVIEW_CUT_FRAMES[i],endFrameExclusive:REVIEW_CUT_FRAMES[i+1]
}));
function execute(command,args){
 try{return execFileSync(command,args,{encoding:'utf8',
  stdio:['ignore','pipe','pipe'],maxBuffer:64*1024*1024});}
 catch(e){throw Error('Agent13 native '+command+' failed: '+String(e.stderr||e.message).slice(-3000));}
}
function probe(path){
 return JSON.parse(execute('ffprobe',['-v','error','-show_entries',
  'format=duration:stream=codec_type,codec_name,sample_rate,channels',
  '-of','json',path]));
}
function render(id,out,propsPath){
 const args=['remotion','render',ENTRY,id,out,
  '--gl=swangle','--codec=h264','--pixel-format=yuv420p',
  '--concurrency=2','--log=error'];
 if(propsPath)args.push('--props',propsPath);
 execute('npx',args);
}
function shotImages(file,cuts){
 const frames=[0,3,6,12,18,23,24,Math.floor(cuts.at(-1).endFrameExclusive/2),
  cuts.at(-1).endFrameExclusive-1];
 for(const c of cuts){
  frames.push(c.startFrame,Math.floor((c.startFrame+c.endFrameExclusive)/2),
   c.endFrameExclusive-1);
 }
 const unique=[...new Set(frames.filter(n=>n>=0&&n<cuts.at(-1).endFrameExclusive))].sort((a,b)=>a-b);
 for(const frame of unique) {
  const target=join(OUTPUT,'inspect-'+String(frame).padStart(4,'0')+'.png');
  execute('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-y',
    '-i',file,'-vf','select=eq(n\\,'+frame+')','-frames:v','1',target]);
 }
 return unique;
}
function voicePair(manifestPath){
 if(!existsSync(manifestPath))throw Error('No verified owner-supplied original Cedar manifest');
 const m=JSON.parse(readFileSync(manifestPath,'utf8'));
 const original=resolve(m.originalAudioFile??'');
 if(!existsSync(original)||/ep003/i.test(original))throw Error('Original EP004 MP3 not accessible (never synthesize replacement)');
 const audioSeconds=Number(probe(original).format.duration);
 const sha=createHash('sha256').update(readFileSync(original)).digest('hex');
 if(!m.originalAudioSha256||sha!==m.originalAudioSha256)
  throw Error('Recorded original EP004 Cedar SHA-256 mismatch');
 if(!m.originalWordTimesIndependentlyVerified)
  throw Error('Real Cedar word-by-word alignment not independently verified');
 if(!m.ownerPictureApproval||![8,9,10,11,12].every(n=>m.acceptedQualityAgents?.includes(n)))
  throw Error('Agents8-12 need explicit director and owner review approval');
 const missing=missingPicturePrerequisites(m.readiness??{});
 if(missing.length)throw Error('Integrated picture/narration gates missing: '+missing.join(', '));
 const plan=buildPicturePlan(m.plan);
 if(Math.abs(audioSeconds-plan.audioDurationSec)>.03)
  throw Error('Original FFprobe duration differs from word/cut plan');
 if(plan.totalFrames!==Math.ceil(audioSeconds*30)||plan.totalFrames!==REVIEW_TOTAL_FRAMES)
  throw Error('Voice-locked composition must use exact ffprobe-measured full frame count');
 if(plan.cuts[0].sourceStartSec===undefined)
  throw Error('Opening source needs real metal-contact verified sample');
 mkdirSync('public',{recursive:true});
 copyFileSync(original,'public/ep004-agent13-original-cedar.mp3');
 const props={plan,readiness:m.readiness,acceptedQualityAgents:m.acceptedQualityAgents,
  originalAudioSha256:sha};
 mkdirSync(OUTPUT,{recursive:true});
 const propsPath=join(OUTPUT,'verified-voice-props.json');
 writeFileSync(propsPath,JSON.stringify(props,null,2));
 const reports=[];
 for(const [id,label] of [
   ['EP004Agent13OriginalCedarCaptioned','EP004-original-Cedar-captioned.mp4'],
   ['EP004Agent13OriginalCedarClean','EP004-original-Cedar-clean.mp4']
 ]) {
  const target=join(OUTPUT,label);
  render(id,target,propsPath);
  const evidence=verifyNativeMp4(target,plan.totalFrames,{audioRequired:true,cuts:plan.cuts});
  const voice=verifyOriginalNarration(original,target);
  reports.push({id,target,evidence,voice,frames:plan.totalFrames});
 }
 writeFileSync(join(OUTPUT,'ORIGINAL-VO-PAIR-AUDIT.json'),JSON.stringify(reports,null,2));
 return reports;
}
function videoOnly(){
 mkdirSync(OUTPUT,{recursive:true});
 const target=join(OUTPUT,'EP004-WIP-six-shot-VIDEO-ONLY-no-VO.mp4');
 render('EP004Agent13VideoOnlyReview',target,null);
 const cuts=cutList();
 const evidence=verifyNativeMp4(target,REVIEW_TOTAL_FRAMES,{audioRequired:false,cuts});
 const screenshots=shotImages(target,cuts);
 const report={status:'PROVISIONAL VIDEO-ONLY — NOT FINAL',target,
  ownerApproval:false,originalCedarAudioEmbedded:false,
  wordsAligned:false,sourcePRsAccepted:false,
  source:'DRAFT A8-A12 staged adapters + authoritative A2',
  evidence,screenshots,
  visualApproval:'PENDING INDEPENDENT FULL-RES REVIEW'};
 writeFileSync(join(OUTPUT,'WIP-NATIVE-AUDIT.json'),JSON.stringify(report,null,2));
 return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 const result=args.length===0?videoOnly():
  args.length===2&&args[0]==='--voice'?voicePair(args[1]):
  (()=>{throw Error('Usage: node --experimental-strip-types render-native.mjs [--voice verified-manifest.json]');})();
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
}
