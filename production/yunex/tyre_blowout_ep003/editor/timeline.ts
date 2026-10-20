/**
 * EP003 Agent 6 — phase-2 editor timeline, conformed to the user's 26.664s
 * supplied Cedar voiceover. Phrase boundaries come from waveform silence,
 * manually assigned to the provided transcript (not claimed as word alignment).
 *
 * All shots use ONE absolute deterministic Agent-2 simulation. Editorial time
 * compression is monotonic and no discontinuous state reset occurs on a cut.
 * Only visual X rebasing is permitted at genuine hard cuts.
 */
import type {VehicleDynamicsFrame, WheelId, TyreFrame, StoryRequest} from '../shared/contract.ts';
import {sampleDynamics,DYNAMICS_DEFAULTS} from '../dynamics/model.ts';
import {sampleTyreFailure} from '../mechanics/sampleTyreFailure.ts';
import type {CinemaShot} from '../cinema/cameras.ts';

export const EP003_FPS=30;
export const EP003_DURATION_FRAMES=800; // 26.6667s; recording 26.664s.
export const EP003_RECORDING_SEC=26.664;
/** The actual narration says 70 mph, not the 100 km/h preview default. */
export const EP003_NARRATED_SPEED_MPS=70*0.44704;
const EP003_FILM_PHYSICS={...DYNAMICS_DEFAULTS,initialSpeedMps:EP003_NARRATED_SPEED_MPS};

export type VoiceCue={id:string;start:number;end:number;text:string};
export const VO_CUES:readonly VoiceCue[]=[
 {id:'vo-01',start:0,end:1.200,text:'Seventy miles an hour.'},
 {id:'vo-02',start:1.755,end:3.285,text:'One tyre suddenly gives way.'},
 {id:'vo-03',start:3.810,end:5.710,text:'The car pulls to the right, but why?'},
 {id:'vo-04',start:6.350,end:7.400,text:'As the tyre collapses,'},
 {id:'vo-05',start:7.945,end:9.230,text:'the forces at that wheel change,'},
 {id:'vo-06',start:9.650,end:10.980,text:'dragging the car off course.'},
 {id:'vo-07',start:11.665,end:12.380,text:'Your first instinct?'},
 {id:'vo-08',start:12.830,end:13.570,text:'Slam the brakes.'},
 {id:'vo-09',start:14.045,end:15.350,text:'But that could make things even worse.'},
 {id:'vo-10',start:16.015,end:16.595,text:'Grip the wheel,'},
 {id:'vo-11',start:16.915,end:17.735,text:'steer smoothly,'},
 {id:'vo-12',start:18.080,end:19.840,text:'and gradually ease off the accelerator.'},
 {id:'vo-13',start:20.425,end:21.405,text:'Let the car slow down,'},
 {id:'vo-14',start:21.905,end:23.015,text:"then pull over when it's safe."},
 {id:'vo-15',start:23.800,end:24.700,text:'One tyre fails.'},
 {id:'vo-16',start:25.260,end:26.390,text:'The next few seconds matter.'},
] as const;
export type EditorialShot={
 from:number;to:number;shot:CinemaShot;
 segment:StoryRequest['segment'];sceneX:number;
 caption?:string;
};
export const EDIT:readonly EditorialShot[]=[
 {from:0,to:1.25,shot:'tyre-hook',segment:'hook',sceneX:-62},
 {from:1.25,to:1.755,shot:'low-tracking',segment:'hook',sceneX:-62},
 {from:1.755,to:2.72,shot:'front-three-quarter',segment:'pressure',sceneX:-63},
 {from:2.72,to:3.810,shot:'chase-recovery',segment:'pressure',sceneX:-58},
 {from:3.810,to:4.82,shot:'rear-three-quarter',segment:'hook',sceneX:-62},
 {from:4.82,to:5.60,shot:'low-tracking',segment:'forces',sceneX:-59},
 {from:5.60,to:6.350,shot:'overhead-dynamics',segment:'forces',sceneX:-53},
 {from:6.350,to:7.20,shot:'underbody',segment:'pressure',sceneX:-57},
 {from:7.20,to:7.945,shot:'front-three-quarter',segment:'pressure',sceneX:-62},
 {from:7.945,to:8.72,shot:'wheel-cutaway',segment:'forces',sceneX:-58},
 {from:8.72,to:9.650,shot:'low-tracking',segment:'forces',sceneX:-61},
 {from:9.650,to:10.48,shot:'overhead-dynamics',segment:'forces',sceneX:-55},
 {from:10.48,to:11.665,shot:'rear-three-quarter',segment:'forces',sceneX:-59},
 {from:11.665,to:12.830,shot:'driver-cockpit',segment:'reaction',sceneX:-56},
 {from:12.830,to:14.045,shot:'low-tracking',segment:'reaction',sceneX:-61},
 {from:14.045,to:16.015,shot:'chase-recovery',segment:'reaction',sceneX:-42},
 {from:16.015,to:18.080,shot:'driver-cockpit',segment:'reaction',sceneX:-62},
 {from:18.080,to:20.425,shot:'driver-cockpit',segment:'recovery',sceneX:-62},
 {from:20.425,to:21.905,shot:'rear-three-quarter',segment:'recovery',sceneX:-57},
 {from:21.905,to:23.800,shot:'safe-stop',segment:'recovery',sceneX:38},
 {from:23.800,to:25.260,shot:'underbody',segment:'payoff',sceneX:-59},
 {from:25.260,to:EP003_DURATION_FRAMES/EP003_FPS,shot:'chase-recovery',segment:'payoff',sceneX:-36},
] as const;
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
/** First seconds are almost real-time for a legible tyre failure; thereafter
 * editorial physical-time compression keeps source inside the approved road
 * and within Agent 2's 32s simulation horizon. No fictional stopping. */
