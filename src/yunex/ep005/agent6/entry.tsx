import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {AbsoluteFill, Composition, cancelRender, continueRender, delayRender, registerRoot, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Agent 6 car-only quality gate. External CC0 GLB, NOT the rejected EP005 car.
 * Upstream commit and expected git-blob SHA are pinned by fetch-asset.sh.
 * Coordinates in this scene: +Z forward, +Y up, -X driver left, metres.
 */
export const OUTLETS = [
  {name: 'exhaust-left', side: -1, center: [-0.56, 0.57, -2.515] as const},
  {name: 'exhaust-right', side: 1, center: [0.56, 0.57, -2.515] as const},
] as const;
export const VISIBLE_TIP_OUTER_DIAMETER_M = 0.114;
export const MOUTH_INNER_DIAMETER_M = 0.082;

/**
 * Parent-relative exhaust interface for Agent 7.
 * Call after updating the car world matrix for the current frame.
 * The returned vectors are frame-exact; the neutral preview keeps the car static.
 */
export function sampleExhaustWorld(car: THREE.Object3D, frame: number) {
  car.updateWorldMatrix(true, true);
  return OUTLETS.map((port) => {
    const p = new THREE.Vector3(-2.515, 0.57, -port.side * 0.56).applyMatrix4(car.matrixWorld);
    const direction = new THREE.Vector3(-1, 0, 0)
      .transformDirection(car.matrixWorld).normalize();
    return {
      frame,
      name: port.name,
      worldOrigin: p.toArray(),
      worldOutward: direction.toArray(),
      innerRadiusM: MOUTH_INNER_DIAMETER_M / 2,
      visibleOuterDiameterM: VISIBLE_TIP_OUTER_DIAMETER_M,
    };
  });
}

function makeHeroAsset(original: THREE.Group): THREE.Group {
  // The upstream GLB is exported Y-up with original model +X forward.
  // Matching the original author's real-time viewer turns +X into +Z.
  const car = original;
  car.name = 'ep005-agent6-reviewed-hero-candidate';
  car.rotation.y = -Math.PI / 2;
  car.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    node.castShadow = true;
    node.receiveShadow = true;
    // The upstream outlets are too large (156mm visible rings).
    // Hide them and install 114mm recessed replacements at known mounts.
    if (/^Exhaust_(Outer|Ring|Inner)_/.test(node.name)) node.visible = false;
  });

  const metal = new THREE.MeshStandardMaterial({color: '#a4a9ae', metalness: 0.83, roughness: 0.23, side: THREE.DoubleSide});
  const cavity = new THREE.MeshStandardMaterial({color: '#070b0d', metalness: 0.18, roughness: 0.78, side: THREE.DoubleSide});
  for (const outlet of OUTLETS) {
    // GLTF-local coordinate mapping from Blender XYZ to glTF (X,Z,-Y).
    const gltfX = -2.515;
    const gltfY = outlet.center[1];
    const gltfZ = -outlet.side * 0.56;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(MOUTH_INNER_DIAMETER_M / 2, VISIBLE_TIP_OUTER_DIAMETER_M / 2, 48),
      metal,
    );
    ring.name = 'visible-' + outlet.name;
    ring.position.set(gltfX, gltfY, gltfZ);
    ring.rotation.y = -Math.PI / 2; // rear-facing -X before car orientation correction
    car.add(ring);
    const blackHole = new THREE.Mesh(new THREE.CircleGeometry(MOUTH_INNER_DIAMETER_M / 2, 48), cavity);
    blackHole.name = 'recessed-' + outlet.name;
    blackHole.position.set(gltfX + 0.012, gltfY, gltfZ);
    blackHole.rotation.y = -Math.PI / 2;
    car.add(blackHole);
  }
  car.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(car);
  car.position.y -= bounds.min.y; // tyres sit on the review floor
  car.updateMatrixWorld(true);
  car.userData = {...car.userData, evidence: 'CC0 Spectral GT RS 34499c501908818a2b08e589a7aecf963343cee7', portVersion: 'agent6-v1'};
  return car;
}

