import * as T from 'three';
const baselines=new WeakMap<T.Object3D,Map<T.PointLight,boolean>>();
/** Explicit opt-in lamp culling. Keeps the nearest source lamps; never moves or deletes them. */
export function limitStudioLights(world:T.Object3D,focus:T.Vector3,budget=4){
 if(!Number.isInteger(budget)||budget<1||budget>16)throw Error('Light budget must be 1..16');if(!focus.toArray().every(Number.isFinite))throw Error('Finite light focus required');
 let original=baselines.get(world);if(!original){original=new Map();baselines.set(world,original);}const candidates:{light:T.PointLight;distance:number;order:number}[]=[];world.updateWorldMatrix(true,true);
 world.traverse(o=>{if(!(o instanceof T.PointLight))return;if(!original!.has(o))original!.set(o,o.visible);if(original!.get(o)){const p=new T.Vector3().setFromMatrixPosition(o.matrixWorld);candidates.push({light:o,distance:p.distanceToSquared(focus),order:candidates.length});}});
 candidates.sort((a,b)=>a.distance-b.distance||a.order-b.order);const selected=new Set(candidates.slice(0,budget).map(c=>c.light));for(const {light}of candidates)light.visible=selected.has(light);return selected.size;
}
export function restoreStudioLights(world:T.Object3D){const original=baselines.get(world);original?.forEach((visible,light)=>{light.visible=visible;});baselines.delete(world);}

/** Reflection probes use authored visibility, independent of live per-frame light budgets. */
export function cloneStudioForReflections(world:T.Group){
 const clone=world.clone(true),original=baselines.get(world),source:T.Object3D[]=[],copies:T.Object3D[]=[];
 world.traverse(o=>source.push(o));clone.traverse(o=>copies.push(o));
 source.forEach((o,i)=>{if(o instanceof T.PointLight&&original?.has(o))copies[i].visible=original.get(o)!;});
 return clone;
}
