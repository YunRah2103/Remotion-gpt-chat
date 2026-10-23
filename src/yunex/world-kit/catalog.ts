/** Original generic silhouettes. Units: metres; +X forward, +Y up, +Z left. */
export type VehicleFamily='normal'|'sports'|'suv'|'formula'|'bike'|'truck'|'van';
export type VehicleSpec={id:string;label:string;family:VehicleFamily;length:number;width:number;height:number;wheelbase:number;radius:number;axles:number;roof?:'saloon'|'hatch'|'estate'|'open';bodyStyle?:'retro'|'muscle'|'targa'|'track'|'ev'|'rally';seats?:number;color:string};
export const VEHICLES=[
 {id:'saloon',label:'Everyday saloon',family:'normal',length:4.55,width:1.82,height:1.46,wheelbase:2.72,radius:.33,axles:2,roof:'saloon',color:'#426d8c'},
 {id:'hatchback',label:'City hatchback',family:'normal',length:4.05,width:1.76,height:1.50,wheelbase:2.52,radius:.32,axles:2,roof:'hatch',color:'#d9b54b'},
 {id:'estate',label:'Touring estate',family:'normal',length:4.85,width:1.85,height:1.51,wheelbase:2.85,radius:.34,axles:2,roof:'estate',color:'#648a7e'},
 {id:'compact',label:'Compact three-door',family:'normal',length:3.63,width:1.69,height:1.43,wheelbase:2.32,radius:.30,axles:2,roof:'hatch',color:'#d97a5c'},
 {id:'coupe',label:'Sports coupe',family:'sports',length:4.43,width:1.90,height:1.25,wheelbase:2.62,radius:.35,axles:2,roof:'saloon',color:'#24a99b'},
 {id:'roadster',label:'Open roadster',family:'sports',length:4.05,width:1.80,height:1.17,wheelbase:2.45,radius:.33,axles:2,roof:'open',color:'#de7a40'},
 {id:'supercar',label:'Mid-engine supercar',family:'sports',length:4.70,width:2.01,height:1.13,wheelbase:2.78,radius:.36,axles:2,roof:'saloon',color:'#c64349'},
 {id:'grand-tourer',label:'Grand tourer',family:'sports',length:4.94,width:1.94,height:1.34,wheelbase:2.92,radius:.36,axles:2,roof:'saloon',color:'#6378b9'},
 {id:'crossover',label:'Urban crossover',family:'suv',length:4.43,width:1.89,height:1.71,wheelbase:2.68,radius:.38,axles:2,roof:'hatch',color:'#b5bdc0'},
 {id:'boxy-suv',label:'Utility SUV',family:'suv',length:4.72,width:1.98,height:1.92,wheelbase:2.80,radius:.42,axles:2,roof:'estate',color:'#9c9b70'},
 {id:'fastback-suv',label:'Fastback SUV',family:'suv',length:4.88,width:1.99,height:1.65,wheelbase:2.92,radius:.39,axles:2,roof:'saloon',color:'#735973'},
 {id:'formula-modern',label:'Modern single-seater',family:'formula',length:5.40,width:1.98,height:1.04,wheelbase:3.42,radius:.36,axles:2,color:'#20afa2'},
 {id:'formula-classic',label:'Classic single-seater',family:'formula',length:4.35,width:1.82,height:.97,wheelbase:2.65,radius:.34,axles:2,color:'#cf6343'},
 {id:'sport-bike',label:'Sport motorcycle',family:'bike',length:2.10,width:.72,height:1.12,wheelbase:1.40,radius:.31,axles:2,color:'#d84b53'},
 {id:'naked-bike',label:'Naked motorcycle',family:'bike',length:2.04,width:.79,height:1.09,wheelbase:1.38,radius:.31,axles:2,color:'#36a593'},
 {id:'touring-bike',label:'Touring motorcycle',family:'bike',length:2.32,width:.88,height:1.40,wheelbase:1.55,radius:.33,axles:2,color:'#486891'},
 {id:'pickup',label:'Utility pickup',family:'truck',length:5.50,width:2.04,height:1.82,wheelbase:3.30,radius:.41,axles:2,roof:'saloon',color:'#bd7547'},
 {id:'box-truck',label:'Urban box truck',family:'truck',length:7.05,width:2.38,height:3.28,wheelbase:4.20,radius:.48,axles:2,color:'#e2ded2'},
 {id:'tractor-truck',label:'Heavy tractor unit',family:'truck',length:6.70,width:2.44,height:3.40,wheelbase:3.88,radius:.52,axles:3,color:'#4c789a'},

 {id:'fastback',label:'Everyday fastback',family:'normal',length:4.68,width:1.85,height:1.43,wheelbase:2.79,radius:.34,axles:2,roof:'saloon',color:'#739b9c'},
 {id:'city-ev',label:'Compact electric car',family:'normal',length:3.85,width:1.78,height:1.57,wheelbase:2.48,radius:.32,axles:2,roof:'hatch',bodyStyle:'ev',color:'#c0cbb9'},
 {id:'luxury-saloon',label:'Long luxury saloon',family:'normal',length:5.25,width:1.98,height:1.52,wheelbase:3.18,radius:.36,axles:2,roof:'saloon',color:'#394e65'},
 {id:'retro-saloon',label:'Classic family saloon',family:'normal',length:4.38,width:1.75,height:1.48,wheelbase:2.62,radius:.32,axles:2,roof:'saloon',bodyStyle:'retro',color:'#c9b88c'},
 {id:'hot-hatch',label:'Sport hatchback',family:'normal',length:4.18,width:1.82,height:1.42,wheelbase:2.59,radius:.34,axles:2,roof:'hatch',bodyStyle:'track',color:'#c6634b'},
 {id:'muscle-coupe',label:'Muscle coupe',family:'sports',length:4.98,width:1.99,height:1.37,wheelbase:2.87,radius:.36,axles:2,roof:'saloon',bodyStyle:'muscle',seats:2,color:'#8e9d6f'},
 {id:'retro-coupe',label:'Classic sports coupe',family:'sports',length:4.24,width:1.77,height:1.28,wheelbase:2.47,radius:.33,axles:2,roof:'saloon',bodyStyle:'retro',seats:2,color:'#c58a52'},
 {id:'targa',label:'Targa sports car',family:'sports',length:4.48,width:1.91,height:1.26,wheelbase:2.66,radius:.35,axles:2,roof:'saloon',bodyStyle:'targa',seats:2,color:'#a1b1ba'},
 {id:'track-coupe',label:'Track-day coupe',family:'sports',length:4.57,width:1.97,height:1.23,wheelbase:2.71,radius:.36,axles:2,roof:'saloon',bodyStyle:'track',seats:2,color:'#d2a940'},
 {id:'compact-suv',label:'Compact SUV',family:'suv',length:4.12,width:1.83,height:1.68,wheelbase:2.53,radius:.37,axles:2,roof:'hatch',color:'#99aa8d'},
 {id:'long-suv',label:'Long family SUV',family:'suv',length:5.20,width:2.06,height:1.89,wheelbase:3.15,radius:.41,axles:2,roof:'estate',seats:7,color:'#66768c'},
 {id:'single-cab-pickup',label:'Single-cab pickup',family:'truck',length:5.26,width:1.99,height:1.76,wheelbase:3.13,radius:.39,axles:2,roof:'saloon',seats:2,color:'#b9b09a'},
 {id:'crew-pickup',label:'Crew-cab pickup',family:'truck',length:5.82,width:2.09,height:1.91,wheelbase:3.55,radius:.42,axles:2,roof:'saloon',seats:4,color:'#7d6553'},
 {id:'panel-van',label:'Cargo panel van',family:'van',length:5.42,width:2.03,height:2.48,wheelbase:3.39,radius:.38,axles:2,roof:'estate',seats:2,color:'#c9d0c9'},
 {id:'minivan',label:'Family minivan',family:'van',length:4.93,width:1.96,height:1.88,wheelbase:3.02,radius:.35,axles:2,roof:'estate',seats:7,color:'#668b9c'},
 {id:'camper-van',label:'Compact camper van',family:'van',length:5.65,width:2.10,height:2.66,wheelbase:3.48,radius:.39,axles:2,roof:'estate',seats:2,color:'#c2aa7a'},
 {id:'rally-hatch',label:'Widebody rally hatch',family:'normal',length:4.25,width:1.94,height:1.52,wheelbase:2.62,radius:.36,axles:2,roof:'hatch',bodyStyle:'rally',seats:2,color:'#e7e9e4'},
] as const satisfies readonly VehicleSpec[];
export type VehicleVariant=typeof VEHICLES[number]['id'];
export type VehicleOptions={variant:VehicleVariant;color?:string;accent?:string;wheelColor?:string;lights?:boolean;interior?:boolean;cutaway?:boolean;glassOpacity?:number;interiorColor?:string;steeringSide?:'left'|'right'};
export function vehicleSpec(id:string):VehicleSpec{const s=VEHICLES.find(v=>v.id===id);if(!s)throw new Error(`Unknown vehicle variant: ${id}`);return s;}
export const ENVIRONMENTS=['highway','city','track','coast','mountain','forest','desert','snow','tunnel','bridge','industrial','parking','airfield','garage','showroom','suburb','harbour','canyon','rally','service-station'] as const;
export type EnvironmentKind=typeof ENVIRONMENTS[number];
export type TimeOfDay='day'|'dusk'|'night';
