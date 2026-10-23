# EP005 / AGENT 6 — FINAL SOURCE-LOCKED FOUR-ANGLE VIDEO HANDOFF

**State:** FINAL AGENT6 **TECHNICAL** VIDEO HANDOFF, not final episode picture approval. **NO MERGE.** PR #270 / Issue #265.  
**Kit car appearance:** approved exact V4-A ancestor `9052a539e10a7cb97487c1435455bb9962ad58e1`, teal `#18636b`. **Do not alter the approved car body, cabin, lamps, exhaust geometry, silhouette or roof.**  
**All four footage MP4s (same source):** `be336eb56ecb07512960c32025bf74431fe07269`. Latest branch HEAD is NOT equivalent to this render commit.  
**GitHub Actions:** [run #39945510296](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39945510296) — **all 4 matrix jobs success**, actual independently downloaded original MP4s, SHA256 verified, native FFprobe, all-120-frame full FFmpeg decode, distinct 6-frame samples and visual contact QA.

| Native MP4 (file inside each artifact ZIP) | Artifact ID / link | Exact MP4 SHA256 | Use |
|---|---|---|---|
| `native/front-pursuit.mp4` | [12497764620](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39945510296/artifacts/12497764620) | `2ae4f1cf137886cbe431728ae794b4005cc23841a536eec5711b80efbefd4933` | Front pursuit |
| `native/side-tracking.mp4` | [12497239435](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39945510296/artifacts/12497239435) | `9d9a5d52d16f6846e173b25f4b33f83e067581dbe5cfaf7f239f4a81718fdbd4` | Moving side |
| `native/rear-proof.mp4` | [12497384207](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39945510296/artifacts/12497384207) | `ff257c49bcc40b8ef7c4c41951ed834d228d3e4817c24f42727a31d364687ca7` | Rear three-quarter; **exact 120 f for editor master f555–674** |
| `native/rear-chase.mp4` | [12498811977](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39945510296/artifacts/12498811977) | `010b02c6277ec56bfdb5178fb89b5b52daf2780f8a9b2c89a58d0bf8ac9c6340` | Low rear chase, flame source |

**Every file:** H.264/yuv420p, 1080×1920 portrait, 30 fps, exactly 120 frames = 4.000s, silent. The car actually translates over 100 metres in the 120-frame source and wheels rotate; footage is not a scrolling background. Both rear shots show factory V4 exhaust outlets.

## Immutable V4-v2 per-frame port ABI from THIS run

Each **same-source** artifact ZIP contains identical copies of:

- `ports/v4-exhaust-ports.json`: `v4-2`, numeric schema **2**, SHA256 **`b595d83fefe30e57be2ccd2a7973d3f4745051f81e8d757e6c019b5bfbdd6391`**
- `ports/v4-ports-120frames.json`: SHA256 **`fcf7358ad42d428cc81fd028abe1ee150df31cbc77f15f82c1f59f5f330ec34f`**
- `ports/agent7-world-ports-120frames.json`: SHA256 **`0447e7e3f0e0157381790f9d172c4c5d6719eb79711f97eff0109a9457383afe`**
- `ports/agent7-v4-port-lock.json`: SHA256 **`cf66828fbbe640c4b0f6d7574ee7a6e9a08b3b1248013b6b68edf0859b51a261`**, explicit `agent6ShotCommit=be336eb...`.
- `ports/SHA256S.json`: SHA256 **`beead74b346fe4de04331d69f5df71536451a3cd3cd6f95fddcff17f45e96308`**

Port nodes `exhaust-outlet-left` and `exhaust-outlet-right`; physically recessed factory 112mm OD / 104mm bore, radius 52mm. Vehicle +X forward, +Y up, +Z left; native nozzle local +Z transforms to approximately world -X. Records are sampled **per absolute frame 0–119 at 30fps** with both `worldOrigin`, normalized `worldOutward`, 16-number `matrixWorld`, timestamp, vehicle speed, and all four exact matched moving-camera routes. For Agent7 use `adaptApprovedV4WorldPorts(frame.ports, frame, lock, 30)` **with the lock from the SAME ZIP**. Never use fixed screen locations, old Spectral/Khronos v1 ports or another render commit's transforms.

**Important:** Agent7 earlier checked-in source-port file SHA `d8ab9e92341fe1786ffc81cedd592c7ccfb23a35997b71d48a841f4baa3581e4` is **NOT identical** to this export's `b595d83f...` artifact-file digest. Different file bytes/contracts must not be misrepresented as the same source lock; Agent7 must explicitly map/repin.

## Creative and downstream status

Independent full native image sampling sees a fully readable unmodified teal silhouette in all four, real road movement, and no side-bumper cut-off. The stage remains visibly simple and car occupies a relatively modest region of the tall frame, so these are **selected usable technical sources / editor picture review**; they do not assert owner approved driving aesthetics or a completed cinematic master.

**Agent8:** canonical owner Cedar VO 25.560s means full film **767 frames @30fps**; put `rear-proof.mp4` at **f555–674**; take other shots as selects, not loops. Await the genuinely reframed full 45f flame hook, 92f ending, improved science (Agent7). Do not reuse old 750-frame trim of narration.  
**Agent7:** animate afterfire on true measured live ports, clip producer `be336eb...` and V4-v2 lock above, and ensure fully visible flame inside portrait boundaries. `#268` may have older port source pinned; deliberately repin with matching source and report new render hashes.

**No merges**, no redesign, no unnecessary additional car sourcing. Owner car design approval is distinct from full movie picture lock.