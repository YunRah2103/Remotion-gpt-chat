import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import * as THREE from 'three';
import {refugeRailZ} from '../../production/yunex/tyre_blowout_ep003/look/refuge-profile.ts';
import {makePremiumAsphaltTexture} from '../../production/yunex/tyre_blowout_ep003/look/asphalt.ts';

/** Real Three.js factory regression—not only algebraic refuge-profile tests.
 * Bundles JSX using the repository's existing Remotion/esbuild dependency.
 * No browser or GPU required; moving-image quality is checked separately.
 */
let cache;
async function createWorldFactory() {
  if (cache) return cache;
  const root=process.cwd();
  const folder=path.join(root,'out','ep003-agent4-tests');
  await fs.mkdir(folder,{recursive:true});
  const outfile=path.join(folder,'world-'+process.pid+'.mjs');
  try {
    await build({
      entryPoints:[path.join(root,'production/yunex/tyre_blowout_ep003/look/world.tsx')],
      outfile,bundle:true,format:'esm',platform:'node',
      packages:'external',target:'es2022',logLevel:'silent',
    });
    cache=await import(pathToFileURL(outfile).href);
  } finally {await fs.rm(outfile,{force:true});}
  return cache;
}

test('real Three scene retains kit world and upward-facing contiguous paved refuge',async()=>{
  const {buildEpisodeHighway}=await createWorldFactory();
  const world=buildEpisodeHighway();
  try{
    assert.equal(world.name,'EP003-original-highway-with-refuge');
    assert.ok(world.getObjectByName('road'),'kit asphalt must survive');
    assert.ok(world.getObjectByName('arched-body')===undefined,'vehicle must remain a separate component');
    const tarmac=world.getObjectByName('real-refuge-asphalt');
    const mainRoad=world.getObjectByName('road');
    assert.ok(mainRoad?.material instanceof THREE.MeshStandardMaterial);
    assert.ok(mainRoad.material.map instanceof THREE.DataTexture,
      'clean asphalt should have low-frequency material variation, not a flat colour');
    assert.equal(mainRoad.material.bumpMap,null,'no glittering high-frequency bump');
    assert.equal(mainRoad.material.map,tarmac.material.map,
      'refuge and road must use the same restrained asphalt texture');
    const roadPositions=mainRoad.geometry.getAttribute('position');
    const roadUvs=mainRoad.geometry.getAttribute('uv');
    const refugePositions=tarmac.geometry.getAttribute('position');
    const refugeUvs=tarmac.geometry.getAttribute('uv');
    assert.ok(roadUvs && refugeUvs,'both surfaces need matching UV layout');
    // New road/refuge texture is world anchored, not stretched over 220m.
    for(const i of [0,Math.floor(roadPositions.count/2),roadPositions.count-1]){
      const u=(roadPositions.getX(i)+mainRoad.position.x)/4;
      const v=(roadPositions.getZ(i)+mainRoad.position.z)/4;
      assert.ok(Math.abs(roadUvs.getX(i)-u)<1e-4);
      assert.ok(Math.abs(roadUvs.getY(i)-v)<1e-4);
    }
    for(const i of [0,Math.floor(refugePositions.count/2),refugePositions.count-1]){
      assert.ok(Math.abs(refugeUvs.getX(i)-refugePositions.getX(i)/4)<1e-4);
      assert.ok(Math.abs(refugeUvs.getY(i)-refugePositions.getZ(i)/4)<1e-4);
    }

    assert.ok(tarmac instanceof THREE.Mesh,'actual THREE.Mesh road extension required');
    const p=tarmac.geometry.getAttribute('position');
    const normal=tarmac.geometry.getAttribute('normal');
    assert.equal(p.count,214,'must provide 107 cross-sections');
    assert.equal(tarmac.geometry.index.count/3,212,'real strips, not disconnected slabs');
    tarmac.geometry.computeBoundingBox();
    const bounds=tarmac.geometry.boundingBox;
    assert.ok(Math.abs(bounds.min.x-4)<.002);
    assert.ok(Math.abs(bounds.max.x-110)<.002);
    assert.ok(bounds.min.z<-13.79,'width must exceed old road hard shoulder');
    assert.ok(bounds.max.z<-7.40);
    for(let i=0;i<p.count;i++){
      assert.ok(Math.abs(p.getY(i)-.003)<.001,'no levitating/undulating shoulder');
      assert.ok(normal.getY(i)>.99,'refuge road normals must face daylight and wheel contact');
    }
    const oldRail=[];
    world.traverse(o=>{if(o.name==='guardrail')oldRail.push(o);});
    assert.equal(oldRail.length,2,'both kit guards still exist in instance');
    assert.equal(oldRail.filter(o=>!o.visible).length,1,'only right kit rail replaced');
    let rails=0;
    world.traverse(o=>{if(o.name==='refuge-guardrail')rails++;});
    assert.ok(rails>=110,'continuous new outer rail, including transition');
  }finally{world.traverse(node=>{if(node instanceof THREE.Mesh){node.geometry.dispose();
      for(const m of Array.isArray(node.material)?node.material:[node.material])m.dispose();
    }});}
});

