import {createCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {VEHICLES} from '../../src/yunex/world-kit/catalog.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
import {createHash} from 'node:crypto';
const primary=new Set(['arched-body','fleet-monocoque','fleet-tank','cab']);
const rows=[];
for(const s of VEHICLES){const car=createCinematicVehicle({variant:s.id,bodyDetail:'fleet',quality:'standard',optimize:false});const surfaces=[];car.traverse(o=>{if(primary.has(o.name)&&o.geometry){const p=o.geometry.attributes.position;surfaces.push({name:o.name,vertices:p.count,hash:createHash('sha256').update(Buffer.from(p.array.buffer,p.array.byteOffset,p.array.byteLength)).digest('hex')});}});rows.push({variant:s.id,surfaces});disposeObject(car);}
process.stdout.write(JSON.stringify(rows,null,2));
