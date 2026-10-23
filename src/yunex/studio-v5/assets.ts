import * as T from 'three';
/** Assets are vendored CC0 bytes; no render-time external services are required. */
export async function applyScannedMaterials(world:T.Group,url:(file:string)=>string,preset:string){
 const loader=new T.TextureLoader(),names=['forest-diff.jpg','forest-normal.jpg','asphalt-diff.jpg','asphalt-normal.jpg','pine-branch.png','bark.jpg'];
 const textures=await Promise.all(names.map(n=>loader.loadAsync(url('yunex-v5/'+n))));
 textures.forEach((t,i)=>{t.colorSpace=[0,2,4,5].includes(i)?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;});
 const [ground,groundNormal,asphalt,asphaltNormal,branch,bark]=textures;ground.repeat.set(.65,.65);groundNormal.repeat.copy(ground.repeat);asphalt.repeat.set(.035,.035);asphaltNormal.repeat.copy(asphalt.repeat);bark.repeat.set(1,3);
 world.traverse(o=>{if(!(o instanceof T.Mesh)||Array.isArray(o.material)||!(o.material instanceof T.MeshStandardMaterial))return;const m=o.material;
 if(o.name==='v5-road'&&preset!=='rally'){m.map=asphalt;m.normalMap=asphaltNormal;m.normalScale.set(.12,.12);m.bumpMap=null;m.color.set('#b7bcc0');}
 if(o.name==='v5-continuous-heightfield'){m.map=(preset==='city'||preset==='circuit')?asphalt:ground;m.normalMap=(preset==='city'||preset==='circuit')?asphaltNormal:groundNormal;m.normalScale.set(.65,.65);m.bumpMap=null;m.vertexColors=false;m.color.set(preset==='city'||preset==='circuit'?'#6a727a':preset==='mountain'?'#92978a':'#b7b7a4');}
 if(o.name==='v5-instanced-foliage-branches'||o.name==='v5-instanced-verge-growth'){m.map=branch;m.color.set(o.name.includes('verge')?'#c1bf91':'#b0b99b');}
 if(o.name==='v5-instanced-branch-trunks'){m.map=bark;m.color.set('#979587');}
 m.needsUpdate=true;
 });
 return ()=>textures.forEach(t=>t.dispose());
}
