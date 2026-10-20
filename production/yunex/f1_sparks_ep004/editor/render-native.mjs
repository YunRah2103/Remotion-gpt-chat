/**
 * Agent 6 — fail-closed TWO-delivery Remotion render orchestrator.
 * Requires accepted moving visual scenes and the REAL recorded EP004 voice.
 * A saved EDL manifest is not itself evidence of scene approvals or VO origin.
 */
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildPicturePlan, missingPicturePrerequisites} from './timing.ts';
import {verifyNativeMp4} from './native-qa.mjs';

const issue = (message) => {throw new Error('EP004 Agent 6 render preflight: ' + message);};
const run = (bin,args) => {
  try {return execFileSync(bin,args,{encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:32*1024*1024});}
  catch(err) {issue(bin+' failed: '+String(err.stderr || err.message).slice(-2500));}
};

export function validateManifest(m, availableAudioSec) {
  if (!m || typeof m !== 'object') issue('real recorded-VO edit manifest missing');
  const blockers = missingPicturePrerequisites(m.readiness || {
    approvedAgents:[],integrationCommitSha:null,allSixMovingScenesIntegrated:false,
    originalRecordedNarrationPresent:false,wordTimestampsVerifiedAgainstRecording:false,
  });
  if (blockers.length) issue('approved integrated picture and VO absent: '+blockers.join('; '));
  if (!m.originalRecordedAudioFile || /ep003/i.test(m.originalRecordedAudioFile)) issue('must specify EP004-only original audio recording path');
  if (!m.entryFile || /ep003/i.test(m.entryFile)) issue('integrated EP004 composition entry path missing');
  const plan=buildPicturePlan(m.plan);
  if (Number.isFinite(availableAudioSec) && Math.abs(availableAudioSec-plan.audioDurationSec)>0.085) {
    issue('recorded voice measured by ffprobe differs from transcript plan by more than 85ms');
  }
  return plan;
}

export function renderApprovedEditorPair(manifestPath) {
  const filename=resolve(manifestPath);
  if (!existsSync(filename)) issue('no approved edit manifest: '+filename);
  const m=JSON.parse(readFileSync(filename,'utf8'));
  const audio=resolve(m.originalRecordedAudioFile || '');
  const entry=resolve(m.entryFile || '');
  if (!existsSync(audio)) issue('original EP004 audio recording not found at '+audio);
  if (!existsSync(entry)) issue('approved real integrated scene entry absent: '+entry);
  const probe=JSON.parse(run('ffprobe',['-v','error','-show_entries','format=duration','-of','json',audio]));
  const seconds=Number(probe.format?.duration);
  if (!Number.isFinite(seconds) || seconds<=0) issue('unreadable recorded original-VO duration');
  const plan=validateManifest(m,seconds);
  const destination=resolve(m.outputDir||'out/ep004-editor');
  mkdirSync(destination,{recursive:true});
  const variants=[
    ['EP004PictureWithOriginalVO','EP004-original-VO-captions.mp4',true],
    ['EP004CleanWithOriginalVO','EP004-original-VO-clean.mp4',false],
  ];
  const result=[];
  for (const [composition,output,showCaptions] of variants) {
    const propsPath=join(destination,composition+'-props.json');
    const outPath=join(destination,output);
    writeFileSync(propsPath,JSON.stringify({plan,readiness:m.readiness,showCaptions})+'\n');
    run('npx',['remotion','render',entry,composition,outPath,'--props',propsPath,'--gl=swangle','--codec=h264','--pixel-format=yuv420p','--log=error']);
    const evidence=verifyNativeMp4(outPath,plan.totalFrames,{audioRequired:true});
    result.push({composition,output:outPath,evidence});
  }
  writeFileSync(join(destination,'EP004-editor-pair-audit.json'),JSON.stringify(result,null,2)+'\n');
  return result;
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  if (process.argv.length!==3) issue('Usage: node --experimental-strip-types render-native.mjs approved-EP004-manifest.json');
  process.stdout.write(JSON.stringify(renderApprovedEditorPair(process.argv[2]),null,2)+'\n');
}