function LoadedHero(): React.ReactElement | null {
  const [car, setCar] = useState<THREE.Group | null>(null);
  const handle = useRef<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    const h = delayRender('Loading pinned CC0 hero GLB');
    handle.current = h;
    const loader = new GLTFLoader();
    loader.load(staticFile('ep005-agent6/spectral_gt_rs_game_ready.glb'), gltf => {
      if (!cancelled) setCar(makeHeroAsset(gltf.scene));
    }, undefined, error => {
      if (!cancelled) cancelRender(error instanceof Error ? error : new Error(String(error)));
    });
    return () => {cancelled = true;};
  }, []);
  useEffect(() => {
    if (car && handle.current !== null) {
      continueRender(handle.current);
      handle.current = null;
    }
  }, [car]);
  return car ? <primitive object={car} /> : null;
}

function cubicEase(x: number) {
  const y = THREE.MathUtils.clamp(x, 0, 1);
  return y * y * (3 - 2 * y);
}

function CameraRig({portrait}: {portrait: boolean}): null {
  const frame = useCurrentFrame();
  const {camera} = useThree();
  // A continuous, deterministic neutral-lit inspection, no hidden cutaways.
  const keyframes = [
    {f: 0, angle: 0},
    {f: 24, angle: -Math.PI / 4},
    {f: 52, angle: -Math.PI / 2},
    {f: 92, angle: -Math.PI * .78},
    {f: 119, angle: -Math.PI},
  ];
  let angle = keyframes[keyframes.length - 1].angle;
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i], b = keyframes[i + 1];
    if (frame <= b.f) {
      angle = THREE.MathUtils.lerp(a.angle, b.angle, cubicEase((frame - a.f) / (b.f - a.f)));
      break;
    }
  }
  useLayoutEffect(() => {
    // Wider portrait framing is deliberate: pure side and both bumpers must fit.
    const radius = portrait ? 13.65 : 6.7;
    camera.position.set(Math.sin(angle) * radius, portrait ? 2.45 : 2.00, Math.cos(angle) * radius);
    camera.lookAt(0, .85, 0);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = portrait ? 43 : 46;
      camera.near = 0.04;
      camera.far = 100;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
  }, [angle, camera, portrait]);
  return null;
}

const Proof: React.FC<{portrait: boolean}> = ({portrait}) => {
  const {width, height} = useVideoConfig();
  const frame = useCurrentFrame();
  const label = frame < 23 ? 'FRONT' : frame < 68 ? 'SIDE PROFILE' : frame < 102 ? 'REAR THREE-QUARTER' : 'REAR';
  return (
    <AbsoluteFill style={{backgroundColor: '#d5dadd'}}>
      <ThreeCanvas width={width} height={height} shadows gl={{antialias: true}} camera={{fov: 43, near: 0.04, far: 100}}>
        <color attach="background" args={['#d5dadd']} />
        <ambientLight color="#ffffff" intensity={1.35} />
        <hemisphereLight args={['#e5f1ff', '#858b89', 2.0]} />
        <directionalLight position={[6, 10, 7]} intensity={3.0} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-.00008} />
        <directionalLight position={[-6, 8, -7]} color="#f1f7ff" intensity={2.3} />
        <directionalLight position={[2, 5, -8]} color="#fff1de" intensity={1.5} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.024, 0]} receiveShadow>
          <planeGeometry args={[120, 120]} />
          <meshStandardMaterial color="#abb4bb" metalness={0.06} roughness={0.85} />
        </mesh>
        <LoadedHero />
        <CameraRig portrait={portrait} />
      </ThreeCanvas>
      <div style={{position: 'absolute', top: portrait ? 90 : 44, left: portrait ? 58 : 64, color: '#1a2731', fontFamily: 'Arial, sans-serif', fontSize: portrait ? 30 : 29, fontWeight: 700, letterSpacing: 2}}>
        YUNEX / HERO CAR STUDY
        <div style={{fontSize: portrait ? 21 : 19, fontWeight: 400, letterSpacing: 1.5, marginTop: 11}}>{label} — CC0 ASSET / UNAPPROVED</div>
      </div>
      <div style={{position: 'absolute', bottom: portrait ? 78 : 48, left: portrait ? 58 : 64, color: '#36414a', fontFamily: 'Arial, sans-serif', fontSize: portrait ? 20 : 16}}>
        Neutral lighting · no flames · no grading · 114 mm tips
      </div>
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <>
    <Composition id="Ep005Agent6HeroProofPortrait" component={Proof} defaultProps={{portrait: true}} width={1080} height={1920} fps={30} durationInFrames={120} />
    <Composition id="Ep005Agent6HeroProofLandscape" component={Proof} defaultProps={{portrait: false}} width={1920} height={1080} fps={30} durationInFrames={120} />
  </>
);
registerRoot(Root);
