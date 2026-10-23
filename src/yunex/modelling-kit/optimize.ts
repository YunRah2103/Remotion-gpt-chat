import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
/** Batch only non-articulated detail inside its existing parent/pivot. Mutable tyres/rims stay separate. */
export function batchVehicleDetails(root:T.Object3D){
 const names=new Set(['alloy-spoke','split-spoke','wheel-bolt','sidewall-mark','grille-slat','intake-vane']);let saved=0;
 const parents:T.Object3D[]=[];root.traverse(o=>{if(o.children.length)parents.push(o);});
 for(const parent of parents){const groups=new Map<string,T.Mesh[]>();for(const o of [...parent.children]){
  if(!o.visible||!(o instanceof T.Mesh)||o instanceof T.InstancedMesh||!names.has(o.name)||Array.isArray(o.material))continue;
  const key=`${o.name}:${o.material.uuid}`;const list=groups.get(key)??[];list.push(o);groups.set(key,list);
 }
 for(const list of groups.values())if(list.length>1){const geos=list.map(m=>{m.updateMatrix();return m.geometry.clone().applyMatrix4(m.matrix);}),merged=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());if(!merged)continue;
  const m=new T.Mesh(merged,list[0].material);m.name=list[0].name;m.castShadow=true;m.receiveShadow=true;parent.add(m);for(const o of list){parent.remove(o);o.geometry.dispose();}saved+=list.length-1;
 }}root.userData.detailDrawCallsSaved=saved;return saved;
}
