/** Measured rest-pose geometry gates. These do not certify appearance, occlusion or mechanical accuracy. */
import * as T from 'three';
import {vehicleSpec} from '../world-kit/catalog.ts';
import {coachbuiltField} from './coachbuilt.ts';
import {fleetProfile} from './fleet-profiles.ts';
import {studioBodyProfile} from './studio-coachwork.ts';
export type QualityState='pass'|'fail'|'pending';
export type QualityStages={source:QualityState;native:QualityState;geometry:QualityState;visual:QualityState;final:QualityState};
export function qualityStates(input:Partial<Omit<QualityStages,'final'>>):QualityStages{
 const stages={source:input.source??'pending',native:input.native??'pending',geometry:input.geometry??'pending',visual:input.visual??'pending'};
 for(const value of Object.values(stages))if(!['pass','fail','pending'].includes(value))throw Error(`Invalid quality state: ${value}`);
 return {...stages,final:Object.values(stages).includes('fail')?'fail':Object.values(stages).every(s=>s==='pass')?'pass':'pending'};
}
export type GeometryDiagnostic={code:string;object:string;measured:number;limit:number;message:string;remedy:string};
/** Root-local vertex bounds, excluding hidden nodes; recompute from vertices to avoid stale cached boxes. */
function geometrySamples(root:T.Object3D){
 root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),records:{object:T.Mesh;box:T.Box3;points:T.Vector3[]}[]=[];
 root.traverseVisible(o=>{if(!(o instanceof T.Mesh))return;const p=o.geometry.attributes.position;if(!p)return;
  const points:T.Vector3[]=[],matrix=new T.Matrix4(),instance=new T.Matrix4();
  for(let i=0;i<(o instanceof T.InstancedMesh?o.count:1);i++){
   matrix.multiplyMatrices(inverse,o.matrixWorld);if(o instanceof T.InstancedMesh){o.getMatrixAt(i,instance);matrix.multiply(instance);}
   for(let j=0;j<p.count;j++)points.push(new T.Vector3().fromBufferAttribute(p,j).applyMatrix4(matrix));
  }
  records.push({object:o,box:new T.Box3().setFromPoints(points),points});
 });return records;
}
/** Audit an intact, unsteered, un-exploded vehicle at rest; pose diagnostics otherwise have no meaning. */
export function auditVehicleGeometry(root:T.Object3D){
 const s=vehicleSpec(root.userData.variant),records=geometrySamples(root),diagnostics:GeometryDiagnostic[]=[];
 const issue=(code:string,object:string,measured:number,limit:number,message:string,remedy:string)=>diagnostics.push({code,object,measured,limit,message,remedy});
 const all=new T.Box3(),finite=records.every(r=>r.points.every(p=>p.toArray().every(Number.isFinite)));
 if(!finite)issue('nonfinite-geometry',root.name||s.id,1,0,'Non-finite transformed vertex.','Repair positions/transforms before rendering.');
 for(const r of records)if(r.points.length)all.union(r.box);
 if(all.isEmpty())issue('empty-model',root.name||s.id,0,1,'No visible geometry.','Restore visible meshes.');
 const size=all.getSize(new T.Vector3());
 // Includes mirrors, rear wings, bike forks and truck hardware; broad corruption gate, not a styling score.
 for(const [axis,expected] of [['x',s.length],['y',s.height],['z',s.width]] as const){const ratio=size[axis]/expected;if(ratio>1.4||ratio<.45)issue('model-envelope',s.id,ratio,ratio>1.4?1.4:.45,`${axis} visible extent/spec ratio ${ratio.toFixed(3)}.`,`Inspect outlying or missing visible ${axis}-axis geometry; nominal extent ${expected} m.`);}
 const mounts:T.Object3D[]=[];root.traverseVisible(o=>{if(o.name.startsWith('mount-')||o.name.startsWith('steer-'))mounts.push(o);});
 const expectedWheels=s.family==='bike'?2:s.axles*2;
 if(mounts.length!==expectedWheels)issue('wheel-count',s.id,mounts.length,expectedWheels,'Wheel pivot count differs from vehicle class.','Restore one distinct pivot per canonical wheel.');
 const wheels=mounts.map(m=>{
  const tyre=records.find(r=>r.object.name==='tyre'&&isDescendant(r.object,m));
  const center=m.getWorldPosition(new T.Vector3()).applyMatrix4(root.matrixWorld.clone().invert());
  if(!tyre){issue('tyre-required',m.name,0,1,'No visible tyre at wheel pivot.','Restore the tyre mesh.');return {name:m.name,center:center.toArray(),roadGap:null};}
  const roadGap=tyre.box.min.y;
  if(Math.abs(roadGap)>.035)issue('wheel-contact',m.name,roadGap,.035,'Intact tyre floats above or penetrates the road plane.','Align tyre bottom with local y=0 in the rest pose.');
  const radial=tyre.box.getSize(new T.Vector3());
  if(Math.abs(radial.y/2-s.radius)>.04)issue('wheel-radius',m.name,radial.y/2,s.radius,'Measured tyre radius disagrees with the specification.','Check tyre scaling and wheel pivot orientation.');
  const fit=tyre.box.clone().expandByScalar(.035);
  for(const hardware of records.filter(r=>['rim-barrel','rim-lip','brake-rotor','brake-caliper','wheel-hub','wheel-bolt','alloy-spoke','split-spoke','vented-steel-face'].includes(r.object.name)&&isDescendant(r.object,m))){
   const overflow=Math.max(0,...(['x','y','z'] as const).flatMap(a=>[fit.min[a]-hardware.box.min[a],hardware.box.max[a]-fit.max[a]]));
   if(overflow>.001)issue('wheel-hardware-fit',`${m.name}/${hardware.object.name}`,overflow,0,'Wheel metal extends outside the tyre envelope plus 35 mm allowance.','Move/resize hardware within its own tyre; check rolling-pivot parenting.');
  }
  return {name:m.name,center:center.toArray(),roadGap};
 });
 if(wheels.length){const x=wheels.map(w=>w.center[0]),actual=Math.max(...x)-Math.min(...x);if(Math.abs(actual-s.wheelbase)>.08)issue('wheelbase-fit',s.id,actual,s.wheelbase,'Measured front/rear wheel spacing differs from specification.','Restore canonical axle hardpoints; do not stretch wheelbase with the body.');}
 // End-cap triangle winding is measurable without a GPU or material-side assumptions.
 if(['section-loft-v4','fleet-v5'].includes(root.userData.bodyArchitecture)){
  const body=records.find(r=>r.object.name==='arched-body');
  if(body){const index=body.object.geometry.index;for(const sign of [-1,1]){let checked=0,inward=0;for(let i=0;i<(index?.count??body.points.length);i+=3){const a=body.points[index?index.getX(i):i],b=body.points[index?index.getX(i+1):i+1],c=body.points[index?index.getX(i+2):i+2];if(!a||!b||!c)continue;const normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize(),x=(a.x+b.x+c.x)/3;if(x*sign<s.length/2-.20||Math.abs(normal.x)<.85)continue;checked++;if(normal.x*sign<0)inward++;}if(checked&&inward/checked>.35)issue('fascia-winding',`arched-body/${sign>0?'front':'rear'}`,inward/checked,.35,'End-cap triangles predominantly face inward.','Reverse cap index winding and verify exterior ray hits with front-sided material.');}}
 }
 const roof=records.find(r=>r.object.name==='roof'),liner=records.find(r=>r.object.name==='roof-liner');
 const expectsRoof=!['bike','formula'].includes(s.family)&&s.roof!=='open'&&s.bodyStyle!=='targa'&&!['box-truck','tractor-truck'].includes(s.id);
 if(expectsRoof&&!roof)issue('roof-required',s.id,0,1,'Enclosed vehicle has no visible roof.','Restore roof or audit an intact rest pose before cutaway.');
 if(roof){
  const top=roof.box.max.y;
  const shell=root.getObjectByName('body-shell'),offset=shell?.position.y??0;
  const expectedRoof=(root.userData.bodyArchitecture==='fleet-v5'?(s.id==='supercar'?studioBodyProfile(s).roof+.012:fleetProfile(s).roof+.018):root.userData.bodyArchitecture==='section-loft-v4'?studioBodyProfile(s).roof+.012:shell?.userData.coachbuilt?coachbuiltField(new T.Vector3(0,s.height+.02,0),s).y:s.height+.02)+offset;
  if(Math.abs(top-expectedRoof)>.055)issue('roof-height','roof',top,expectedRoof,'Actual roof apex differs from the selected body architecture.','Inspect roof field/deformation against its architecture profile, not nominal catalogue height.');
  if(liner){
   // Local nearest surface comparison catches a protruding liner even beneath a curved roof apex.
   let protrusion=-Infinity;
   for(const p of liner.points){let nearest:T.Vector3|undefined,distance=Infinity;for(const q of roof.points){const d=(p.x-q.x)**2+(p.z-q.z)**2;if(d<distance){distance=d;nearest=q;}}if(nearest)protrusion=Math.max(protrusion,p.y-nearest.y);}
   if(protrusion>.012)issue('roof-liner-fit','roof-liner',protrusion,.012,'Ceiling vertices protrude above the nearest actual roof surface.','Conform liner to roof vertices with an inward inset; inspect edge fit.');
  }
 }
 return {variant:s.id,family:s.family,state:diagnostics.length?'fail' as const:'pass' as const,diagnostics,measurements:{bounds:{min:all.min.toArray(),max:all.max.toArray()},expectedWheels,wheels,roofTop:roof?.box.max.y??null},limitations:['Rest pose only.','Bounding envelopes are not mesh intersection tests.','Nearest roof vertices approximate surface fit.','Appearance and moving visual review remain separate.']};
}
function isDescendant(object:T.Object3D,parent:T.Object3D){for(let p:T.Object3D|null=object;p;p=p.parent)if(p===parent)return true;return false;}
