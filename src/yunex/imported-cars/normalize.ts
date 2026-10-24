import * as THREE from 'three';

/** Prepare an independent instance without changing cached source geometry. */
export function normalizeImportedScene(source:THREE.Object3D,id:string,lengthMeters:number){
  if(!(Number.isFinite(lengthMeters)&&lengthMeters>0&&lengthMeters<30))throw Error('Invalid target length');
  // Normalize a parent, preserving the authored root transform and hierarchy.
  const cloned=new THREE.Group();
  cloned.add(source.clone(true));
  cloned.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(cloned,true);
  if(box.isEmpty())throw Error('Imported '+id+' has no usable geometry');
  const size=box.getSize(new THREE.Vector3());
  const center=box.getCenter(new THREE.Vector3());
  const span=Math.max(size.x,size.z);
  if(!Number.isFinite(span)||span<=0||!Number.isFinite(size.y)||size.y<=0)
   throw Error('Imported '+id+' has invalid bounds');
  const factor=lengthMeters/span;
  cloned.scale.setScalar(factor);
  cloned.position.set(-center.x*factor,-box.min.y*factor,-center.z*factor);
  return {cloned,size};
}
