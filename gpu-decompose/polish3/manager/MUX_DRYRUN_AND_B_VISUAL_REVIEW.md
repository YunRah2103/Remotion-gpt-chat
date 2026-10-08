# GPU POLISH 03 — Independent manager dry-run of corrected final FFmpeg mux
Date: 2026-10-08. This is a **pipeline smoke test using OLD baseline native video chunks**, NOT a new POLISH 03 film.

## Exact source material
Old release run 37821956618; downloaded all five native 90-frame chunk artifacts:
- part 0 ID 11569408516;
- part 1 ID 11570466735;
- part 2 ID 11569846843;
- part 3 ID 11570366245;
- part 4 ID 11569518415.
Source film composition = 450 frames, 1080×1920/30fps. Old released final MP4 SHA256 `c08da0aaaa20e99ac95219815d382911de4b63baf480d2400650ff9ca2acb646`.

## Executed tests
1. Unpacked all five authentic native parts and assembled contiguous `visual-450.mp4` using concat copy, without an image replacement.
2. Ran two source-audio lavfi generators: low 65Hz mechanical tone plus controlled filtered pink noise; mixed and encoded stereo AAC 48kHz.
3. Re-encoded native chunks + audio with standard H.264 yuv420p/limited-colour MP4. Specifically **did not run the original Manim screen blend `format=gbrp;blend=all_mode=screen`**.
4. Encountered and corrected FFmpeg `afade` duration parsing: must use `d=0.6` and `d=0.8`, not `d=.6` or `d=.8`. Patched the newly published manager CI accordingly.
5. Whole corrected dry-run MP4 decoded error-free under `ffmpeg -v error -xerror -i ... -f null -`; ffprobe checks returned one H264/yuv420p 1080×1920 30fps 450-frame video and one 48kHz stereo AAC track; exactly 15.000 seconds.
6. Compared **pixel RGB (x=10,y=10)** from native raw chunk vs dry-run vs existing old released film:
   - Native raw Remotion first frame: `(21,23,29)` (intended graphite).
   - Corrected dry run: `(20,23,30)` (essentially colour-preserved).
   - OLD released MP4: `(111,0,140)` (severe magenta conversion).
7. Corrected dry-run file SHA256: `8dfddb3cd922408223756db2167c4c6ddeb8ca841d5a5adffaf58fea838644fc`.

## Conclusion
**STUDIO COLOUR FIX: PIPELINE DRY-RUN PASS.** New manager release workflow now embeds the exact RGB comparison + magenta regression rejection as a mandatory gate. This proves the corrected **mux path**, not new model, creative result, Blender geometry or full new native 3D rendering. No final POLISH 03 release/quality claims are made.

## B native baseline cinematic proof assessment
Agent B proof run `37831165543`, artifact `11573222917` was downloaded. All three real proof clips (`108-139`, `232-247`, `368-399`) completely decoded. The 9 native stills are properly graphite rather than purple, with brighter legible fans and new stage typography; however, the real card still occupies a modest horizontal/vertical share of tall portrait frame. B proof intentionally uses the **OLD** model and motion, so flat stacked final layers/fan overlap remain provisional and cannot be signed as final. After new A GLB is integrated C will rerender and re-evaluate all requested frames. B's native proof is useful as a **camera/colour baseline pass**, not complete creative approval.
