/**
 * Reversible lookdev for per-preview/per-shot V2 hero instances.
 * No geometry, wheel, plank, skid position, root transform or motion changes.
 * Important: apply after the V2 rig has finished creating its owned materials.
 */
import * as T from 'three';

export type NightMaterialRole = 'tyre' | 'carbon' | 'skid' | 'paint' | 'other';

export function classifyNightMaterial(name: string): NightMaterialRole {
  const s = name.toLowerCase();
  if (/tyre|tire|tread|rubber|sidewall/.test(s)) return 'tyre';
  if (/metal-skid|titanium-skid|skid-plate/.test(s)) return 'skid';
  if (/carbon|diffuser|underfloor|venturi|floor-fence/.test(s)) return 'carbon';
  if (/body|monocoque|nose|sidepod|aerofoil|wing|cockpit|paint/.test(s)) return 'paint';
  return 'other';
}

export function applyQualityNightCarFinish(root: T.Object3D): T.Object3D {
  // Material cloning prevents touching the shared V2 factory and other agents.
  const copies = new Map<T.Material, Map<NightMaterialRole, T.Material>>();
  root.traverse(o => {
    if (!(o instanceof T.Mesh)) return;
    const upgrade = (source: T.Material): T.Material => {
      const role = classifyNightMaterial(o.name + ' ' + source.name);
      if (role === 'other') return source;
      let byRole = copies.get(source);
      if (!byRole) { byRole = new Map(); copies.set(source, byRole); }
      const prior = byRole.get(role);
      if (prior) return prior;
      const clone = source.clone();
      clone.name = 'EP004-quality-' + role + '-' + (source.name || o.name);
      if (clone instanceof T.MeshStandardMaterial) {
        if (role === 'tyre') {
          clone.metalness = 0.01;
          clone.roughness = 0.93;
          clone.envMapIntensity = 0.24;
        } else if (role === 'carbon') {
          clone.metalness = 0.22;
          clone.roughness = 0.63;
          clone.envMapIntensity = 0.66;
        } else if (role === 'skid') {
          clone.metalness = 0.89;
          clone.roughness = 0.30;
          clone.envMapIntensity = 1.10;
        } else {
          clone.metalness = Math.max(0.34, Math.min(0.64, clone.metalness));
          clone.roughness = Math.min(0.28, Math.max(0.17, clone.roughness));
          clone.envMapIntensity = 1.32;
          if (clone instanceof T.MeshPhysicalMaterial) {
            clone.clearcoat = 0.94;
            clone.clearcoatRoughness = 0.17;
          }
        }
      }
      byRole.set(role, clone);
      return clone;
    };
    o.material = Array.isArray(o.material) ? o.material.map(upgrade) : upgrade(o.material);
  });
  root.userData.nightFinish = 'material-only-clones; physics-safe';
  return root;
}
