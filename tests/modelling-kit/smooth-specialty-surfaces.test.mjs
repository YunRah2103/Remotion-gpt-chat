import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {camberedWing,motorcyclePanel} from '../../src/yunex/modelling-kit/smooth-specialty-surfaces.ts';
import {createCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {vehicleSpec} from '../../src/yunex/world-kit/catalog.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
function signedVolume(g){const p=g.attributes.position,ix=g.index;let sum=0;for(let i=0;i<ix.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,ix.getX(i)),b=new T.Vector3().fromBufferAttribute(p,ix.getX(i+1)),c=new T.Vector3().fromBufferAttribute(p,ix.getX(i+2));sum+=a.dot(b.cross(c))/6;}return sum;}
function closed(g){const edges=new Map(),ix=g.index;for(let i=0;i<ix.count;i+=3)for(const [a,b] of [[ix.getX(i),ix.getX(i+1)],[ix.getX(i+1),ix.getX(i+2)],[ix.getX(i+2),ix.getX(i)]]){const key=[Math.min(a,b),Math.max(a,b)].join(',');edges.set(key,(edges.get(key)||0)+1);}assert.ok([...edges.values()].every(n=>n===2),'each closed surface edge belongs to two triangles');}
test('Formula foil is a closed, outward-facing cambered volume rather than a thin sheet',()=>{
 const g=camberedWing(0,0,1,.23,.032,.025);closed(g);assert.ok(signedVolume(g)>.005);const n=g.attributes.normal;assert.ok(n.getX(32*48)<-.8,'leading edge points forward');assert.ok(n.getY(32*48+12)>.5,'upper skin faces up');g.dispose();
});
test('formed fairing panels retain closed thickness with outward side normals',()=>{
 for(const side of [-1,1]){const g=motorcyclePanel([[-.2,.2,.4,.7],[.2,.28,.35,.92],[.8,.08,.89,.96]],side);closed(g);assert.ok(signedVolume(g)>.001);const n=g.attributes.normal;assert.ok(n.getZ(24*25+12)*side>.8);g.dispose();}
});
for(const variant of ['formula-modern','formula-classic','sport-bike','naked-bike','touring-bike','box-truck','tractor-truck'])test(`${variant} curved rebuild remains finite with normal lengths and canonical axle height`,()=>{
 const car=createCinematicVehicle({variant,bodyDetail:'fleet',optimize:false});const shell=car.getObjectByName('body-shell');assert.equal(shell.userData.smoothSpecialtyRevision,3);
 for(const mount of car.children.filter(o=>o.name.startsWith('mount-')))assert.equal(mount.position.y,vehicleSpec(variant).radius);
 car.traverse(o=>{if(!(o instanceof T.Mesh)||!o.visible)return;const p=o.geometry.attributes.position,n=o.geometry.attributes.normal;for(const attr of [p,n])if(attr)for(const x of attr.array)assert.ok(Number.isFinite(x));});
 if(variant.startsWith('formula')){let wings=0;car.traverse(o=>{if(o.name==='fleet-front-airfoil'||o.name==='fleet-rear-airfoil'){closed(o.geometry);assert.ok(signedVolume(o.geometry)>.001);wings++;}});assert.ok(wings>=4);}
 if(variant==='sport-bike'||variant==='touring-bike'){const lens=car.getObjectByName('fleet-curved-headlamp-cover'),n=lens.geometry.attributes.normal;assert.ok(n.getX(10*13+6)>.8,'nose lens faces forward');}
 disposeObject(car);
});

test('modern sidepod inlets are cut into the formed shoulder with recessed duct backing',()=>{
 const car=createCinematicVehicle({variant:'formula-modern',bodyDetail:'fleet',optimize:false});car.updateMatrixWorld(true);
 car.traverse(o=>{if(o.name!=='fleet-undercut-sidepod')return;o.geometry.computeBoundingBox();const z=o.geometry.boundingBox.getCenter(new T.Vector3()).z;
 const hits=new T.Raycaster(new T.Vector3(1,.59,z),new T.Vector3(-1,0,0)).intersectObject(o);assert.ok(hits.every(h=>h.point.x<.171),'paint must leave the intake mouth open');});
 const throat=car.getObjectByName('fleet-sidepod-inlet');throat.geometry.computeBoundingBox();assert.ok(throat.geometry.boundingBox.max.x<.18,'duct backing sits behind the outer opening');disposeObject(car);
});

test('cambered wing tip caps face outward on every triangle and span quads do not fold',()=>{
 for(const [chord,camber,thickness] of [[.23,.032,.025],[.16,.032,.025]]){
  const g=camberedWing(.1,.4,.91,chord,camber,thickness),p=g.attributes.position,ix=g.index,ns=64,nc=48;
  const face=i=>{const a=new T.Vector3().fromBufferAttribute(p,ix.getX(i)),b=new T.Vector3().fromBufferAttribute(p,ix.getX(i+1)),c=new T.Vector3().fromBufferAttribute(p,ix.getX(i+2));return b.sub(a).cross(c.sub(a));};
  const tipStart=ns*nc*6;
  for(let tip=0;tip<2;tip++)for(let j=0;j<nc;j++)assert.ok(face(tipStart+(tip*nc+j)*3).z*(tip===0?-1:1)>1e-8,`tip ${tip} triangle ${j} must face outward`);
  for(let i=0;i<tipStart;i+=6)assert.ok(face(i).normalize().dot(face(i+3).normalize())>.99,'triangles of each span quad must face the same direction');
  closed(g);g.dispose();
 }
});
