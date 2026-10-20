# Agent 2 — Contact-driven physics (illustrative, deterministic)

The public integration exports are sampleDynamics(tSec,params),
sampleSkidContacts(tSec,motion,skids), and
sampleSparkParticles(tSec,motion,contacts,skids?,params?).

All distances are metres, +X forward / +Y up / +Z car-left. Agent 1
owns actual metal skid meshes and getSkidDescriptors(); do not copy the
fixture's 1.05/0.065/0 contact point into production. Always call with
Agent 1's DESCRIPTORS AND BOTH ACTIVE AND INACTIVE CONTACT STATES.

Physics model: world-kit track route sample and heading; absolute-time
62 m/s illustrative longitudinal travel; v-squared clamped aero proxy;
road-height-proportional chassis suspension compression; mild pitched
grade response, bounded curvature roll; no CFD or FIA ride-height claim.
Chassis origin Y = common sampled road centre height + heave.
A fixed world-forward skid sample is projected onto the closest nearby
world-kit centreline tangent and reads the SAME shared/track.ts height
function Agent 4 is required to use to make the road.

Particle births: global 100 Hz deterministic ticks, uniformly hashed by
skid ID and tick; each historical birth recomputes contact at its true
absolute time. Only sliding metal skids with gap <= 0 emit. Births do not
use editorial onset times, random(), exhaust, or animate a pool based on
previous frames. Particle world velocity retains positive road-space
momentum while falling BEHIND the faster car, with gravity, drag and a
small bounded road collision glint. Population max 260, lifetime < .78s.
At no-contact time, old sparks may briefly remain but NO NEW births
occur. The historical emitter is passed exact descriptors, not inferred
from the moving current contact when the optional skids arg is provided.

Review gate: Agent 1 descriptor geometrically confirms metal underside
lowest point at 0.065m nominal reference; Agent 4 mesh matches
sampleTrackSurface with lateral-constant approximation; native Remotion
previews and actual frame inspection are required BEFORE approval. Do not
declare review ready on algorithmic tests alone.
