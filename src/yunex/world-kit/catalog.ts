/** Original generic silhouettes. Units: metres; +X forward, +Y up, +Z left. */
export type VehicleFamily='normal'|'sports'|'suv'|'formula'|'bike'|'truck';
export type VehicleSpec={id:string;label:string;family:VehicleFamily;length:number;width:number;height:number;wheelbase:number;radius:number;axles:number;roof?:'saloon'|'hatch'|'estate'|'open';color:string};
export const VEHICLES=[
 {id:'saloon',label:'Everyday saloon',family:'normal',length:4.55,width:1.82,height:1.46,wheelbase:2.72,radius:.33,axles:2,roof:'saloon',color:'#426d8c'},
 {id:'hatchback',label:'City hatchback',family:'normal',length:4.05,width:1.76,height:1.50,wheelbase:2.52,radius:.32,axles:2,roof:'hatch',color:'#d9b54b'},
 {id:'estate',label:'Touring estate',family:'normal',length:4.85,width:1.85,height:1.51,wheelbase:2.85,radius:.34,axles:2,roof:'estate',color:'#648a7e'},
 {id:'compact',label:'Compact three-door',family:'normal',length:3.63,width:1.69,height:1.43,wheelbase:2.32,radius:.30,axles:2,roof:'hatch',color:'#d97a5c'},

 {id:'executive-saloon',label:'Executive saloon',family:'normal',length:4.94,width:1.91,height:1.48,wheelbase:2.91,radius:.34,axles:2,roof:'saloon',color:'#6c7886'},
 {id:'city-micro',label:'Micro city car',family:'normal',length:3.37,width:1.57,height:1.49,wheelbase:2.17,radius:.29,axles:2,roof:'hatch',color:'#b5c86b'},
 {id:'family-mpv',label:'Seven-seat family MPV',family:'normal',length:4.68,width:1.86,height:1.78,wheelbase:2.89,radius:.35,axles:2,roof:'estate',color:'#a98568'},
 {id:'panel-van',label:'Light delivery van',family:'normal',length:5.05,width:1.96,height:2.02,wheelbase:3.12,radius:.37,axles:2,roof:'estate',color:'#d8d8d1'},
 {id:'retro-saloon',label:'Classic saloon',family:'normal',length:4.72,width:1.79,height:1.44,wheelbase:2.68,radius:.33,axles:2,roof:'saloon',color:'#669084'},
 {id:'coupe',label:'Sports coupe',family:'sports',length:4.43,width:1.90,height:1.25,wheelbase:2.62,radius:.35,axles:2,roof:'saloon',color:'#24a99b'},
 {id:'roadster',label:'Open roadster',family:'sports',length:4.05,width:1.80,height:1.17,wheelbase:2.45,radius:.33,axles:2,roof:'open',color:'#de7a40'},
 {id:'supercar',label:'Mid-engine supercar',family:'sports',length:4.70,width:2.01,height:1.13,wheelbase:2.78,radius:.36,axles:2,roof:'saloon',color:'#c64349'},
 {id:'grand-tourer',label:'Grand tourer',family:'sports',length:4.94,width:1.94,height:1.34,wheelbase:2.92,radius:.36,axles:2,roof:'saloon',color:'#6378b9'},

 {id:'track-coupe',label:'Track-focused coupe',family:'sports',length:4.50,width:1.99,height:1.18,wheelbase:2.64,radius:.35,axles:2,roof:'saloon',color:'#e8b14a'},
 {id:'muscle-car',label:'American-style muscle car',family:'sports',length:4.82,width:2.02,height:1.36,wheelbase:2.80,radius:.37,axles:2,roof:'saloon',color:'#526e8e'},
 {id:'hypercar',label:'Low-slung hypercar',family:'sports',length:4.76,width:2.07,height:1.08,wheelbase:2.75,radius:.355,axles:2,roof:'saloon',color:'#c95556'},
 {id:'targa',label:'Open-roof targa',family:'sports',length:4.26,width:1.89,height:1.19,wheelbase:2.53,radius:.34,axles:2,roof:'open',color:'#a5b7a6'},
 {id:'rally-car',label:'Rally-inspired coupe',family:'sports',length:4.27,width:1.83,height:1.38,wheelbase:2.54,radius:.34,axles:2,roof:'hatch',color:'#d1a753'},
 {id:'classic-gt',label:'Classic sports GT',family:'sports',length:4.62,width:1.82,height:1.33,wheelbase:2.61,radius:.345,axles:2,roof:'saloon',color:'#427a79'},
 {id:'drift-coupe',label:'Widebody drift coupe',family:'sports',length:4.59,width:1.94,height:1.29,wheelbase:2.65,radius:.36,axles:2,roof:'saloon',color:'#b584b6'},
 {id:'crossover',label:'Urban crossover',family:'suv',length:4.43,width:1.89,height:1.71,wheelbase:2.68,radius:.38,axles:2,roof:'hatch',color:'#b5bdc0'},
 {id:'boxy-suv',label:'Utility SUV',family:'suv',length:4.72,width:1.98,height:1.92,wheelbase:2.80,radius:.42,axles:2,roof:'estate',color:'#9c9b70'},
 {id:'fastback-suv',label:'Fastback SUV',family:'suv',length:4.88,width:1.99,height:1.65,wheelbase:2.92,radius:.39,axles:2,roof:'saloon',color:'#735973'},

 {id:'compact-suv',label:'Compact family SUV',family:'suv',length:4.20,width:1.85,height:1.62,wheelbase:2.61,radius:.37,axles:2,roof:'hatch',color:'#d2b581'},
 {id:'luxury-suv',label:'Full-size luxury SUV',family:'suv',length:5.22,width:2.06,height:1.83,wheelbase:3.10,radius:.42,axles:2,roof:'estate',color:'#708c8c'},
 {id:'offroad-4x4',label:'Rugged off-road 4×4',family:'suv',length:4.62,width:2.01,height:1.97,wheelbase:2.79,radius:.45,axles:2,roof:'estate',color:'#848b70'},
 {id:'performance-suv',label:'Performance fastback SUV',family:'suv',length:4.97,width:2.04,height:1.62,wheelbase:2.93,radius:.40,axles:2,roof:'saloon',color:'#8e6d7e'},
 {id:'formula-modern',label:'Modern single-seater',family:'formula',length:5.40,width:1.98,height:1.04,wheelbase:3.42,radius:.36,axles:2,color:'#20afa2'},
 {id:'formula-classic',label:'Classic single-seater',family:'formula',length:4.35,width:1.82,height:.97,wheelbase:2.65,radius:.34,axles:2,color:'#cf6343'},
 {id:'sport-bike',label:'Sport motorcycle',family:'bike',length:2.10,width:.72,height:1.12,wheelbase:1.40,radius:.31,axles:2,color:'#d84b53'},
 {id:'naked-bike',label:'Naked motorcycle',family:'bike',length:2.04,width:.79,height:1.09,wheelbase:1.38,radius:.31,axles:2,color:'#36a593'},
 {id:'touring-bike',label:'Touring motorcycle',family:'bike',length:2.32,width:.88,height:1.40,wheelbase:1.55,radius:.33,axles:2,color:'#486891'},
 {id:'pickup',label:'Utility pickup',family:'truck',length:5.50,width:2.04,height:1.82,wheelbase:3.30,radius:.41,axles:2,roof:'saloon',color:'#bd7547'},
 {id:'box-truck',label:'Urban box truck',family:'truck',length:7.05,width:2.38,height:3.28,wheelbase:4.20,radius:.48,axles:2,color:'#e2ded2'},
 {id:'tractor-truck',label:'Heavy tractor unit',family:'truck',length:6.70,width:2.44,height:3.40,wheelbase:3.88,radius:.52,axles:3,color:'#4c789a'},
] as const satisfies readonly VehicleSpec[];
export type VehicleVariant=typeof VEHICLES[number]['id'];
export type VehicleOptions={variant:VehicleVariant;color?:string;accent?:string;wheelColor?:string;lights?:boolean;interior?:boolean;interiorColor?:string;steeringSide?:'left'|'right'};
export function vehicleSpec(id:string):VehicleSpec{const s=VEHICLES.find(v=>v.id===id);if(!s)throw new Error(`Unknown vehicle variant: ${id}`);return s;}
export const ENVIRONMENTS=['highway','city','track','coast','mountain','forest','desert','snow','tunnel','bridge','industrial','parking','airfield','garage','showroom','suburb','harbor','canyon','autumn','proving-ground'] as const;
export type EnvironmentKind=typeof ENVIRONMENTS[number];
export type TimeOfDay='day'|'dusk'|'night';
