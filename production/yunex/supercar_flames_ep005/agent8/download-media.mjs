#!/usr/bin/env node
// Download only SOURCE-LOCKED GitHub Actions assets named in edit-manifest.json.
// Do not fall back to old EP005 A1-A5 material when an asset is missing.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolveArtifactDestination} from './source-layout.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=process.cwd();
const manifest=JSON.parse(fs.readFileSync(path.resolve(process.env.EP005_MANIFEST_PATH || path.join(HERE,'edit-manifest.json')),'utf8'));
const all=[...manifest.beats.map(x=>({id:x.id,media:x.media}))];
if(manifest.voice.approved) all.push({id:'voice',media:manifest.voice});
for(let i=0;i<(manifest.optionalAudioBeds||[]).length;i++) all.push({id:'bed'+i,media:manifest.optionalAudioBeds[i]});
if(all.some(x=>!x.media.approved)) throw new Error('Media approval is missing: no legacy fallback');
const visited=new Set();
for(const {id,media} of all) {
  // A direct original recording from the user is NOT a GitHub Actions
  // artifact. Its original bytes must be staged locally by the render
  // environment and independently checksum-verified by master-editor.mjs.
  if(id==='voice' && media.userProvidedOriginal===true) {
    if(media.sourceName!=='openai-fm-cedar-audio.mp3' ||
       media.sha256!=='90dd2e299b1cdd9b7f2d3bc508b064c43dda7bfc36caa345b2f502ec13c200d8' ||
       media.path!=='out/ep005-agent8-sources/user-cedar/openai-fm-cedar-audio.mp3')
      throw new Error('Incorrect user-uploaded original Cedar contract');
    const {absolute}=resolveArtifactDestination(ROOT,{...media,artifactExtractDir:'out/ep005-agent8-sources/user-cedar'});
    if(!fs.existsSync(absolute))
      throw new Error('Original user recording is NOT present in GitHub Actions workspace. Cannot claim audio render: '+absolute);
    continue;
  }
  if(!Number.isInteger(media.artifactRunId)||media.artifactRunId<=0 || typeof media.artifactName!=='string' ||
    !/^[\w.-]+$/.test(media.artifactName)) throw new Error('No GitHub run/artifact provenance for '+id);
  const {absolute, extraction: dest}=resolveArtifactDestination(ROOT,media);
  const key=media.artifactRunId+':'+media.artifactName+':'+dest;
  if(!visited.has(key)){
    fs.mkdirSync(dest,{recursive:true});
    const args=['run','download',String(media.artifactRunId),'-R',
      'YunRah2103/Remotion-gpt-chat','-n',media.artifactName,'-D',dest];
    const result=spawnSync('gh',args,{stdio:'inherit',env:process.env});
    if(result.error||result.status!==0) throw new Error('Download failed for '+id+'; no substitution permitted');
    visited.add(key);
  }
  if(!fs.existsSync(absolute)) throw new Error('Artifact does not contain pinned media '+media.path);
}
console.log('Pinned assets obtained; render stage will reverify every SHA256 and fully decode all source MP4s.');
