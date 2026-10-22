#!/usr/bin/env node
// Download only SOURCE-LOCKED GitHub Actions assets named in edit-manifest.json.
// Do not fall back to old EP005 A1-A5 material when an asset is missing.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=process.cwd();
const manifest=JSON.parse(fs.readFileSync(path.join(HERE,'edit-manifest.json'),'utf8'));
const all=[...manifest.beats.map(x=>({id:x.id,media:x.media}))];
if(manifest.voice.approved) all.push({id:'voice',media:manifest.voice});
for(let i=0;i<(manifest.optionalAudioBeds||[]).length;i++) all.push({id:'bed'+i,media:manifest.optionalAudioBeds[i]});
if(all.some(x=>!x.media.approved)) throw new Error('Media approval is missing: no legacy fallback');
const visited=new Set();
for(const {id,media} of all) {
  if(!Number.isInteger(media.artifactRunId)||media.artifactRunId<=0 || typeof media.artifactName!=='string' ||
    !/^[\w.-]+$/.test(media.artifactName)) throw new Error('No GitHub run/artifact provenance for '+id);
  const rel=media.path;
  if(typeof rel!=='string'||!rel.startsWith('out/ep005-agent8-sources/')||
    rel.includes('..')||path.isAbsolute(rel)) throw new Error('Media path must be isolated in out/ep005-agent8-sources: '+id);
  const dest=path.dirname(path.resolve(ROOT,rel));
  const key=media.artifactRunId+':'+media.artifactName+':'+dest;
  if(!visited.has(key)){
    fs.mkdirSync(dest,{recursive:true});
    const args=['run','download',String(media.artifactRunId),'-R',
      'YunRah2103/Remotion-gpt-chat','-n',media.artifactName,'-D',dest];
    const result=spawnSync('gh',args,{stdio:'inherit',env:process.env});
    if(result.error||result.status!==0) throw new Error('Download failed for '+id+'; no substitution permitted');
    visited.add(key);
  }
  if(!fs.existsSync(path.resolve(ROOT,rel))) throw new Error('Artifact does not contain pinned media '+rel);
}
console.log('Pinned assets obtained; render stage will reverify every SHA256 and fully decode all source MP4s.');
