import React, {useEffect} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';

export type ReflectionEnvironmentProps = {intensity?:number; variant?:'road'|'turbine'|'charge'};

/**
 * Native Three.js PMREM softbox reflections, without an external HDR download.
 * This is the principal difference between dark metallic paint and plastic-looking
 * diffuse paint. Deterministic, source-owned, and compatible with --gl=swangle.
 * Generate once per scene variant; never regenerate on each Remotion frame.
 */
export const YunexReflectionEnvironment:React.FC<ReflectionEnvironmentProps>=({
  intensity=.9,variant='road',
})=>{
  const {gl,scene}=useThree();
  useEffect(()=>{
    const previousEnv=scene.environment;
    const previousIntensity=scene.environmentIntensity;
    const environment=new THREE.Scene();
    environment.background=new THREE.Color('#12202A');
    const addCard=(x:number,y:number,z:number,w:number,h:number,colour:string,rx=0,ry=0)=>{
      const mat=new THREE.MeshBasicMaterial({color:colour,side:THREE.DoubleSide,toneMapped:false});
      const card=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
      card.position.set(x,y,z);
      card.rotation.set(rx,ry,0);
      environment.add(card);
    };
    // Camera-left long white softbox (forms a graceful continuous highlight on curves).
    addCard(-5,7,2,3.8,11,'#D9F2F4',-.24,.62);
    // Warm roadside sunset highlight remains opposite the cool key on all scenes.
    addCard(6,4,-3,2.0,10,'#FFB574',0,-.65);
    addCard(0,8,-2,8,1.6,'#9CD3E0',Math.PI/3,0);
    // Narrow cyan strip accent — integral to the clean intake/teal palette.
    addCard(3,2,6,1.4,7,'#52B9CC',0,-.42);
    if(variant==='turbine') addCard(-2,1,-5,5,3,'#BB774E',0,0);
    if(variant==='charge') addCard(1,-1,4,5,2,'#83CEDD',0,.3);
    const pmrem=new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const target=pmrem.fromScene(environment,.045);
    scene.environment=target.texture;
    scene.environmentIntensity=intensity;
    return ()=>{
      scene.environment=previousEnv;
      scene.environmentIntensity=previousIntensity;
      target.dispose(); pmrem.dispose();
      environment.traverse((object)=>{
        if(!(object instanceof THREE.Mesh))return;
        object.geometry.dispose();
        if(Array.isArray(object.material))object.material.forEach(m=>m.dispose());
        else object.material.dispose();
      });
    };
  },[gl,scene,intensity,variant]);
  return null;
};
