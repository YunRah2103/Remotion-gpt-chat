import type {CinematicShotId} from '../cinema/cameras.ts';
import type {FilmBeat} from '../graphics/model.ts';

/**
 * 26-second picture edit. Story coverage is deliberately replays of ONE physically
 * solved corner, not six different fictional races. The payoff (16.0–21.8s) is
 * sampled at exact real-time speed from t=0, preserving A2's finish delta.
 */
export const FILM_FPS=30;
export const FILM_FRAMES=780;
export const FILM_SECONDS=FILM_FRAMES/FILM_FPS;
export type EditSegment={
 start:number;end:number;shot:CinematicShotId;beat:FilmBeat;
 replay:boolean;sourceStart:number;sourceRate:number;
};
export const EDIT:readonly EditSegment[]=[
 {start:0,end:36,shot:'opening',beat:'hook',replay:true,sourceStart:.65,sourceRate:1},
 {start:36,end:60,shot:'duel',beat:'hook',replay:true,sourceStart:1.85,sourceRate:1},
 {start:60,end:120,shot:'shortcut',beat:'shortcut',replay:true,sourceStart:.7,sourceRate:1},
 {start:120,end:180,shot:'apex',beat:'shortcut',replay:true,sourceStart:2.7,sourceRate:1},
 {start:180,end:250,shot:'wide-entry',beat:'wide',replay:true,sourceStart:.5,sourceRate:1},
 {start:250,end:302,shot:'overhead',beat:'wide',replay:true,sourceStart:2.8333333333,sourceRate:1},
 {start:302,end:330,shot:'onboard',beat:'wide',replay:true,sourceStart:4.5666666667,sourceRate:1},
 {start:330,end:402,shot:'force',beat:'explain',replay:true,sourceStart:.6,sourceRate:1},
 {start:402,end:480,shot:'apex',beat:'explain',replay:true,sourceStart:3,sourceRate:1},
 {start:480,end:540,shot:'duel',beat:'payoff',replay:false,sourceStart:0,sourceRate:1},
 {start:540,end:588,shot:'overhead',beat:'payoff',replay:false,sourceStart:2,sourceRate:1},
 {start:588,end:654,shot:'exit',beat:'payoff',replay:false,sourceStart:3.6,sourceRate:1},
 {start:654,end:717,shot:'final',beat:'final',replay:true,sourceStart:1.5,sourceRate:1},
 {start:717,end:780,shot:'exit',beat:'final',replay:true,sourceStart:3.6,sourceRate:.9},
] as const;

export function editAtFrame(frame:number){
 if(!Number.isInteger(frame)||frame<0||frame>=FILM_FRAMES)throw new Error('Film frame out of range');
 const segment=EDIT.find(s=>frame>=s.start&&frame<s.end);
 if(!segment)throw new Error('Missing cinematic edit segment: '+frame);
 const localFrame=frame-segment.start;
 // All vehicles, tyre rotation, steering, on-track graphics and camera tracking
 // consume the SAME sampled physical time. Only coverage/edit playback is retimed.
 const sourceSeconds=segment.sourceStart+(localFrame/FILM_FPS)*segment.sourceRate;
 return {...segment,localFrame,sourceSeconds,sourceFrame:sourceSeconds*FILM_FPS};
}
