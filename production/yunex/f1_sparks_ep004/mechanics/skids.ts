import type {SkidDescriptor,SkidId} from '../shared/contract.ts';

/** Illustrative animation dimensions in metres; NOT FIA-homologated CAD data.
 * Bottoms at 65 mm from the kit's nominal Y=0 road when heave = pitch = roll = 0.
 * Structural floor and composite plank have separate materials and mesh names.
 */
export const SKID_BOTTOM_Y_M = 0.065;
export const PLANK_HALF_LENGTH_M = 1.90;
export const PLANK_HALF_WIDTH_M = 0.225;
export const SKID_THICKNESS_M = 0.020;
export const SKID_WIDTH_M = 0.32;
export const SKID_LAYOUT: ReadonlyArray<Readonly<{
  id: SkidId; xM: number; lengthM: number;
  mandatory: boolean; material: 'Ti6Al4V' | '17-4PH';
}>> = Object.freeze([
  {id: 'forward', xM: 1.18, lengthM: 0.60, mandatory: true, material: 'Ti6Al4V'},
  {id: 'middle',  xM: 0.10, lengthM: 0.46, mandatory: false, material: 'Ti6Al4V'},
  {id: 'rear',    xM: -1.03, lengthM: 0.48, mandatory: false, material: 'Ti6Al4V'},
]);

/** The returned points are on the actual named metallic meshes' BOTTOM surface.
 * Do not animate these independently of the vehicle root or emit from the plank.
 */
export function getSkidDescriptors(): readonly SkidDescriptor[] {
  return SKID_LAYOUT.map(s => ({
    id: s.id,
    localBottomPoint: [s.xM, SKID_BOTTOM_Y_M, 0] as const,
    metal: true as const,
  }));
}
