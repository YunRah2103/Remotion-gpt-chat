import React, {useEffect, useLayoutEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as T from 'three';
import {createEnvironment} from '../../../../src/yunex/world-kit/environments.ts';
import {createVehicle} from '../../../../src/yunex/world-kit/vehicles.ts';
import {animateVehicle} from '../../../../src/yunex/world-kit/motion.ts';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import {WorldLighting} from '../../../../src/yunex/world-kit/components';
import {EP003_SCENE} from '../shared/contract.ts';
import type {VehicleDynamicsFrame, Vec3} from '../shared/contract.ts';
import {REFUGE, refugeRailZ, refugePavedWidthM} from './refuge-profile.ts';
import {ContactOcclusion} from './contact.tsx';

type V3 = [number, number, number];
const LIGHT = '#e0edee';
const STEEL = '#a8b9bc';

function addBox(root: T.Group, name: string, size: V3, position: V3, material: T.Material): T.Mesh {
  const mesh = new T.Mesh(new T.BoxGeometry(...size), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

function rail(root: T.Group, a: V3, b: V3, material: T.Material) {
  const from = new T.Vector3(...a), to = new T.Vector3(...b);
  const span = to.clone().sub(from);
  const beam = addBox(root, 'refuge-guardrail', [span.length(), .20, .16],
    from.clone().add(to).multiplyScalar(.5).toArray() as V3, material);
  beam.rotation.y = Math.atan2(-span.z, span.x);
}

/** Drop/relocate objects that would otherwise obstruct the refuge throat.
 * Important: only the newly constructed episode scene is changed; kit source
 * and other films remain untouched.
 */
function clearRightSideIntrusions(root: T.Group) {
  const tmp = new T.Matrix4();
  const displaced = new T.Matrix4();
  const p = new T.Vector3();
  root.traverse(node => {
    if (node instanceof T.Mesh && node.name === 'guardrail' && node.position.z < -7.5) {
      node.visible = false; // replace this ONE unbroken rail with a smoothly flared rail
    }
    if (node instanceof T.InstancedMesh) {
      if (!['barrier-posts', 'lamp-poles', 'lamp-arms', 'lamp-heads',
        'road-delineators', 'road-reflectors', 'shoulder-rumble',
        'natural-verge-grasses', 'tree-trunks', 'tree-crowns',
        'conifer-tiers', 'conifer-snow'].includes(node.name)) return;
      let touched = false;
      for (let i=0; i<node.count; i++) {
        node.getMatrixAt(i, tmp);
        p.setFromMatrixPosition(tmp);
        // Clear tall kit foliage only from the active bay and its immediate
        // sight-line: shifting tree-crowns independently from trunks creates
        // disconnected floating canopies in the moving refuge sweep. Preserve
        // all other original trees untouched.
        if (['tree-trunks','tree-crowns','conifer-tiers','conifer-snow'].includes(node.name)) {
          const inBay = p.x>=REFUGE.startX-3 && p.x<=REFUGE.endX+3 &&
            p.z<0 && p.z>refugeRailZ(p.x)-5.5;
          if(inBay) {
            displaced.makeScale(0,0,0);
            node.setMatrixAt(i,displaced);
            touched=true;
          }
          continue;
        }
        const displacedGrass = node.name === 'natural-verge-grasses' &&
          p.x >= REFUGE.startX && p.x <= REFUGE.endX &&
          p.z < -7.4 && p.z >= refugeRailZ(p.x) - .45;
        if (p.z > -6.9 || (node.name === 'natural-verge-grasses' && !displacedGrass)) continue;
        if (displacedGrass || node.name === 'barrier-posts' ||
            (p.x >= REFUGE.startX && p.z < -6.9)) {
          displaced.makeScale(0, 0, 0); // kit's matching left-side instances survive
          node.setMatrixAt(i, displaced);
          touched = true;
        }
      }
      if (touched) node.instanceMatrix.needsUpdate = true;
    }
    // Kit's gantry support x=31 and extra-detail support x=47 otherwise stand
    // inside the real refuge entry/parking line.
    if (node instanceof T.Mesh && !(node instanceof T.InstancedMesh) &&
      ((Math.abs(node.position.x - 31) < .03 && Math.abs(node.position.z + 8.4) < .04 &&
         Math.abs(node.position.y - 3.4) < .1) ||
       (Math.abs(node.position.x - 47) < .03 && Math.abs(node.position.z + 8.5) < .04 &&
         Math.abs(node.position.y - 3.6) < .1))) {
      node.position.z = -15.0;
    }
  });
}

/** Preserves genuine highway geometry and all approved distant world objects. */
export function buildEpisodeHighway(): T.Group {
  const root = createEnvironment({kind: 'highway', timeOfDay: 'day', seed: 12});
  root.name = 'EP003-original-highway-with-refuge';
  clearRightSideIntrusions(root);
  const asphalt = new T.MeshStandardMaterial({color:'#3c474d', roughness:.94, metalness:.015, side:T.DoubleSide});
  const grit = new T.MeshStandardMaterial({color:'#5b666b',roughness:.96,transparent:true,opacity:.095,depthWrite:false});
  const white = new T.MeshStandardMaterial({color:'#d9ddd1',roughness:.89});
  const amber = new T.MeshStandardMaterial({color:'#d2b76b',roughness:.83});
  const metal = new T.MeshStandardMaterial({color:STEEL,metalness:.55,roughness:.42});

  // Remove the kit's fine animated-looking bump at road distance. No grain or
  // screen-space noise. Retain its model/silhouette and procedural terrain.
  root.traverse(node => {
    if (node instanceof T.Mesh && node.name === 'road') {
      const mat = node.material;
      if (mat instanceof T.MeshStandardMaterial) {
        const oldMap = mat.map, oldBump = mat.bumpMap;
        mat.map = null; mat.bumpMap = null; mat.color.set('#3e474c');
        // These unique highway surface maps were kit-generated for this root.
        oldMap?.dispose(); oldBump?.dispose();
        mat.roughness = .94; mat.metalness = .015; mat.needsUpdate = true;
      }
    }
  });

  const g = new T.Group(); g.name = 'EP003-refuge-extension';
  root.add(g);
  // Underside earth fill meets original terrain instead of a floating asphalt
  // membrane. 6cm paving over a sloped granular shoulder is intentionally
  // subdued so it does not become a bright unnatural kerb in tracking shots.
  const fill=new T.MeshStandardMaterial({color:'#696e68',roughness:1});
  const earthVertices:number[]=[],earthIndices:number[]=[];
  for(let k=0;k<=106;k++){
    const x=REFUGE.startX+(REFUGE.endX-REFUGE.startX)*k/106;
    const outside=refugeRailZ(x)+.05;
    earthVertices.push(x,-.004,-7.43,x,-.004,outside,x,-.16,outside-.22);
    if(k<106){const j=k*3;for(const d of [0,1]) {
      earthIndices.push(j+d,j+d+3,j+d+1,j+d+1,j+d+3,j+d+4);
    }}
  }
  const earthGeo=new T.BufferGeometry();
  earthGeo.setAttribute('position',new T.Float32BufferAttribute(earthVertices,3));
  earthGeo.setIndex(earthIndices);earthGeo.computeVertexNormals();
  const groundFill=new T.Mesh(earthGeo,fill);groundFill.name='refuge-earth-fill';
  groundFill.receiveShadow=true;groundFill.castShadow=false;g.add(groundFill);

  // Road and original -Z edge are constant height (y=0). The extra surface is
  // added as a tessellated polygon, not a floating slab over the soft verge.
  const vertices: number[] = [], triangles: number[] = [];
  const samples = 106;
  for (let i=0; i<=samples; i++) {
    const x=REFUGE.startX+(REFUGE.endX-REFUGE.startX)*i/samples;
    const railZ=refugeRailZ(x);
    vertices.push(x,.003,-7.43, x,.003,railZ+.19);
    if (i<samples) {
      const j=i*2;
      triangles.push(j,j+2,j+1,j+1,j+2,j+3); // +Y face normals for proper daylight and shadows
    }
  }
  const surface = new T.BufferGeometry();
  surface.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  surface.setIndex(triangles); surface.computeVertexNormals();
  const tarmac = new T.Mesh(surface,asphalt);tarmac.name='real-refuge-asphalt';
  tarmac.receiveShadow=true;g.add(tarmac);

  // Vertical world-space fixed longitudinal structure reads as asphalt texture
  // on a tracking camera and does not shimmer when the footage is reframed.
  for (let x=42; x<105; x+=9) {
    for (let k=0;k<3;k++) addBox(g,'asphalt-wear',[4,.002,.075],
      [x+k*.9,.008,-8.25-k*1.45],grit).castShadow=false;
  }
  // A continuous white separator across the entire taper would visually
  // prevent entrance. The inbound transition instead has spaced guide dashes;
  // a continuous line separates the refuge from through-traffic downstream.
  for(let x=8;x<=39;x+=7)
    addBox(g,'refuge-entry-guide',[3.7,.012,.13],[x,.017,-7.20],white).castShadow=false;
  addBox(g,'refuge-separation-line',[58,.012,.12],[81,.018,-7.37],white).castShadow=false;
  addBox(g,'refuge-bay-outer-line',[57,.016,.12],[77,.017,-13.50],white).castShadow=false;
  for (let x=51;x<=94;x+=5) {
    const arrow=addBox(g,'refuge-chevron',[2.4,.012,.10],
      [x,.020,-8.12],amber); arrow.rotation.y=-.36;arrow.castShadow=false;
  }

  const railStart=-110, railEnd=110;
  for(let x=railStart;x<railEnd;x+=2) {
    const next=Math.min(x+2,railEnd);
    rail(g,[x,.66,refugeRailZ(x)],[next,.66,refugeRailZ(next)],metal);
  }
  for(let x=-108;x<railEnd;x+=5) {
    const z=refugeRailZ(x);
    addBox(g,'refuge-guardrail-post',[.11,.70,.11],[x,.34,z],metal);
    if(x>REFUGE.fullWidthX) addBox(g,'refuge-rail-reflector',[.16,.11,.028],
      [x,.74,z+.10],amber);
  }
  // Reposition the right-side highway luminaires behind the safety rail, and
  // bridge both relocated gantry legs to their existing signs without an
  // unsupported floating structure.
  for(const x of [18,99]) {
    const z=refugeRailZ(x)-1.4;
    addBox(g,'outer-highway-lamp-post',[.13,6.8,.13],[x,3.4,z],metal);
    addBox(g,'outer-highway-lamp-arm',[.10,.11,2.3],[x,6.75,z+1.15],metal);
    addBox(g,'outer-highway-lamp-lens',[.53,.05,.28],[x,6.68,z+2.28],
      new T.MeshStandardMaterial({color:LIGHT,emissive:'#d7e0d3',emissiveIntensity:.18}));
  }
  for(const [x, height, toZ] of [[31,6.8,-8.4],[47,7.2,-8.5]]) {
    rail(g,[x,height,-15],[x,height,toZ],metal);
  }
  // Small refuge marker on the verge, outside the physical stop envelope.
  addBox(g,'refuge-marker-upright',[.13,2.6,.13],[55,1.3,-14.85],metal);
  addBox(g,'refuge-marker-panel',[.10,.80,1.15],[55,2.68,-14.85],
    new T.MeshStandardMaterial({color:'#376d78',metalness:.12,roughness:.69}));
  g.userData = {kind:'emergency-refuge',nominalWidthM:refugePavedWidthM(70),
    nonPhysical:'local static world geometry; Agent 2 determines approach'};
  return root;
}

/** Change materials on one freshly constructed car instance, never the kit. */
export function finishGrandTourer(model: T.Group): T.Group {
  const paintNode = model.getObjectByName('arched-body');
  const tyreNode = model.getObjectByName('tyre');
  const metalNode = model.getObjectByName('alloy-spoke');
  const glassNode = model.getObjectByName('windshield');
  const trimNode = model.getObjectByName('sill');
  function tune(name: string, fn: (material:T.Material)=>void) {
    const node = {paint:paintNode,tyre:tyreNode,metal:metalNode,glass:glassNode,trim:trimNode}[name];
    if (node instanceof T.Mesh) fn(node.material as T.Material);
  }
  tune('paint',m=>{if(m instanceof T.MeshPhysicalMaterial){
    m.color.set(EP003_SCENE.paint);m.metalness=.43;m.roughness=.31;
    m.clearcoat=.82;m.clearcoatRoughness=.19;m.envMapIntensity=1.15;
  }});
  tune('tyre',m=>{if(m instanceof T.MeshStandardMaterial){
    m.color.set('#252a2d');m.roughness=.94;m.metalness=.015;
  }});
  tune('metal',m=>{if(m instanceof T.MeshStandardMaterial){
    m.color.set('#a9b8bc');m.roughness=.32;m.metalness=.75;
  }});
  tune('glass',m=>{if(m instanceof T.MeshPhysicalMaterial){
    m.color.set('#829aa8');m.roughness=.15;m.envMapIntensity=1.05;
    m.opacity=.62;
  }});
  tune('trim',m=>{if(m instanceof T.MeshStandardMaterial){
    m.color.set('#273239');m.roughness=.62;
  }});
  return model;
}

/** Uses Agent 2's exact wheel centres, rotation phases and steering; the
 * original wheel hierarchy, brake assembly and entire kit body are retained.
 */
export function applyDynamicsToGrandTourer(model:T.Group, frame:VehicleDynamicsFrame):void {
  animateVehicle(model,frame.distanceTravelledM,frame.driverSteerRad);
  model.position.set(...frame.positionM);
  model.rotation.set(frame.rollRad,frame.yawRad,frame.pitchRad,'YXZ');
  model.updateMatrixWorld(true);
  model.traverse(object=>{
    if(!(object instanceof T.Group) || !object.name.startsWith('steer-') ||
      typeof object.userData.steering!=='boolean') return;
    const front=object.position.x>0,right=object.position.z<0;
    const id=(front?'front-':'rear-')+(right?'right':'left');
    const wheel=frame.wheels[id as keyof VehicleDynamicsFrame['wheels']];
    if(!wheel)return;
    const desiredHub=model.worldToLocal(new T.Vector3(...wheel.hubWorldM));
    object.position.copy(desiredHub);
    object.rotation.y=wheel.steeringRad;
    const roll=object.getObjectByName('wheel-roll');
    if(roll)roll.rotation.z=wheel.spinRad;
  });
}

/** Look department consumes authoritative motion; it never samples its own. */
export const EpisodeWorld:React.FC=()=>{
  const model=useMemo(buildEpisodeHighway,[]);
  useEffect(()=>()=>disposeObject(model),[model]);
  return <primitive object={model}/>;
};

/**
 * The kit's bright sun used without a display transform clips paint and asphalt
 * to milky highlights. ACES maps those values into a natural daylight roll-off.
 * Scope is one ThreeCanvas and restore the renderer on unmount.
 */
const EpisodeColorPipeline:React.FC=()=>{
  const {gl}=useThree();
  useLayoutEffect(()=>{
    const oldTone=gl.toneMapping, oldExposure=gl.toneMappingExposure;
    gl.toneMapping=T.ACESFilmicToneMapping;
    gl.toneMappingExposure=1.16;
    return ()=>{gl.toneMapping=oldTone;gl.toneMappingExposure=oldExposure;};
  },[gl]);
  return null;
};
export const EpisodeLight:React.FC<{focus?:Vec3}>=({focus=[0,0,0]})=><>
  <EpisodeColorPipeline/>
  <WorldLighting timeOfDay="day" focus={[...focus] as V3}/>
  <directionalLight position={[-14,19,-17]} color="#d6e6ec" intensity={.39}/>
</>;

export const EpisodeGrandTourer:React.FC<{
  dynamics: VehicleDynamicsFrame;
  lights?: boolean;
}>=({dynamics,lights=false})=>{
  const model=useMemo(()=>finishGrandTourer(createVehicle({
    variant:'grand-tourer',color:EP003_SCENE.paint,lights})),[lights]);
  useEffect(()=>()=>disposeObject(model),[model]);
  applyDynamicsToGrandTourer(model,dynamics);
  return <>
    <ContactOcclusion dynamics={dynamics}/>
    <primitive object={model}/>
  </>;
};
