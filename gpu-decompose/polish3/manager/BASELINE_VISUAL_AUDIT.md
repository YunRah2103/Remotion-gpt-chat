# POLISH 03 — C's independent old-release visual baseline audit
Date: 2026-10-08. Repository: YunRah2103/Remotion-gpt-chat ONLY.

## Immutable baseline evidence
- Original director SHA: `f20d55e493fea7bb5deab6cd8ea7fd9b1860fc5f`.
- Finished old candidate: workflow `37821956618`, artifact `GPU-DECOMPOSITION-FINAL-450F`, numeric artifact `11570565750`. Artifact downloaded and ZIP unpacked.
- Examined real `XFX-SWIFT-RX9060XT-DECONSTRUCTED-15S.mp4`, SHA256 `c08da0aaaa20e99ac95219815d382911de4b63baf480d2400650ff9ca2acb646`.
- Parsed ffprobe: 450 frames, 30/1 fps, H.264, yuv420p, 1080x1920, 15.000 seconds, AAC stereo 48kHz. Full FFmpeg decode PASS. This **does not** equate to artistic PASS.
- Extracted actual decoded frames `0,45,89,120,179,240,329,385,449`. Separately downloaded original native raw Remotion chunk 0 from exact old workflow artifact `11569408516` (`xfx-0.mp4`) and extracted frame zero.

## NEW SEVERE COLOUR REGRESSION FOUND — release assembly fault
The original native Remotion chunk displays the intended charcoal/dark grey backdrop: frame-zero background sampled at `(21,23,29)` RGB, near `#15171d`. The original FINISHED MP4 displays **vivid magenta** across the entire background: frame-zero pixel `(110,0,140)`; all nine inspected final decoded frames show the purple tint. This significantly obscures/changes material colors and dramatically degrades perceived quality. **Do not treat the old release MP4 as an accurate demonstration of B's studio renderer.**

The existing `.github/workflows/gpu-decomposition-release.yml` combines native Remotion render and Manim into final film via
```
[0:v]format=gbrp[base];[1:v]scale=1080:1920:flags=bicubic,format=gbrp[guide];[base][guide]blend=all_mode=screen:shortest=1,format=yuv420p[v]
```
The final mixing/conversion/overlay stage is the clear regression boundary because the native source was correct; *exact triggering filter/color-space component has not been independently isolated*. POLISH 03 **must not reuse that blend filter chain** as an untested assumption. Best default: omit unnecessary full-frame Manim overlay in POLISH 03 and mux the original native Remotion visual directly with clean soundtrack using explicit conventional pixel/range formatting. If an overlay is needed, premultiply real transparent alpha carefully and test visual appearance against original chunk before final render.

## Original aesthetic deficiencies seen directly
- Frames 0/45/89: visible GPU occupies only a narrow horizontal strip around center and leaves huge unused vertical background. Camera largely head-on and too distant.
- Frames 120/179: the fans remain visually part of the shroud or inadequately distinguished; limited staggering.
- Frame 240: still mainly three fans, shroud and broad metal plate; insufficient obvious PCB and fins.
- Frames 329/385/449: physically separated stacks still visually read as thin rectangular nested layers, not rich depth, with car-like wide lateral blank space and low visible internals. Final label is large while physical exploded model remains undersized.
- Clear dark cool materials in raw frame, but underexposed front details.
- Original artifact's Manim marks have no product-education benefit proportionate to risk.

## Required before/after comparisons and release correction
1. Compare POLISH 03 final decoded stills directly against original **raw Remotion chunk** as a color integrity reference and against **original final MP4** as the user saw it. Explain which benchmark used.
2. Assert charcoal studio background colour remains neutral and nonmagenta at known empty pixel(s) in decoded final MP4, and compare sample raw/native vs final for excess colour changes (account for legitimate lighting changes). Treat pink/purple-green global casts as hard failures.
3. Decode and review stages at `0,45,89,120,179,240,329,385,449`, with moving proofs of separation phases; maintain product visibility/3D detail.
4. Do not release or claim substantial improvement based on only stills/coding reports. Require actual native new 450-frame MP4 and creative comparison.

**Agent C assessment:** OLD RELEASE TECHNICAL PASS / OLD RELEASE CREATIVE FAIL. Baseline audited; new video not yet produced as of this report.
