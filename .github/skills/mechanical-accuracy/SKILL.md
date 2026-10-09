---
name: mechanical-accuracy
description: Apply to brake, ABS, suspension, steering, differential, hydraulic, tyre and gearbox mechanical animation design or QA.
---

# Mechanical engineering QA

Inspect component axes, units, geometry clearance and real movement in every key shot.

For ABS: do not falsely show a wheel speed sensor measuring grip directly. It senses rotation; the controller estimates impending lock. Hydraulic pressure may be held, reduced and increased according to controller logic. Wheel speed and car speed are different. ABS can preserve steering on many surfaces but does not guarantee shorter stopping distances everywhere.

Use `production/studio/studio.py inspect` for GLB hierarchy and `studio.py telemetry` for heuristic physical checks if genuine source telemetry exists. Neither is scientific certification. Maintain factual references, uncertainty flags and visual proof notes.
