import {sampleCameraMove,fitCameraMove} from './camera-move.ts';
import {rallySurfaceHeight} from './rough-road.ts';
import {fitModelCamera} from './model-framing.ts';
import {applyEdits,createAssembly,animateAssembly,buildComponents,animateComponents} from './authoring';
import React,{useMemo,useEffect} from 'react';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {CameraAim} from '../world-kit/components';
import {sampleRoute} from '../world-kit/environments.ts';
import {vehicleSpec} from '../world-kit/catalog.ts';
import {disposeObject} from '../world-kit/geometry.ts';
import type {V3} from '../world-kit/geometry.ts';
import {createPart} from '../parts-kit/models.ts';
import {animatePart} from '../parts-kit/motion.ts';
import {createCinematicVehicle,animateCinematicVehicle} from './rig.ts';
import {createCinematicEnvironment} from './environments.ts';
import {CinematicLighting} from './Lighting';
import {createGroundContactShadows,updateGroundContactShadows} from './ground-contact.ts';
import {partInspectionCamera,driverPovCamera,cabinInspectionCamera} from './studio-camera.ts';
import {drivingCamera} from './driving.ts';
import {compileRecipe,sampleRecipe} from './recipe.ts';
import type {EpisodeRecipe} from './recipe.ts';
import {mechanicalLayout,animateEnergyFlow} from './systems.ts';
import {createWeather,animateWeather} from './weather.ts';
/** One serializable recipe is the complete production input. Every sample supports out-of-order rendering. */
export const StudioEpisode:React.FC<{recipe:EpisodeRecipe}>=({recipe})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const compiled=useMemo(()=>compileRecipe(recipe,fps),[recipe,fps]);
 const sample=sampleRecipe(compiled,frame),{shot,state}=sample,s=vehicleSpec(recipe.vehicle.variant);
 const world=useMemo(()=>{const result=createCinematicEnvironment({...recipe.world,quality:'hero'});if(recipe.world.components)buildComponents(result,recipe.world.components);if(recipe.world.model)applyEdits(result,recipe.world.model);return result;},[recipe.world]);
 const model=useMemo(()=>{
  if(shot.assembly)return createAssembly(shot.assembly);
  if(shot.part)return createPart({variant:shot.part,cutaway:true});
  const vehicle=createCinematicVehicle({...recipe.vehicle,quality:'hero',lights:true,optimize:!recipe.vehicle.model&&!recipe.vehicle.components});
  if(recipe.vehicle.components)buildComponents(vehicle,recipe.vehicle.components);
  if(recipe.vehicle.model)applyEdits(vehicle,recipe.vehicle.model);
  if(recipe.world.timeOfDay==='night')for(const side of [-1,1]){const target=new T.Object3D();target.position.set(s.length/2+24,.05,side*s.width*.32);const light=new T.SpotLight('#e2edff',450,55,.24,.7,2);light.position.set(s.length*.46,s.height*.42,side*s.width*.32);light.target=target;vehicle.add(target,light);}
  return vehicle;
 },[shot.part,shot.assembly,recipe.vehicle,recipe.world.timeOfDay,s]);
 const contact=useMemo(()=>recipe.world.grounding==='enhanced'&&!shot.part&&!shot.assembly?createGroundContactShadows(model):null,[recipe.world.grounding,shot.part,shot.assembly,model]);
 useEffect(()=>()=>{if(contact)disposeObject(contact);},[contact]);
 const weather=useMemo(()=>createWeather({kind:'rain',quality:'standard',seed:17}),[]);
 useEffect(()=>()=>disposeObject(world),[world]);useEffect(()=>()=>disposeObject(model),[model]);useEffect(()=>()=>disposeObject(weather),[weather]);
 const inspection=shot.context==='inspection';
 const parked=['showroom','garage','parking'].includes(recipe.world.kind);
 const distance=parked?0:(state.distance??0)-30,pose=parked?{position:[0,0,0] as V3,yaw:0}:sampleRoute(recipe.world.kind,distance);
 let camera=drivingCamera(shot.camera,pose,s,width/height,frame/fps,{side:recipe.world.kind==='city'?1:-1});
 if(shot.part||shot.assembly){
  if(shot.assembly)animateAssembly(model,frame,fps);else animatePart(model,{shaftAngle:frame/fps*8,explode:shot.exploded??0,heat:state.heat});
  model.position.set(0,.8,0);model.updateMatrixWorld(true);
  animateComponents(model,sample.joints);
  if(inspection){model.position.y=0;model.updateMatrixWorld(true);model.position.y=-new T.Box3().setFromObject(model).min.y;model.updateMatrixWorld(true);}
  camera=partInspectionCamera(model,width/height,shot.orbit?{azimuth:shot.orbit.azimuth+(shot.orbit.sweep??0)*sample.localFrame/(shot.duration*fps),elevation:shot.orbit.elevation}:undefined);
 }else{
  const ahead=parked?pose:sampleRoute(recipe.world.kind,distance+.4),delta=Math.atan2(Math.sin(ahead.yaw-pose.yaw),Math.cos(ahead.yaw-pose.yaw));
  const terrain:Record<string,number>={};
  if(recipe.world.roughness){for(const [name,corner] of [['FrontLeft','front-left'],['FrontRight','front-right'],['RearLeft','rear-left'],['RearRight','rear-right']] as const){const rest=model.getObjectByName(`mount-${corner}`)!.userData.restPosition;const point=new T.Vector3(rest[0],0,rest[2]).applyAxisAngle(new T.Vector3(0,1,0),pose.yaw).add(new T.Vector3(...pose.position));terrain[`road${name}`]=rallySurfaceHeight(point.x,point.z,recipe.world.roughness);}}
  animateCinematicVehicle(model,{...state,...terrain,distance:parked?0:state.distance,speed:parked?0:state.speed,acceleration:parked?0:state.acceleration,curvature:parked?0:-delta/.4,steer:parked?state.steer:T.MathUtils.clamp(-delta/.4*s.wheelbase,-.4,.4)});
  animateComponents(model,sample.joints);
  model.position.fromArray(pose.position);model.rotation.set(0,pose.yaw,parked?0:Math.atan2(ahead.position[1]-pose.position[1],.4));model.updateMatrixWorld(true);
  const head=model.getObjectByName('head');if(head)head.visible=shot.camera!=='onboard';
  if(shot.camera==='interior'&&(state.cutaway??0)>.5)camera=cabinInspectionCamera(model,width/height);
  else if(shot.camera==='onboard'){const aheadRoad=!parked&&model.userData.bodyArchitecture==='section-loft-v4'?sampleRoute(recipe.world.kind,distance+10):undefined;camera=driverPovCamera(model,aheadRoad?[aheadRoad.position[0],aheadRoad.position[1]+.7,aheadRoad.position[2]]:undefined);}
  else if(['tracking','chase','reveal','overhead'].includes(shot.camera))camera=fitModelCamera(model,camera,width/height);
 }
 if(shot.cameraMove){camera=sampleCameraMove(shot.cameraMove,sample.localFrame,shot.endFrame-shot.startFrame,model,camera.fov);if(['tracking','chase','reveal','overhead'].includes(shot.camera))camera=fitCameraMove(model,camera,width/height);}
 if(contact)updateGroundContactShadows(contact,model,pose.position[1]);
 animateEnergyFlow(model,shot.energyFlow,frame/fps);
 animateWeather(weather,{frame,fps,speed:state.speed,focus:pose.position});
 const wet=recipe.world.wetness??0;
 const annotation=shot.annotation;
 let marker:{x:number;y:number}|undefined;
 if(annotation){
  const anchor=new T.Vector3();
  if(shot.part||shot.assembly)new T.Box3().setFromObject(model).getCenter(anchor);
  else{anchor.set(annotation.anchor==='front-wheel'?s.wheelbase/2:annotation.anchor==='engine'?mechanicalLayout(s).engineX:0,annotation.anchor==='driver'?s.height*.65:annotation.anchor==='underfloor'?.15:s.radius,annotation.anchor==='front-wheel'?s.width*.48:0);model.localToWorld(anchor);}
  if(!shot.part&&!shot.assembly){const object=model.getObjectByName(annotation.anchor==='engine'?'engine':annotation.anchor==='driver'?'driver-rig':annotation.anchor==='front-wheel'?'mount-front-left':'carbon-floor');if(object){model.updateMatrixWorld(true);new T.Box3().setFromObject(object).getCenter(anchor);}}
  const projector=new T.PerspectiveCamera(camera.fov,width/height,.025,500);projector.position.fromArray(camera.position);projector.lookAt(new T.Vector3(...camera.target));projector.updateMatrixWorld(true);anchor.project(projector);
  if(anchor.z>=-1&&anchor.z<=1&&Math.abs(anchor.x)<1&&Math.abs(anchor.y)<1)marker={x:(anchor.x+1)*width/2,y:(1-anchor.y)*height/2};
 }

 return <AbsoluteFill style={{background:'#14232d'}}><ThreeCanvas width={width} height={height} shadows camera={{fov:camera.fov,near:.025,far:500}} gl={{antialias:true}}>
 <CinematicLighting focus={shot.part||shot.assembly?[0,.8,0]:pose.position} timeOfDay={inspection?'day':recipe.world.timeOfDay??'day'}/>{inspection?<mesh rotation={[-Math.PI/2,0,0]} position={[0,-.012,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color="#14232d" roughness={.65} metalness={.15}/></mesh>:<primitive object={world}/>}<primitive key={model.uuid} object={model}/>{contact?<primitive object={contact}/>:null}<CameraAim {...camera}/>{recipe.world.timeOfDay==='night'&&['interior','wheel'].includes(shot.camera)?<pointLight position={camera.position} intensity={1.2} distance={5} decay={2} color="#d9e7f2"/>:null}{!inspection&&wet>.4?<primitive object={weather}/>:null}
 </ThreeCanvas>{marker&&annotation?<svg width={width} height={height} style={{position:'absolute',inset:0,pointerEvents:'none'}}><defs><marker id="component-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#3ee4ce"/></marker></defs><circle cx={marker.x} cy={marker.y} r={7} fill="#3ee4ce"/><line x1={marker.x} y1={marker.y} x2={width*.15} y2={height*.27} stroke="#3ee4ce" strokeWidth={3} markerStart="url(#component-arrow)"/><rect x={width*.08} y={height*.20} width={width*.62} height={height*.06} rx={8} fill="#10232d"/><text x={width*.11} y={height*.24} fill="white" fontFamily="Arial" fontSize={width*.032}>{annotation.text}</text></svg>:null}{recipe.presentation!=='cinematic'?<div style={{position:'absolute',top:'6%',left:'6%',right:'6%',padding:'14px 20px',background:'rgba(7,17,23,.78)',borderRadius:4,color:'#dce9ed',fontFamily:'Arial',fontSize:width*.025,letterSpacing:2}}>YUNEX / {recipe.title.toUpperCase()}</div>:null}
 {sample.caption?<div style={{position:'absolute',bottom:recipe.presentation==='cinematic'?'8%':'12%',left:'7%',right:'7%',padding:recipe.presentation==='cinematic'?'12px 18px':'20px 24px',borderLeft:recipe.presentation==='cinematic'?undefined:'4px solid #28c7ba',background:'rgba(7,17,23,.83)',color:'#f0f7f6',fontFamily:'Arial',fontSize:width*(recipe.presentation==='cinematic'?(height>width?.033:.021):(height>width?.043:.025)),lineHeight:1.22,fontWeight:recipe.presentation==='cinematic'?500:700}}>{sample.caption}</div>:null}
 {recipe.audio?.narration?<Audio src={staticFile(recipe.audio.narration)}/>:null}{recipe.audio?.music?<Audio src={staticFile(recipe.audio.music)} volume={recipe.audio.musicVolume??.15}/>:null}
 </AbsoluteFill>;
};
