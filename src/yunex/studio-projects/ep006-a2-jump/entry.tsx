/** Isolated Agent 2 native Remotion preview; the scene uses the canonical height field.
 * Temporary terrain fixture until Agent 4 supplies full rally stage.
 * No narration, captions or synthetic audio.
 */
import React,{useEffect,useMemo} from 'react';
import * as T from 'three';
import {registerRoot,Composition,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CameraAim} from '../../world-kit/components';
import {CinematicLighting} from '../../modelling-kit/Lighting';
import {createCinematicVehicle,animateCinematicVehicle} from '../../modelling-kit/rig';
import {disposeObject} from '../../world-kit/geometry';
import {ep006SurfaceHeightM,EP006_CORNERS,sampleEp006Motion} from '../../ep006/dynamics/motion';
import {sampleEp006Effects} from '../../ep006/fx/contact-effects';

const FRAMES=225;
function makeCollisionTerrain(){
 const world=new T.Group();world.name='Agent 2 contract-identical heightfield proof fixture';
 // Dense patches near each jump; use the same surface sampler as physics.
 for(const [start,end] of [[-34,125],[555,725]]){
  const geo=new T.BufferGeometry(),positions:number[]=[],indices:number[]=[];
  const nx=Math.ceil((end-start)/.65),nz=40,z0=-13,dz=26/nz;
  for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){
   const x=start+(end-start)*i/nx,z=z0+dz*j;
   positions.push(x,ep006SurfaceHeightM(x,z),z);
  }
  for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){
   const a=i*(nz+1)+j,b=a+nz+1;
   indices.push(a,a+1,b,a+1,b+1,b);
  }
  geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geo.setIndex(indices);geo.computeVertexNormals();
  const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({color:'#8d7460',roughness:1,side:T.DoubleSide}));
  mesh.receiveShadow=true;world.add(mesh);
 }
 const rocks=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),new T.MeshStandardMaterial({color:'#766a61',roughness:1}),105);
 const dummy=new T.Object3D();
 for(let i=0;i<105;i++){
  const x=i<52?-20+i*2.8:560+(i-52)*3.0,z=(i%2===0?-1:1)*(5+(i%5)*1.1);
  dummy.position.set(x,ep006SurfaceHeightM(x,z)+.11,z);
  dummy.scale.set(.19+(i%7)*.035,.14+(i%4)*.027,.20+(i%5)*.035);
  dummy.rotation.set(i*.4,i*.6,i*.23);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);
 }
 rocks.instanceMatrix.needsUpdate=true;rocks.castShadow=true;rocks.receiveShadow=true;world.add(rocks);
 return world;
}
function makeFX(){
 const group=new T.Group();
 const dust=new T.InstancedMesh(new T.SphereGeometry(1,7,5),
  new T.MeshStandardMaterial({color:'#bda891',transparent:true,opacity:.17,roughness:1,depthWrite:false}),210);
 dust.name='touchdown-dust-sheets';dust.frustumCulled=false;group.add(dust);
 const gravel=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),
  new T.MeshStandardMaterial({color:'#4b443c',roughness:1}),250);
 gravel.name='contact-gravel';gravel.frustumCulled=false;group.add(gravel);
 return {group,dust,gravel};
}
const JumpProof:React.FC=()=>{
 const local=useCurrentFrame(),{width,height}=useVideoConfig();
 const frame=local<115?local:680+local-115,pose=sampleEp006Motion(frame);
 const car=useMemo(()=>createCinematicVehicle({
  variant:'rally-hatch',bodyDetail:'studio',quality:'hero',driver:true,color:'#d68f43',optimize:false
 }),[]);
 const terrain=useMemo(makeCollisionTerrain,[]);
 const effects=useMemo(makeFX,[]);
 useEffect(()=>()=>{disposeObject(car);disposeObject(terrain);disposeObject(effects.group);},[car,terrain,effects]);
 animateCinematicVehicle(car,{frame,fps:30,distance:pose.positionM[0],speed:pose.velocityMps[0],curvature:0,roughness:0});
 car.position.fromArray(pose.positionM);car.rotation.set(...pose.rotationRad);
 const shell=car.getObjectByName('body-shell');
 for(const corner of EP006_CORNERS){
  const wheel=pose.wheels[corner],mount=car.getObjectByName(`mount-${corner}`) as T.Group;
  if(!mount)continue;
  const rest=mount.userData.restPosition as number[];
  mount.position.set(rest[0],rest[1]+wheel.compressionM,rest[2]);
  mount.rotation.y=wheel.steerRad;
  const roll=mount.getObjectByName('wheel-roll');if(roll)roll.rotation.z=wheel.spinRad;
  const tyre=mount.getObjectByName('tyre');
  if(tyre)tyre.scale.y=1-wheel.tyreSquishM/.36;
  const links=car.getObjectByName(`links-mount-${corner}`);
  links?.children.forEach(part=>{
   const ends=part.userData.link as {a:[number,number,number];b:[number,number,number];unit?:boolean}|undefined;
   if(!ends)return;
   const a=new T.Vector3(...ends.a),b=new T.Vector3(...ends.b);
   if(shell){a.applyEuler(shell.rotation).add(shell.position);}
   b.y+=wheel.compressionM;
   const delta=b.clone().sub(a),length=delta.length();
   part.position.copy(a.clone().add(b).multiplyScalar(.5));
   part.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize());
   part.scale.y=ends.unit?length:length/new T.Vector3(...ends.a).distanceTo(new T.Vector3(...ends.b));
  });
 }
 const sample=sampleEp006Effects(frame),d=new T.Object3D();
 sample.dust.slice(0,effects.dust.count).forEach((p,i)=>{
  d.position.fromArray(p.positionM);d.rotation.set(0,p.rotationY,0);
  d.scale.set(p.radiusM*p.stretchX,p.radiusM*.34,p.radiusM*1.15);
  d.scale.multiplyScalar(Math.max(.05,Math.sqrt(p.opacity/.26)));
  d.updateMatrix();effects.dust.setMatrixAt(i,d.matrix);
 });
 for(let i=sample.dust.length;i<effects.dust.count;i++){d.scale.setScalar(0);d.updateMatrix();effects.dust.setMatrixAt(i,d.matrix);}
 effects.dust.instanceMatrix.needsUpdate=true;
 sample.gravel.slice(0,effects.gravel.count).forEach((p,i)=>{
  d.position.fromArray(p.positionM);d.rotation.set(...p.rotationRad);d.scale.setScalar(p.radiusM);
  d.updateMatrix();effects.gravel.setMatrixAt(i,d.matrix);
 });
 for(let i=sample.gravel.length;i<effects.gravel.count;i++){d.scale.setScalar(0);d.updateMatrix();effects.gravel.setMatrixAt(i,d.matrix);}
 effects.gravel.instanceMatrix.needsUpdate=true;
 const impact=(frame>=70&&frame<=92)||(frame>=748&&frame<=770);
 const follow=impact?8.4:16.5;
 const cx=pose.positionM[0],cy=pose.positionM[1];
 const cameraPosition:[number,number,number]=[cx+(impact?1.5:-2.0),cy+(impact?1.9:2.6),pose.positionM[2]+follow];
 // Wide shots show the complete chassis and both axle sets; touchdown
 // deliberately punches in toward the FRONT WHEEL, then returns to full-car.
 const target:[number,number,number]=[cx+(impact?1.2:0),cy+(impact?.55:.78),pose.positionM[2]];
 return <ThreeCanvas width={width} height={height} shadows camera={{fov:42,near:.05,far:1200}} gl={{antialias:true}}>
  <CinematicLighting focus={[cx,cy,0]} timeOfDay="dusk"/>
  <primitive object={terrain}/>
  <primitive object={car}/>
  <primitive object={effects.group}/>
  <CameraAim position={cameraPosition} target={target} fov={42}/>
 </ThreeCanvas>;
};
const Root:React.FC=()=> <Composition id="ep006-a2-jump" component={JumpProof} width={1080} height={1920} fps={30} durationInFrames={FRAMES}/>;
registerRoot(Root);
