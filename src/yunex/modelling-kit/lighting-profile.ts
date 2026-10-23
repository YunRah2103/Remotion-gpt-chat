import * as T from 'three';
export type LightingTime='day'|'dusk'|'night';

/** Direct exposure and reflected exposure are separate: night paint still needs
 * a readable studio strip even when the key and sky become much darker. */
export function lightingProfile(time:LightingTime){
 const profiles={
  day:{background:'#14232d',sky:'#d3e2ed',ground:'#283039',hemisphere:.48,keyColor:'#fff3e4',keyIntensity:2.8,keyHeight:7,fillColor:'#b4ccd9',fillIntensity:.9,rimColor:'#e0ecfa',rimIntensity:1.25,environmentIntensity:.65},
  dusk:{background:'#18212f',sky:'#aab8d2',ground:'#211d27',hemisphere:.28,keyColor:'#ffc38e',keyIntensity:1.65,keyHeight:3.5,fillColor:'#9db5dd',fillIntensity:.52,rimColor:'#bfcee9',rimIntensity:1.1,environmentIntensity:.52},
  night:{background:'#0a111d',sky:'#8faacb',ground:'#111721',hemisphere:.12,keyColor:'#dae7ff',keyIntensity:.38,keyHeight:7,fillColor:'#829dc0',fillIntensity:.24,rimColor:'#afc8e8',rimIntensity:.85,environmentIntensity:.38},
 } as const;
 return profiles[time];
}

/** Capture-only softboxes. Long surfaces give clearcoat a continuous shoulder
 * highlight; dark space between them lets curved panels retain their shape.
 * These meshes never enter the visible world or cast visible shadows. */
export function createReflectionStudio(time:LightingTime){
 const scene=new T.Scene();scene.background=new T.Color(time==='night'?'#070b12':'#202630');
 const panel=(name:string,size:[number,number],position:[number,number,number],color:string,radiance:number)=>{
  const material=new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(radiance),toneMapped:false});
  const mesh=new T.Mesh(new T.PlaneGeometry(...size),material);mesh.name=name;mesh.position.set(...position);mesh.lookAt(0,1,0);scene.add(mesh);
 };
 panel('overhead-softbox',[9,3],[0,6,0],time==='dusk'?'#ffe1bd':'#f3f7ff',4.8);
 panel('shoulder-softbox',[10,1.2],[0,2.8,5],'#ffffff',4.2);
 panel('cool-rim-softbox',[8,1.5],[0,3,-5],'#b9d6ff',3.6);
 panel('front-softbox',[3,3],[6,2.8,.5],time==='dusk'?'#ffd4a8':'#edf4ff',2.6);
 scene.updateMatrixWorld(true);return scene;
}
