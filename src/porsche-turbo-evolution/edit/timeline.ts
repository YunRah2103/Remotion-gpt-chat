import beatMap from '../../../production/videos/porsche-911-turbo-evolution-001/beat-map.json';

export const FPS=30, WIDTH=1080, HEIGHT=1920, FRAMES=510;
export const GENERATIONS=['930','964','993','996','997','991','992'] as const;
export type Generation=typeof GENERATIONS[number];
export type CameraAngle='front'|'profile'|'rear'|'wheel'|'three-quarter'|'rolling';
export type Framing='auto'|'fullBleed'|'movingPictureField';
export type BeatSlot={
  slot:number;generation:Generation;startFrame:number;endFrame:number;
  durationFrames:number;chapterStart:boolean;chapterIndex:number;
};
export type PorscheShot={
  slot:number;generation:Generation;file:string;shotKey:string;sourceId:string;
  visualFingerprint:string;sourceSha256:string;sourceUrl:string;originCreator:string;
  sourceLicenseStatus:string;sourceInSeconds:number;sourceOutSeconds:number;
  sourceWidth:number;sourceHeight:number;nativeFps:number;angle:CameraAngle;
  identityVerified:true;actualMotionVerified:true;uniqueAngleVerified:true;
  turboIdentityEvidence:string;motionEvidence:string;
  framing?:Framing;cropX?:number;cropY?:number;fullBleedCropVerified?:boolean;
};
export type TimelineShot=BeatSlot&{shot:PorscheShot};
export type AgentAShot={
  slot:number;generation:string;sourceId:string|null;shotKey:string|null;
  sourceUrl:string|null;originCreator:string|null;sourceLicenseStatus:string|null;
  sha256:string|null;width:number|null;height:number|null;fps:number|null;
  sourceInSeconds:number|null;sourceOutSeconds:number|null;
  angleAndMotion:string|null;actualTurboIdentityEvidence:string|null;
  verifiedMovingVideo:boolean;uniqueAngleVerified:boolean;
  visualFingerprint?:string|null;cameraAngle?:CameraAngle|null;motionEvidence?:string|null;
};
export type AgentAManifest={schemaVersion:number;shots:AgentAShot[]};
export type StagedMedia={
  file:string;framing?:Framing;cropX?:number;cropY?:number;
  fullBleedCropVerified?:boolean;
};
const RANGES:ReadonlyArray<readonly [Generation,number,number]>=[
  ['930',1,4],['964',5,8],['993',9,12],['996',13,16],
  ['997',17,20],['991',21,25],['992',26,30],
];
const fail=(message:string):never=>{throw new Error('[PorscheTurboEdit] '+message);};
const raw=beatMap.cuts;
export const BEATS:ReadonlyArray<BeatSlot>=raw.map(c=>{
  const chapterIndex=RANGES.findIndex(([,a,b])=>c.slot>=a&&c.slot<=b);
  if(chapterIndex<0)return fail('Unexpected beat slot '+c.slot);
  return {
    slot:c.slot,generation:RANGES[chapterIndex][0],
    startFrame:c.startFrame,endFrame:c.endFrame,durationFrames:c.durationFrames,
    chapterStart:c.slot===RANGES[chapterIndex][1],chapterIndex,
  };
});
export const assertBeatMap=():void=>{
  if(beatMap.output.frames!==FRAMES||beatMap.output.fps!==FPS||
     beatMap.output.width!==WIDTH||beatMap.output.height!==HEIGHT||
     beatMap.output.seconds!==17)fail('Unexpected output geometry/clock');
  if(raw.length!==30)fail('Must have 30 beat slots');
  raw.forEach((c,i)=>{
    const beat=BEATS[i];
    if(c.slot!==i+1||c.generation!==beat.generation||
       c.startFrame!==(i?raw[i-1].endFrame+1:0)||
       c.durationFrames!==c.endFrame-c.startFrame+1||c.durationFrames<5)
      fail('Wrong chronology / frame gap / overlap at slot '+(i+1));
  });
  if(raw[29].endFrame!==509)fail('Final encoded frame must be 509');
};
assertBeatMap();
const safeFile=(p:string)=>typeof p==='string'&&p.length>0&&
  !/^(?:\/|https?:|data:|file:|\\)/i.test(p)&&
  !p.split(/[\\/]/).some(v=>v==='..'||v==='')&&/\.(mp4|mov|webm)$/i.test(p);

