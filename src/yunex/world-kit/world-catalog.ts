import type {EnvironmentKind,TimeOfDay} from './catalog.ts';
export type EnvironmentSpec={id:EnvironmentKind;label:string;mode:'drive'|'display';timeOfDay:TimeOfDay;ground:string;description:string};
export const ENVIRONMENT_CATALOG:readonly EnvironmentSpec[]=[
 {id:'highway',label:'Open highway',mode:'drive',timeOfDay:'day',ground:'#6d815d',description:'Divided carriageway, gantry and guardrails'},
 {id:'city',label:'City boulevard',mode:'drive',timeOfDay:'dusk',ground:'#78847a',description:'Seeded blocks, crossings and street lamps'},
 {id:'track',label:'Race circuit',mode:'drive',timeOfDay:'day',ground:'#6d815d',description:'Closed circuit, curbs, pits and grandstand'},
 {id:'coast',label:'Coastal road',mode:'drive',timeOfDay:'day',ground:'#b6b093',description:'Sea, beach, palms and a winding road'},
 {id:'mountain',label:'Mountain pass',mode:'drive',timeOfDay:'dusk',ground:'#7b8573',description:'Layered rock peaks, retaining walls and bends'},
 {id:'forest',label:'Forest route',mode:'drive',timeOfDay:'day',ground:'#4c6450',description:'Dense woodland, clearings and roadside rocks'},
 {id:'desert',label:'Desert highway',mode:'drive',timeOfDay:'dusk',ground:'#c4a179',description:'Sand dunes, rock formations and cacti'},
 {id:'snow',label:'Winter road',mode:'drive',timeOfDay:'day',ground:'#dde4e1',description:'Snow banks, alpine trees and distant peaks'},
 {id:'tunnel',label:'Lit road tunnel',mode:'drive',timeOfDay:'night',ground:'#47515a',description:'Open-ended barrel vault, light strips and wall panels'},
 {id:'bridge',label:'Cable bridge',mode:'drive',timeOfDay:'day',ground:'#547c8e',description:'Water below the deck, towers and suspension cables'},
 {id:'industrial',label:'Industrial district',mode:'drive',timeOfDay:'dusk',ground:'#7c8079',description:'Warehouses, containers and loading yards'},
 {id:'parking',label:'Open car park',mode:'drive',timeOfDay:'day',ground:'#828b84',description:'Parking bays, islands, lights and charging points'},
 {id:'airfield',label:'Airfield straight',mode:'drive',timeOfDay:'day',ground:'#7f8b70',description:'Runway markings, hangars and control tower'},
 {id:'garage',label:'Workshop garage',mode:'display',timeOfDay:'day',ground:'#89908b',description:'Service bay, benches, tool cabinets and tyre racks'},
 {id:'showroom',label:'Minimal showroom',mode:'display',timeOfDay:'day',ground:'#b6bfba',description:'Bright display hall, slatted walls and overhead lighting'},
 {id:'suburb',label:'Suburban neighbourhood',mode:'drive',timeOfDay:'day',ground:'#829275',description:'Houses, gardens, driveways and fences'},
 {id:'harbour',label:'Harbour front',mode:'drive',timeOfDay:'dusk',ground:'#a4a797',description:'Dock road, boats, waterfront and cranes'},
 {id:'canyon',label:'Canyon road',mode:'drive',timeOfDay:'day',ground:'#b6977b',description:'Rock walls, sandstone formations and bends'},
 {id:'rally',label:'Gravel rally stage',mode:'drive',timeOfDay:'day',ground:'#858566',description:'Unmarked gravel road, forest and safety barriers'},
 {id:'service-station',label:'Roadside service station',mode:'drive',timeOfDay:'dusk',ground:'#929888',description:'Fuel canopy, pumps, shop and charging bays'},
];
export function environmentSpec(id:string):EnvironmentSpec{const s=ENVIRONMENT_CATALOG.find(e=>e.id===id);if(!s)throw new Error(`Unknown environment: ${id}`);return s;}
export const isScenic=(id:string)=>['coast','mountain','forest','desert','snow','canyon','rally'].includes(id);
export function scenicOffset(x:number,kind:string){return Math.sin(x/(kind==='mountain'?32:48))*(kind==='mountain'?8:5);}
