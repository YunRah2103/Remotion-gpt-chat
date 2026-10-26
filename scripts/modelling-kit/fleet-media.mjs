/** Deterministic SDR delivery gate. Does not resize, interpolate or change frame budgets. */
import {spawnSync} from 'node:child_process';
import {renameSync} from 'node:fs';
function run(command,args,capture=false){const r=spawnSync(command,args,{...(capture?{encoding:'utf8'}:{stdio:'inherit'})});if(r.status!==0)throw Error(`${command} exited ${r.status}: ${r.stderr??''}`);return r;}
function probe(file,count=false){return JSON.parse(run('ffprobe',['-v','error',...(count?['-count_frames']:[]),'-select_streams','v:0','-show_entries','stream=codec_name,width,height,avg_frame_rate,nb_read_frames,pix_fmt,color_range,color_space,color_transfer,color_primaries','-of','json',file],true).stdout).streams[0];}
export function normalizeFleetMedia(file){
 const s=probe(file),full=s.color_range==='pc'||s.pix_fmt?.startsWith('yuvj');
 if(!full&&s.pix_fmt==='yuv420p'&&s.color_range==='tv'&&s.color_space==='bt709')return false;
 const temporary=file+'.limited.mp4';
 run('ffmpeg',['-v','error','-i',file,'-vf',`scale=in_range=${full?'pc':'tv'}:out_range=tv,format=yuv420p`,'-c:v','libx264','-crf','12','-preset','medium','-an','-r','30','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart',temporary,'-y']);
 renameSync(temporary,file);return true;
}
export function verifyFleetMedia(file,{width=1080,height=1920,frames}={}){
 const s=probe(file,true);
 if(s.codec_name!=='h264'||s.width!==width||s.height!==height||s.avg_frame_rate!=='30/1'||Number(s.nb_read_frames)!==frames||s.pix_fmt!=='yuv420p'||s.color_range!=='tv'||s.color_space!=='bt709')throw Error('Native proof contract mismatch: '+JSON.stringify(s));
 run('ffmpeg',['-v','error','-i',file,'-f','null','-']);return s;
}
