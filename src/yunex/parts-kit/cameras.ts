import * as T from 'three';
import type { V3 } from './helpers.ts';
export function partCamera(g: T.Object3D, portrait = false): {
    position: V3;
    target: V3;
    fov: number;
} { g.updateWorldMatrix(true, true); const bounds = new T.Box3().setFromObject(g, true); if (bounds.isEmpty())
    throw new Error('Cannot frame empty part'); const centre = bounds.getCenter(new T.Vector3()), r = bounds.getSize(new T.Vector3()).length() / 2, fov = 38, aspect = portrait ? 9 / 16 : 16 / 9, half = Math.min(fov * Math.PI / 360, Math.atan(Math.tan(fov * Math.PI / 360) * aspect)), d = r / Math.sin(half) * 1.14; return { position: centre.clone().add(new T.Vector3(.72, .48, 1).normalize().multiplyScalar(d)).toArray() as V3, target: centre.toArray() as V3, fov }; }
