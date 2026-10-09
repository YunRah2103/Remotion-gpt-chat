import {brakeCameraAt,brakeShotAt,ghostOpacityAt,thermalLightAt} from './cameraMath';
const assert=(v:boolean,msg:string)=>{if(!v)throw new Error(msg);};
const boundaries:[number,number,string][]=[
 [0,119,'context'],[120,269,'reveal'],[270,449,'thermal'],
 [450,629,'benefits'],[630,749,'hero']
];
for(const [a,b,name] of boundaries){
 assert(brakeShotAt(a)===name,'first boundary '+name);
 assert(brakeShotAt(b)===name,'last boundary '+name);
}
for(let f=0;f<750;f++){
 const p=brakeCameraAt(f);
 assert(p.position.every(Number.isFinite)&&p.target.every(Number.isFinite),'finite pose');
 assert(p.fovDegrees>=26&&p.fovDegrees<=36,'reasonable FOV');
 assert(p.focusDistanceMetres>.3&&p.focusDistanceMetres<10,'reasonable distance');
 assert(JSON.stringify(brakeCameraAt(f))===JSON.stringify(brakeCameraAt(f)),'deterministic');
 assert(ghostOpacityAt(f)>=0&&ghostOpacityAt(f)<=.45,'bounded ghost');
 if(f>=120)assert(ghostOpacityAt(f)===0,'ghost hidden in tech shots');
 if(f>=120)assert(p.position[0]>.5,'face-side visible');
}
assert(ghostOpacityAt(119)===0,'ghost fades by context cut');
assert(ghostOpacityAt(700,true)>0,'optional ghost');
assert(thermalLightAt(300,0)===0,'no constant glow');
assert(thermalLightAt(300,1)===.66,'B scalar maps to highlight');
assert(thermalLightAt(650,1)===0,'no hero glow');
assert(thermalLightAt(300,-1)===0,'low clamped');
assert(thermalLightAt(300,100)===.66,'high clamped');
console.log('PASS 750 deterministic camera poses, five shot boundaries, ghost and heat gates');
