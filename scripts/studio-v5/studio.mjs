import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolveConfig,PRESETS} from '../../src/yunex/studio-v5/environment.ts';
const [command,preset='mountain',file=`out/v5/${preset}.json`]=process.argv.slice(2);
if(command==='create'){
 if(existsSync(file))throw Error('Refusing to overwrite '+file);
 const config=resolveConfig({preset});mkdirSync(file.slice(0,file.lastIndexOf('/'))||'.',{recursive:true});writeFileSync(file,JSON.stringify({config},null,2)+'\n');console.log(file);
}else if(command==='validate'||command==='render'){
 const props=JSON.parse(readFileSync(file,'utf8'));resolveConfig(props.config);
 if(command==='validate')console.log('Valid V5 configuration');
 else {const r=spawnSync('npx',['remotion','render','src/yunex/studio-v5/Film.tsx','V5-'+props.config.preset,`out/v5/${preset}.mp4`,'--props='+file,'--gl=swangle','--codec=h264','--pixel-format=yuv420p','--color-space=bt709','--crf=18','--concurrency=2'],{stdio:'inherit'});process.exit(r.status??1);}
}else if(command==='presets')console.log(JSON.stringify(PRESETS,null,2));
else throw Error('Use create <preset> [json], validate <name> <json>, render <name> <json>, or presets');
