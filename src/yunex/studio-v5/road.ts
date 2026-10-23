import * as T from 'three';
export type Point=[number,number,number];
export type RoadSpec={points:Point[];width:number;bank?:number};
export type Road={curve:T.CatmullRomCurve3;length:number;width:number;bank:number};
export function createRoad(spec:RoadSpec):Road{
 if(!Number.isFinite(spec.width)||spec.width<3||spec.width>30)throw Error('Road width must be 3..30 metres');
 if(!Number.isFinite(spec.bank??0)||Math.abs(spec.bank??0)>.15)throw Error('Road bank must be finite and within ±0.15 radians');
 if(spec.points.length<2||spec.points.some(p=>p.length!==3||!p.every(Number.isFinite)))throw Error('Road needs at least two finite XYZ points');
 const points=spec.points.map(p=>new T.Vector3(...p));
 if(points.some((p,i)=>i>0&&p.distanceTo(points[i-1])<.1))throw Error('Road control points must be distinct');
 const curve=new T.CatmullRomCurve3(points,false,'centripetal');curve.arcLengthDivisions=2000;curve.updateArcLengths();
 return {curve,length:curve.getLength(),width:spec.width,bank:spec.bank??0};
}
/** +X forward / +Y normal / +Z left, matching every legacy vehicle rig. */
export function sampleRoad(road:Road,distance:number,offset=0){
 if(![distance,offset].every(Number.isFinite))throw Error('Road distance and offset must be finite');
 const u=T.MathUtils.clamp(distance/road.length,0,1),position=road.curve.getPointAt(u),forward=road.curve.getTangentAt(u).normalize();
 const left=new T.Vector3().crossVectors(forward,new T.Vector3(0,1,0)).normalize().applyAxisAngle(forward,road.bank);
 const normal=new T.Vector3().crossVectors(left,forward).normalize();
 position.addScaledVector(left,offset);
 const quaternion=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(forward,normal,left));
 return {position,forward,left,normal,quaternion,yaw:Math.atan2(-forward.z,forward.x)};
}
export function roadGeometry(road:Road,a:number,b:number,segments=600,lift=0){
 if(!Number.isInteger(segments)||segments<2||segments>10000)throw Error('Road segments must be 2..10000');
 const positions:number[]=[],uv:number[]=[],indices:number[]=[];
 for(let i=0;i<=segments;i++)for(const offset of [a,b]){
  const s=sampleRoad(road,road.length*i/segments,offset);s.position.addScaledVector(s.normal,lift);
  positions.push(...s.position.toArray());uv.push(offset,road.length*i/segments);
 }
 for(let i=0;i<segments;i++){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
