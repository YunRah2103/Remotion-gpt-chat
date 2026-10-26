import {writeFileSync,mkdirSync} from 'node:fs';
import {createFleetVehicle,fleetCatalogue} from '../../src/yunex/modelling-kit/fleet.ts';
import {auditFleetVehicle} from '../../src/yunex/modelling-kit/fleet-quality.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
const reports=[];
for(const s of fleetCatalogue()){const car=createFleetVehicle({variant:s.id,optimize:false});reports.push(auditFleetVehicle(car));disposeObject(car);}
mkdirSync('out/v5',{recursive:true});writeFileSync('out/v5/fleet-audit.json',JSON.stringify(reports,null,2));
for(const r of reports)console.log(r.variant,r.state,r.issues.join('; '));
if(reports.some(r=>r.state==='fail'))process.exitCode=1;
