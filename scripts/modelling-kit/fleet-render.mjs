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
 const probe=spawnSync('ffprobe',['-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=width,height,avg_frame_rate,nb_read_frames','-of','json',file],{encoding:'utf8'});
 if(probe.status!==0)throw Error('FFprobe failed');const stream=JSON.parse(probe.stdout).streams[0];
 if(stream.width!==1080||stream.height!==1920||stream.avg_frame_rate!=='30/1'||Number(stream.nb_read_frames)!==frames)throw Error('Native proof contract mismatch');
 run('ffmpeg',['-v','error','-i',file,'-f','null','-']);
 writeFileSync(file+'.json',JSON.stringify({composition:id,sourceCommit:sha,sha256:createHash('sha256').update(readFileSync(file)).digest('hex'),...stream,visualApproval:'pending'},null,2));
}
