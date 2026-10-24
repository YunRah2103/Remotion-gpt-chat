import {normalizeFleetMedia,verifyFleetMedia} from './fleet-media.mjs';
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const jobs=[['V5Supercar','V5-A-Supercar',180],['V5Road','V5-B-Road',180],['V5Rally','V5-C-Rally',180],['V5Fleet','V5-D-Fleet-Comparison',360]];
const chosen=process.argv[2];if(chosen&&!jobs.some(j=>j[0]===chosen))throw Error('Unknown proof composition');
const run=(cmd,args,options={})=>{const r=spawnSync(cmd,args,{stdio:'inherit',...options});if(r.status!==0)throw Error(`${cmd} exited ${r.status}`);return r;};
const sha=spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim();
mkdirSync('out/v5',{recursive:true});
for(const [id,name,frames] of jobs.filter(j=>!chosen||j[0]===chosen)){
 const file=`out/v5/${name}.mp4`;
 run('npx',['remotion','render','src/yunex/modelling-kit/fleet-proof-entry.tsx',id,file,'--gl=swangle','--codec=h264','--pixel-format=yuv420p','--concurrency=2','--crf=18']);
 const rangeNormalized=normalizeFleetMedia(file),stream=verifyFleetMedia(file,{frames});
 writeFileSync(file+'.json',JSON.stringify({composition:id,sourceCommit:sha,rangeNormalized,sha256:createHash('sha256').update(readFileSync(file)).digest('hex'),...stream,visualApproval:'pending'},null,2));
}
