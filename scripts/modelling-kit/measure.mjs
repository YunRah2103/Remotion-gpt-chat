import {writeFile,mkdir} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {createCinematicVehicle,animateCinematicVehicle,HERO_VEHICLES} from '../../src/yunex/modelling-kit/rig.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
const result=[];
for(const variant of HERO_VEHICLES)for(const quality of ['lightweight','standard','hero']){
 const start=performance.now(),g=createCinematicVehicle({variant,quality});const buildMS=performance.now()-start;
 let meshes=0,drawTriangles=0;const geometries=new Set(),materials=new Set();
 g.traverse(o=>{if(o.isMesh){meshes++;geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);drawTriangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}});
 const before=performance.now();for(let frame=0;frame<24;frame++)animateCinematicVehicle(g,{frame,fps:24,distance:frame*.2,tyreDamage:frame/24});
 result.push({variant,quality,buildMS,averageUpdateMS:(performance.now()-before)/24,meshes,uniqueGeometries:geometries.size,uniqueMaterials:materials.size,drawTriangles:Math.round(drawTriangles)});disposeObject(g);
}
await mkdir('out/modelling-kit-v2',{recursive:true});await writeFile('out/modelling-kit-v2/performance.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