export function sourceTime(filmTime:number):number{
 if(!Number.isFinite(filmTime)||filmTime<0||filmTime>EP003_DURATION_FRAMES/EP003_FPS+.01)throw Error('Invalid EP003 film time');
 return .65+Math.min(filmTime,2.8)+Math.max(0,filmTime-2.8)*.34;
}
export function cutAt(filmTime:number):{edit:EditorialShot;progress01:number;index:number}{
 const index=Math.max(0,EDIT.findIndex(e=>filmTime>=e.from&&filmTime<e.to));
 const i=filmTime>=EDIT[EDIT.length-1].from?EDIT.length-1:index;
 const edit=EDIT[i];
 return {edit,progress01:clamp((filmTime-edit.from)/(edit.to-edit.from)),index:i};
}
export function pictureFrame(filmTime:number):{
 dynamics:VehicleDynamicsFrame;tyre:TyreFrame;cut:EditorialShot;
 segment:StoryRequest['segment'];progress01:number;sourceTimeSec:number;
}{
 const {edit,progress01}=cutAt(filmTime);
 const t=sourceTime(filmTime);
 const d=sampleDynamics(t,EP003_FILM_PHYSICS);
 const origin=sampleDynamics(sourceTime(edit.from),EP003_FILM_PHYSICS);
 const dx=edit.sceneX-origin.positionM[0];
 const wheels={} as VehicleDynamicsFrame['wheels'];
 (Object.keys(d.wheels) as WheelId[]).forEach(id=>{
  const w=d.wheels[id];
  wheels[id]={...w,hubWorldM:[w.hubWorldM[0]+dx,w.hubWorldM[1],w.hubWorldM[2]]};
 });
 const rebased:VehicleDynamicsFrame={...d,positionM:[d.positionM[0]+dx,d.positionM[1],d.positionM[2]],wheels};
 const tyre=sampleTyreFailure(t,{angularPhaseRad:d.wheels['front-right'].spinRad});
 return {dynamics:rebased,tyre,cut:edit,segment:edit.segment,progress01,sourceTimeSec:t};
}
