/**
 * EP004 Agent 4: scene-local photometric finishing for EXISTING kit vehicle.
 * Clones only materials; it never creates geometry or changes the Agent 1 hero.
 * Apply once per separately-owned preview model, not to shared factory assets.
 */
import * as THREE from 'three';

function carbonWeave() {
  const size = 64;
  const bytes = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const weft = (x + Math.floor(y / 3)) % 6 < 3;
      const warp = (y + Math.floor(x / 3)) % 6 < 3;
      const luminance = 122 + (weft === warp ? 21 : -9);
      const at = (y * size + x) * 4;
      bytes[at] = bytes[at + 1] = bytes[at + 2] = luminance;
      bytes[at + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(bytes, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export function applyNightCircuitFinish(root: THREE.Object3D): THREE.Object3D {
  const copies = new Map<THREE.Material, THREE.Material>();
  const carbon = carbonWeave();
  let usedCarbon = false;
  root.traverse(obj => {
    if (!(obj instanceof THREE.Mesh)) return;
    const originals = Array.isArray(obj.material) ? obj.material : [obj.material];
    const replacements = originals.map(original => {
      let material = copies.get(original);
      if (material) return material;
      material = original.clone();
      material.name = 'EP004 night-finished ' + (original.name || obj.name);
      if (material instanceof THREE.MeshPhysicalMaterial) {
        // Factory body/wing paint already has genuine PBR; strengthen
        // restrained floodlight glints without replacing its identity.
        if (!material.transparent) {
          material.clearcoat = 0.94;
          material.clearcoatRoughness = 0.15;
          material.roughness = Math.min(material.roughness, 0.27);
          material.metalness = Math.max(material.metalness, 0.35);
          material.envMapIntensity = 1.65;
        } else {
          material.clearcoat = 1;
          material.roughness = 0.085;
          material.envMapIntensity = 1.8;
          material.depthWrite = false;
        }
      } else if (material instanceof THREE.MeshStandardMaterial) {
        const hex = material.color.getHexString();
        if (hex === '18232a' || hex === '15191c') {
          // Matte carbon/floor and scrubbed rubber must NOT look like chrome.
          material.metalness = hex === '18232a' ? 0.14 : 0.02;
          material.roughness = hex === '18232a' ? 0.73 : 0.86;
          if (hex === '18232a') {
            material.bumpMap = carbon;
            material.bumpScale = 0.004;
            usedCarbon = true;
          }
        } else if (material.metalness > 0.6) {
          material.roughness = Math.min(0.4, Math.max(0.24, material.roughness));
          material.envMapIntensity = 1.25;
        }
      }
      copies.set(original, material);
      return material;
    });
    obj.material = Array.isArray(obj.material) ? replacements : replacements[0];
  });
  // Each preview factory model owns these originals; release replaced materials.
  for (const original of copies.keys()) original.dispose();
  if (!usedCarbon) carbon.dispose();
  return root;
}
