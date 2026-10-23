import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
/** Static scenery only. Never merge vehicle wheels, rigs or editable legacy assets. */
export function batchScenery(root:T.Group){
 root.updateMatrixWorld(true);const groups=new Map<T.Material,T.Mesh[]>();
 root.traverse(o=>{if(o instanceof T.Mesh&&!(o instanceof T.InstancedMesh)&&!Array.isArray(o.material)){const a=groups.get(o.material)??[];a.push(o);groups.set(o.material,a);}});
 for(const [material,meshes] of groups){
 if(meshes.length<3)continue;
 const geometries=meshes.map(m=>m.geometry.clone().applyMatrix4(m.matrixWorld)),geometry=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!geometry)throw Error('Incompatible V5 scenery geometry');
 const merged=new T.Mesh(geometry,material);merged.name='v5-batched-'+meshes[0].name;merged.castShadow=true;merged.receiveShadow=true;merged.userData.sourceNames=[...new Set(meshes.map(m=>m.name))];
 for(const m of meshes){m.removeFromParent();m.geometry.dispose();}root.add(merged);
 }
}
