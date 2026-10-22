export const CINEMATIC_BEATS=[
 {id:'hook',start:0,end:45},
 {id:'launch',start:45,end:165},
 {id:'engine-reveal',start:165,end:285},
 {id:'mechanism',start:285,end:420},
 {id:'exhaust',start:420,end:555},
 {id:'payoff',start:555,end:750}
] as const;
export type PictureBeat=typeof CINEMATIC_BEATS[number];
export function frameBeat(frame:number):PictureBeat{
 if(!Number.isFinite(frame)||frame<0||frame>=750)throw new Error('A5 frame must be in [0,750)');
 return CINEMATIC_BEATS.find(b=>frame<b.end)!;
}
export function explanationAt(frame:number):string|null{
 if(frame>=210&&frame<284)return 'Especially on overrun or with certain tunes.';
 if(frame>=330&&frame<418)return 'Unburnt fuel can reach hot exhaust gases.';
 if(frame>=474&&frame<525)return 'A short burst, not a continuous torch.';
 return null;
}
export const AFTERFIRE_WINDOWS=[[0,30],[430,490],[674,710]] as const;
export const PORTRAIT={width:1080,height:1920,fps:30,frames:750} as const;
