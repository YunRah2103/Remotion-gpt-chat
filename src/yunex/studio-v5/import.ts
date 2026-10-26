import * as T from 'three';
export type ImportSpec={sourceUrl:string;license:string;author:string;radius:number;wheels:{frontLeft:string;frontRight:string;rearLeft:string;rearRight:string}};
/** Loaded GLTF scene must use metres, +X forward, +Y up, wheel axle +Z.
 * Explicit adapter: does not download assets or grant rights to use a model. */
export function adaptImportedVehicle(source:T.Object3D,spec:ImportSpec){
 for(const field of ['sourceUrl','license','author'] as const)if(typeof spec[field]!=='string'||!spec[field].trim())throw Error('Imported model requires '+field);
 if(!Number.isFinite(spec.radius)||spec.radius<=0||spec.radius>2)throw Error('Imported wheel radius must be 0..2 metres');
 if(Object.keys(spec.wheels).sort().join(',')!=='frontLeft,frontRight,rearLeft,rearRight')throw Error('Declare four wheel names');
 if(new Set(Object.values(spec.wheels)).size!==4)throw Error('Wheel nodes must have unique names');
 const clone=source.clone(true),root=new T.Group();root.name='v5-imported-vehicle';root.add(clone);root.updateMatrixWorld(true);
 const nodes=Object.entries(spec.wheels).map(([corner,name])=>{const found:T.Object3D[]=[];clone.traverse(o=>{if(o.name===name)found.push(o);});if(found.length!==1)throw Error('Wheel needs a unique node: '+name);return {corner,node:found[0]};});
 for(const {node} of nodes)for(const {node:other} of nodes){let p=node.parent;while(p){if(p===other)throw Error('Wheel nodes must be independent');p=p.parent;}}
 for(const {corner,node} of nodes){
 const steer=new T.Group(),roll=new T.Group();steer.name='steer-'+corner;roll.name='roll-'+corner;
 steer.position.copy(node.getWorldPosition(new T.Vector3()));root.add(steer);steer.add(roll);root.updateMatrixWorld(true);roll.attach(node);
 }
 root.userData.importSpec=structuredClone(spec);root.userData.materialOwnership='shared-with-source; dispose only at asset lifecycle end';return root;
}
export function animateImportedVehicle(root:T.Group,distance:number,steering=0){
 if(![distance,steering].every(Number.isFinite)||Math.abs(steering)>.7)throw Error('Finite distance and steering within ±0.7 required');
 const spec=root.userData.importSpec as ImportSpec|undefined;if(!spec)throw Error('Use adaptImportedVehicle first');
 for(const corner of Object.keys(spec.wheels)){root.getObjectByName('roll-'+corner)!.rotation.z=-distance/spec.radius;root.getObjectByName('steer-'+corner)!.rotation.y=corner.startsWith('front')?steering:0;}
}