/** GATE ONLY: D still must read file bytes, SHA256, ffprobe and inspect distinct real scenes. */
export const validateShots=(shots:ReadonlyArray<PorscheShot>):TimelineShot[]=>{
  assertBeatMap();
  if(shots.length!==30)fail('Need 30 verified moving sources, got '+shots.length);
  const bySlot=new Map(shots.map(s=>[s.slot,s] as const));
  if(bySlot.size!==30)fail('Duplicate slot assignment');
  const keys=new Set<string>(),prints=new Set<string>(),paths=new Set<string>();
  const spans=new Map<string,Array<[number,number]>>();
  return BEATS.map(beat=>{
    const s=bySlot.get(beat.slot);
    if(!s)return fail('Unassigned slot '+beat.slot);
    if(s.generation!==beat.generation||s.identityVerified!==true||
       s.actualMotionVerified!==true||s.uniqueAngleVerified!==true||
       !s.turboIdentityEvidence?.trim()||!s.motionEvidence?.trim())
      fail('Unverified or wrong-generation Turbo at slot '+beat.slot);
    if(!s.shotKey?.trim()||!s.visualFingerprint?.trim()||
       keys.has(s.shotKey)||prints.has(s.visualFingerprint))
      fail('Reused shot or camera setup at slot '+beat.slot);
    if(!safeFile(s.file)||paths.has(s.file))
      fail('Unsafe, absent or reused staged media path at slot '+beat.slot);
    if(!s.sourceId?.trim()||!/^[0-9a-f]{64}$/i.test(s.sourceSha256)||
       !/^https:\/\//i.test(s.sourceUrl)||!s.originCreator?.trim()||
       !s.sourceLicenseStatus?.trim())
      fail('Missing source provenance at slot '+beat.slot);
    if(!Number.isFinite(s.sourceInSeconds)||s.sourceInSeconds<0||
       !Number.isFinite(s.sourceOutSeconds)||
       s.sourceOutSeconds-s.sourceInSeconds<beat.durationFrames/FPS-.025||
       !Number.isFinite(s.nativeFps)||s.nativeFps<20||s.nativeFps>240||
       !Number.isFinite(s.sourceWidth)||s.sourceWidth<480||
       !Number.isFinite(s.sourceHeight)||s.sourceHeight<360)
      fail('Unsupported/too-short source at slot '+beat.slot);
    if(!['front','profile','rear','wheel','three-quarter','rolling'].includes(s.angle))
      fail('Invalid camera angle at slot '+beat.slot);
    if((s.cropX!==undefined&&(!Number.isFinite(s.cropX)||s.cropX<0||s.cropX>100))||
       (s.cropY!==undefined&&(!Number.isFinite(s.cropY)||s.cropY<0||s.cropY>100)))
      fail('Invalid crop point at slot '+beat.slot);
    if(s.framing==='fullBleed'&&s.sourceWidth/s.sourceHeight>1.2&&
       s.fullBleedCropVerified!==true)
      fail('Full-bleed landscape needs approved visible-car crop at slot '+beat.slot);
    const history=spans.get(s.sourceSha256)??[];
    if(history.some(([a,b])=>s.sourceInSeconds<b-.015&&a<s.sourceOutSeconds-.015))
      fail('Overlapping use of same original media at slot '+beat.slot);
    history.push([s.sourceInSeconds,s.sourceOutSeconds]);
    spans.set(s.sourceSha256,history);
    keys.add(s.shotKey);prints.add(s.visualFingerprint);paths.add(s.file);
    return {...beat,shot:s};
  });
};
/** A's verified source manifest + D's actual local media transfer → strict timeline. */
export const adaptAgentAManifest=(
  manifest:AgentAManifest,staged:Readonly<Record<number,StagedMedia>>
):TimelineShot[]=>{
  if(manifest.schemaVersion!==1||!Array.isArray(manifest.shots))
    fail('Invalid Agent A manifest schema');
  return validateShots(manifest.shots.map(a=>{
    const media=staged[a.slot];
    if(!media)fail('Missing physically staged video for slot '+a.slot);
    if(!a.verifiedMovingVideo||!a.uniqueAngleVerified||
       !a.actualTurboIdentityEvidence?.trim()||!a.angleAndMotion?.trim())
      fail('Missing motion/Turbo identity evidence at slot '+a.slot);
    return {
      slot:a.slot,generation:a.generation as Generation,file:media.file,
      shotKey:a.shotKey??'',sourceId:a.sourceId??'',
      visualFingerprint:a.visualFingerprint||a.angleAndMotion||'',
      sourceSha256:a.sha256??'',sourceUrl:a.sourceUrl??'',
      originCreator:a.originCreator??'',sourceLicenseStatus:a.sourceLicenseStatus??'',
      sourceInSeconds:a.sourceInSeconds??NaN,sourceOutSeconds:a.sourceOutSeconds??NaN,
      sourceWidth:a.width??NaN,sourceHeight:a.height??NaN,nativeFps:a.fps??NaN,
      angle:a.cameraAngle??'rolling',identityVerified:true,actualMotionVerified:true,
      uniqueAngleVerified:true,turboIdentityEvidence:a.actualTurboIdentityEvidence,
      motionEvidence:a.motionEvidence||a.angleAndMotion,
      framing:media.framing,cropX:media.cropX,cropY:media.cropY,
      fullBleedCropVerified:media.fullBleedCropVerified,
    };
  }));
};
export const framingFor=(s:PorscheShot):Exclude<Framing,'auto'>=>{
  if(s.framing&&s.framing!=='auto')return s.framing;
  // UHD resolution is not license to crop a 16:9 moving Porsche into an invisible car.
  return s.sourceWidth/s.sourceHeight<=.85?'fullBleed':'movingPictureField';
};
