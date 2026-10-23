import * as T from 'three';
import type { V3 } from './helpers.ts';
export type PartState = {
    shaftAngle?: number;
    compression?: number;
    steer?: number;
    deployment?: number;
    explode?: number;
    heat?: number;
};
/** Absolute state, in radians and 0..1 controls; safe in reverse or out of order. */
export function animatePart(g: T.Object3D, state: PartState = {}) {
    const s = { shaftAngle: 0, compression: 0, steer: 0, deployment: 0, explode: 0, heat: 0, ...state };
    for (const k of Object.keys(s) as (keyof typeof s)[])
        if (s[k] === undefined)
            s[k] = 0;
    for (const [k, v] of Object.entries(s))
        if (typeof v !== 'number' || !Number.isFinite(v))
            throw new Error(`${k} must be finite`);
    const angle = s.shaftAngle % (Math.PI * 2), c = T.MathUtils.clamp(s.compression, 0, 1), steer = T.MathUtils.clamp(s.steer, -.65, .65), deployment = T.MathUtils.clamp(s.deployment, 0, 1), explode = T.MathUtils.clamp(s.explode, 0, 1), heat = T.MathUtils.clamp(s.heat, 0, 1);
    const mats = new Set<T.Material>();
    g.traverse(o => {
        const rest = o.userData.rest, m = o.userData.motion;
        if (rest) {
            o.position.fromArray(rest.position);
            o.rotation.set(...rest.rotation as [
                number,
                number,
                number
            ]);
            o.scale.fromArray(rest.scale);
        }
        if (m) {
            const axis = m.axis as 'x' | 'y' | 'z';
            if (m.kind === 'rotate')
                o.rotation[axis] += (s.shaftAngle % (Math.PI * 2 / Math.abs(m.ratio))) * m.ratio;
            else if (m.kind === 'steerRotate')
                o.rotation[axis] += steer * m.ratio;
            else if (m.kind === 'translate')
                o.position[axis] += m.travel * (m.control === 'steer' ? steer : c);
            else if (m.kind === 'deployment')
                o.rotation[axis] += m.range * deployment;
            else if (m.kind === 'suspensionHub') {
                o.position.y += m.travel * c;
                o.position.z += Math.sqrt(m.span * m.span - Math.pow(m.travel * c, 2)) - m.span;
            }
            else if (m.kind === 'link') {
                const a = new T.Vector3(...m.start), b = new T.Vector3(...m.end);
                b.y += m.travel * c;
                if (m.arcSpan)
                    b.z += Math.sqrt(m.arcSpan * m.arcSpan - Math.pow(m.travel * c, 2)) - m.arcSpan;
                const d = b.clone().sub(a), length = d.length();
                o.position.copy(a.add(b).multiplyScalar(.5));
                o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
                o.scale.y = length / m.originalLength;
            }
            else if (m.kind === 'leaf' && o instanceof T.Mesh) {
                const a = o.geometry.attributes.position;
                for (let i = 0; i < a.count; i++) {
                    const t = Math.floor(i / m.ringSize) / m.segments, bend = 1 - Math.pow(2 * t - 1, 2);
                    a.setY(i, m.restVertices[i * 3 + 1] + m.travel * c * (bend - 1));
                }
                a.needsUpdate = true;
                o.geometry.computeVertexNormals();
                o.geometry.computeBoundingBox();
                o.geometry.computeBoundingSphere();
            }
            else if (m.kind === 'spring') {
                o.position.y += m.travel * c;
                o.scale.y *= 1 - m.travel * c / m.span;
            }
            else if (m.kind === 'arm')
                o.rotation.x -= Math.asin(m.travel * c / m.span);
            else if (m.kind === 'piston')
                o.position.y = m.base + m.radius * Math.cos(angle + m.phase) + Math.sqrt(m.length * m.length - Math.pow(m.radius * Math.sin(angle + m.phase), 2));
            else if (m.kind === 'conrod') {
                const a = angle + m.phase, pin = new T.Vector3(m.x, m.radius * Math.cos(a), m.radius * Math.sin(a)), crown = new T.Vector3(m.x, pin.y + Math.sqrt(m.length * m.length - pin.z * pin.z), 0), d = crown.clone().sub(pin);
                o.position.copy(pin.add(crown).multiplyScalar(.5));
                o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
                o.scale.y = m.length / m.originalLength;
            }
        }
        if (o.userData.explode)
            o.position.addScaledVector(new T.Vector3(...o.userData.explode), explode);
        if (o instanceof T.Mesh)
            for (const mat of (Array.isArray(o.material) ? o.material : [o.material]))
                if (mat.userData.heat)
                    mats.add(mat);
    });
    for (const material of mats) {
        const m = material as T.MeshStandardMaterial;
        if (!m.userData.restColor)
            m.userData.restColor = m.color.toArray();
        m.color.fromArray(m.userData.restColor).lerp(new T.Color('#d4481c'), heat * .60);
        m.emissive.set('#ff3c0b');
        m.emissiveIntensity = heat * 1.1;
    }
    g.updateMatrixWorld(true);
}
/** Connection point and unit direction in world coordinates, including the assembly pose. */
export function partMount(g: T.Object3D, name: string): {
    position: V3;
    direction: V3;
} { let p: T.Object3D | undefined; g.traverse(o => { if (o.userData.mount && o.userData.mountName === name)
    p = o; }); if (!p?.userData.mount)
    throw new Error(`Unknown mounting point: ${name}`); g.updateWorldMatrix(true, true); return { position: p.getWorldPosition(new T.Vector3()).toArray() as V3, direction: new T.Vector3(...p.userData.direction).transformDirection(p.matrixWorld).toArray() as V3 }; }
