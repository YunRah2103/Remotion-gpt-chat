import * as T from 'three';
import { mesh, box, rod, surface, paint } from '../world-kit/geometry.ts';
import type { V3 } from '../world-kit/geometry.ts';
export { mesh, box, rod };
export type { V3 };
export function palette(color = '#7c8e99', accent = '#d08b3f') { return { metal: surface(color, .72, .36), dark: surface('#263640', .5, .56), rubber: surface('#202629', .02, .9), accent: paint(accent), alloy: surface('#b6c1c2', .82, .28), hot: surface('#7f6353', .6, .65), core: surface('#3d505b', .6, .62) }; }
export type Palette = ReturnType<typeof palette>;
export function group(p: T.Object3D, name: string, pos: V3 = [0, 0, 0], explode: V3 = [0, 0, 0]) { const g = new T.Group(); g.name = name; g.position.set(...pos); g.userData.explode = explode; p.add(g); return g; }
export function cylinder(p: T.Object3D, m: T.Material, r: number, h: number, pos: V3 = [0, 0, 0], axis: 'x' | 'y' | 'z' = 'y', name = 'cylinder', r2 = r) { return mesh(p, new T.CylinderGeometry(r, r2, h, 32), m, pos, axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0], name); }
export function ring(p: T.Object3D, m: T.Material, r: number, tube: number, pos: V3 = [0, 0, 0], axis: 'x' | 'y' | 'z' = 'z', name = 'ring', arc = Math.PI * 2) { return mesh(p, new T.TorusGeometry(r, tube, 8, 48, arc), m, pos, axis === 'x' ? [0, Math.PI / 2, 0] : axis === 'y' ? [Math.PI / 2, 0, 0] : [0, 0, 0], name); }
export function pipe(p: T.Object3D, m: T.Material, points: V3[], radius = .025, name = 'pipe') { return mesh(p, new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p))), Math.max(12, points.length * 8), radius, 8, false), m, [0, 0, 0], [0, 0, 0], name); }
export function bolts(p: T.Object3D, m: T.Material, r: number, z: number, n = 6, axis: 'x' | 'y' | 'z' = 'z') { for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    const pos: V3 = axis === 'x' ? [z, Math.cos(a) * r, Math.sin(a) * r] : axis === 'y' ? [Math.cos(a) * r, z, Math.sin(a) * r] : [Math.cos(a) * r, Math.sin(a) * r, z];
    cylinder(p, m, .012, .018, pos, axis, `bolt-${i}`);
} }
export function rotate(g: T.Object3D, axis: 'x' | 'y' | 'z', ratio = 1) { g.userData.motion = { kind: 'rotate', axis, ratio }; return g; }
export function mount(g: T.Object3D, name: string, pos: V3 = [0, 0, 0], direction: V3 = [1, 0, 0]) { const node = new T.Object3D(); node.name = `mount:${name}`; node.position.set(...pos); node.userData = { mount: true, mountName: name, direction }; g.add(node); return node; }
export function spring(g: T.Object3D, m: T.Material, height = .48, r = .065, turns = 6) { const pts: V3[] = Array.from({ length: 145 }, (_, i) => { const t = i / 144, a = t * Math.PI * 2 * turns; return [Math.cos(a) * r, t * height, Math.sin(a) * r]; }); return pipe(g, m, pts, .011, 'coil-spring'); }
export function gear(g: T.Object3D, m: T.Material, r = .12, z = 0, teeth = 16) { cylinder(g, m, r * .88, .045, [0, 0, z], 'z', 'gear-core'); for (let i = 0; i < teeth; i++) {
    const a = i / teeth * Math.PI * 2;
    const b = mesh(g, new T.BoxGeometry(r * .24, r * .16, .045), m, [Math.cos(a) * r, Math.sin(a) * r, z], [0, 0, 0], `gear-tooth-${i}`);
    b.rotation.z = a;
} ring(g, m, r * .38, .008, [0, 0, z + .026], 'z', 'gear-hub'); }
/** Expanding cross section around a scroll, with an open front throat. */
export function volute(g: T.Object3D, m: T.Material, r = .14, z = 0) { const pos: number[] = [], idx: number[] = [], steps = 48, sides = 10; for (let i = 0; i <= steps; i++) {
    const t = i / steps, a = t * Math.PI * 1.85, rr = r * (.80 + .24 * t), tube = r * (.22 + .20 * t);
    for (let j = 0; j <= sides; j++) {
        const b = j / sides * Math.PI * 2;
        pos.push(Math.cos(a) * (rr + Math.cos(b) * tube), Math.sin(a) * (rr + Math.cos(b) * tube), z + Math.sin(b) * tube);
        if (i < steps && j < sides) {
            const k = i * (sides + 1) + j;
            idx.push(k, k + sides + 1, k + 1, k + 1, k + sides + 1, k + sides + 2);
        }
    }
} for (const end of [0, steps]) {
    const t = end / steps, a = t * Math.PI * 1.85, rr = r * (.80 + .24 * t), centre = pos.length / 3;
    pos.push(Math.cos(a) * rr, Math.sin(a) * rr, z);
    const start = pos.length / 3;
    for (let j = 0; j <= sides; j++) {
        const k = (end * (sides + 1) + j) * 3;
        pos.push(pos[k], pos[k + 1], pos[k + 2]);
    }
    for (let j = 0; j < sides; j++) {
        if (end === 0)
            idx.push(centre, start + j, start + j + 1);
        else
            idx.push(centre, start + j + 1, start + j);
    }
} const geom = new T.BufferGeometry(); geom.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geom.setIndex(idx); geom.computeVertexNormals(); return mesh(g, geom, m, [0, 0, 0], [0, 0, 0], 'scroll-housing'); }
export function fan(g: T.Object3D, m: T.Material, r = .12, n = 9, z = 0) { cylinder(g, m, r * .22, .045, [0, 0, z], 'z', 'fan-hub'); for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    const blade = box(g, m, [r * .76, r * .19, .018], [Math.cos(a) * r * .58, Math.sin(a) * r * .58, z], .004, `blade-${i}`);
    blade.rotation.set(.24, 0, a + .24);
} }
/** Presentation link between a fixed inboard point and moving upright attachment. */
export function movingLink(g: T.Object3D, m: T.Material, start: V3, end: V3, name: string, arcSpan = 0) { const q = rod(g, m, start, end, .012); q.name = name; q.userData.motion = { kind: 'link', start, end, travel: .12, arcSpan, originalLength: new T.Vector3(...start).distanceTo(new T.Vector3(...end)) }; return q; }