test('real scene contains no visible trees over the refuge and keeps background forest',async()=>{
  const {buildEpisodeHighway}=await createWorldFactory();
  const {refugeRailZ}=await import(pathToFileURL(path.resolve(
    'production/yunex/tyre_blowout_ep003/look/refuge-profile.ts')).href);
  const world=buildEpisodeHighway();
  const matrix=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();
  let hidden=0,visibleOutside=0;
  world.traverse(node=>{
    if(!(node instanceof THREE.InstancedMesh))return;
    if(!['tree-trunks','tree-crowns','conifer-tiers','conifer-snow'].includes(node.name))return;
    for(let i=0;i<node.count;i++){
      node.getMatrixAt(i,matrix);matrix.decompose(p,q,s);
      if(s.lengthSq()<1e-10){hidden++;continue;}
      const obstructing=p.x>=4&&p.x<=110&&p.z<0&&
        p.z>refugeRailZ(p.x)-5.5;
      assert.equal(obstructing,false,'visible tree still obstructs refuge approach/guardrail');
      visibleOutside++;
    }
  });
  assert.ok(hidden>=1,'the original tree instances must be cleared from bay');
  assert.ok(visibleOutside>=1,'keep surrounding approved kit scenery');
});

test('soft wheel-contact texture is deterministic and fades smoothly to zero',async()=>{
  const root=process.cwd();
  const outfile=path.join(root,'out','ep003-agent4-tests','contact-'+process.pid+'.mjs');
  await build({entryPoints:[path.join(root,'production/yunex/tyre_blowout_ep003/look/contact.tsx')],
    outfile,bundle:true,format:'esm',platform:'node',packages:'external',target:'es2022',logLevel:'silent'});
  const {makeContactAlphaTexture}=await import(pathToFileURL(outfile).href);
  await fs.rm(outfile,{force:true});
  const texture=makeContactAlphaTexture();
  try{
    const {data,width,height}=texture.image;
    assert.equal(width,64);assert.equal(height,64);
    const centre=(Math.floor(height/2)*width+Math.floor(width/2))*4;
    assert.ok(data[centre+1]>230);
    assert.equal(data[1],0,'corners must be fully transparent');
    assert.ok(data[(Math.floor(height/2)*width+width-1)*4+1]<10);
  }finally{texture.dispose();}
});

test('premium asphalt tone is restrained, tileable, deterministic and has mipmaps',()=>{
  const first=makePremiumAsphaltTexture(),second=makePremiumAsphaltTexture();
  try {
    assert.deepEqual(first.image.data,second.image.data,'no temporal random grain');
    assert.equal(first.image.width,128);
    assert.equal(first.image.height,128);
    assert.equal(first.wrapS,THREE.RepeatWrapping);
    assert.equal(first.wrapT,THREE.RepeatWrapping);
    assert.equal(first.minFilter,THREE.LinearMipmapLinearFilter);
    assert.equal(first.colorSpace,THREE.SRGBColorSpace);
    const values=[];
    for(let i=0;i<first.image.data.length;i+=4)values.push(first.image.data[i]);
    assert.ok(Math.min(...values)>=240,'avoid black speckle');
    assert.ok(Math.max(...values)<=252,'avoid washed out white flecks');
    assert.ok(new Set(values).size>=5,'subtle macro tone must not be a flat fill');
  } finally {first.dispose();second.dispose();}
});


test('authoritative world tilt uses Three X pitch and Z roll, even with nonzero yaw',async()=>{
  const {applyDynamicsToGrandTourer}=await createWorldFactory();
  const model=new THREE.Group();
  const frame={
    positionM:[18,0,-1.85],pitchRad:0.087,yawRad:0.13,rollRad:-0.037,
    distanceTravelledM:25,driverSteerRad:0,
  };
  applyDynamicsToGrandTourer(model,frame);
  assert.equal(model.rotation.order,'YXZ');
  assert.ok(Math.abs(model.rotation.x-frame.pitchRad)<1e-10,'pitch must rotate about X');
  assert.ok(Math.abs(model.rotation.y-frame.yawRad)<1e-10,'yaw must rotate about Y');
  assert.ok(Math.abs(model.rotation.z-frame.rollRad)<1e-10,'roll must rotate about Z');
  const correct=new THREE.Quaternion().setFromEuler(
    new THREE.Euler(frame.pitchRad,frame.yawRad,frame.rollRad,'YXZ'));
  assert.ok(model.quaternion.angleTo(correct)<1e-6);
  const firstQuaternion=model.quaternion.clone();
  applyDynamicsToGrandTourer(model,frame);
  assert.ok(model.quaternion.angleTo(firstQuaternion)<1e-6,
    'out-of-order seek / duplicate frame must not accumulate rotation');
});
