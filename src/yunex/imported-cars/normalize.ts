import * as THREE from 'three';

/**
 * Fit authored GLB geometry inside a NEW parent group. Editing a cloned root's
 * position/scale loses transforms authored in the original asset (especially
 * matrix-authored roots); that produced squashed/tiny cars in earlier proofs.
 */
export function normalizeImportedScene(source:THREE.Object3D,id:string,lengthMeters:number){
  if(!(Number.isFinite(lengthMeters)&&lengthMeters>0&&lengthMeters<30))
    throw Error('Invalid target length');
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
