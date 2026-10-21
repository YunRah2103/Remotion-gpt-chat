/**
 * Agent 6 editorial trim of Agent 3's APPROVED moving contact-macro pose.
 * The approved pose is intentionally an extreme engineering inspection lens:
 * in the *full* story this can fill the entire frame with carbon and hide the
 * actual car/road interaction. Pull the same lens OUT from its real skid target.
 * Neither the source physics, the skid coordinates nor camera's look-at changes.
 */
import type {CameraPose} from '../shared/contract.ts';

export function contextualContactCamera(pose:CameraPose):CameraPose{
 const point=pose.positionWorld,target=pose.targetWorld;
 const radius=Math.hypot(...point.map((p,i)=>p-target[i]));
 if(!Number.isFinite(radius)||radius<.1)
  throw new Error('EP004 contact macro must use a valid approved Agent 3 pose');
 // A pulled-back low side lens that still focuses on the exact genuine skid
 // target. 4.5+ metres from the focus prevents wall-to-wall underside meshes.
 const factor=Math.max(1,4.7/radius);
 const positionWorld=point.map((p,i)=>target[i]+(p-target[i])*factor) as [number,number,number];
 // Make it trackside-low, rather than an airborne spectator view. A3 already
 // controls the unchanged look-at; only the editor's shot crop is widened.
 const gazeHeight=positionWorld[1]-target[1];
 if(gazeHeight>1.12) positionWorld[1]-=(gazeHeight-1.12);
 const separation=Math.hypot(...positionWorld.map((p,i)=>p-target[i]));
 if(!(separation>3.2)) throw new Error('EP004 contact macro crop collides with actual F1 body');
 return {...pose,positionWorld,focusDistanceM:separation};
}
