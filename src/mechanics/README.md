# Reusable procedural mechanical assemblies

Import from `src/mechanics/parts.tsx` (React Three Fiber):

```tsx
import {WheelAssembly, BrakeDisc, BrakeCaliper, WheelSpeedSensor, CoilSpring, MechanicalGear, HydraulicValve} from './mechanics/parts';

export const BrakeAssemblyPreview = () => (
  <group>
    <WheelAssembly scale={1}/>
  </group>
);
```

Parts are **original simplified mesh assemblies**, not accurate manufacturer CAD. They are suitable for layout previews, educational cutaways and compositional tests. For high-fidelity ABS explanations, refine/calibrate wheel hub, sensor, brake circuit, caliper/pad motion and chassis context to the real engineering system.

The `WheelAssembly` is a visual preview and contains its own disc/caliper/sensor. Do not add duplicates when embedding it. Wheel plane faces local +Z.

Parts:
- `BrakeDisc`: thick cylindrical rotor and hub.
- `BrakeCaliper`: caliper/pad illustrative assembly.
- `WheelAssembly`: tyre, rim, disc, caliper and speed sensor.
- `WheelSpeedSensor`: independent schematic sensor.
- `CoilSpring`: actual 3D tube along a helix.
- `MechanicalGear`: radial teeth and gear body.
- `HydraulicValve`: solenoid-like valve body.

The original 3D geometry is available as code so shots can share materials/measurements and use separate animation transforms. Use project-specific camera and rigging; these components do not simulate hydraulic or braking physics by themselves.
