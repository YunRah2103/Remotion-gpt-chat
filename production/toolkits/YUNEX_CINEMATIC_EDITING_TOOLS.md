# YUNEX Cinematic Editing Toolkit — GitHub Download Pack

Prepared 15 October 2026 for **YUNEX cinematic automotive edits**, especially 1080×1920 / 30 fps Remotion projects.

**Status:** This is an optional, external-tool download bundle. It does **not** replace Remotion, the existing editor, footage, music, or the S25 V4 worker. New editing agents should pick a tool only when it improves a specific shot or sound cue. No HUD spam, preset roulette, over-sharpened paint, fake engine noises, or frame interpolation on already-smooth footage.

The [toolkit download workflow](../../.github/workflows/yunex-cinematic-toolkit-download.yml) fetches pinned external releases / shallow official GitHub source checkouts and creates a downloadable **GitHub Actions artifact**. All third-party licences remain in their source folders. The toolkit is **not** silently installed on the owner's Samsung S25.

## The six selected projects

| Tool | Source | Why YUNEX benefits | Bundle form and limits |
|---|---|---|---|
| **PySceneDetect** | [Breakthrough/PySceneDetect](https://github.com/Breakthrough/PySceneDetect) (BSD-3-Clause) | Detect individual shots in long automotive reels, output timecodes/contact sheets and stop agents reusing the same angle | Python headless wheel **v0.7.2** + sparse upstream source. CPU friendly; quality decisions remain human/agent-reviewed. |
| **Beat This!** | [CPJKU/beat_this](https://github.com/CPJKU/beat_this) (MIT) | Deep-learning beat/downbeat timestamps for precise music-sync editing | Sparse upstream Python source. Needs PyTorch, external checkpoint download and dependencies; **not installed in bundle**. Use `small0` model (~8 MB) for fast probes or `final0` (~78 MB) for accuracy. |
| **auto-editor** | [WyattBlue/auto-editor](https://github.com/WyattBlue/auto-editor) (Unlicense source) | Automatically identify active-motion footage and trim dead segments **as a candidate shortlist**, not as the finished edit | Official **31.7.2** Linux x86_64 and Windows x86_64 release executables; separate platforms. Never feed it the final soundtrack and let it indiscriminately cut creative pauses. |
| **GL Transitions** | [gl-transitions/gl-transitions](https://github.com/gl-transitions/gl-transitions) (licensing varies by shader; inspect headers/LICENSE) | Parameterised GLSL transitions that can be studied/adapted for creative match-cut / light / speed transitions | Sparse upstream **GLSL shader collection**, not a standalone editor. Needs a GLSL/WebGL transition runtime; shaders are not drop-in Remotion components. |
| **RIFE Vulkan** | [nihui/rife-ncnn-vulkan](https://github.com/nihui/rife-ncnn-vulkan) (MIT) | Optical-flow frame interpolation to rescue selected high-speed rolling/driving shots for clean slow motion | Source snapshot + **rife-v4.6 model (~10 MB)** only; to run, build with Vulkan/ncnn or obtain official portable GPU executable separately (~412 MB). Cannot run on a standard CPU-only Actions runner. Do not pretend the source snapshot itself is a working executable. |
| **Real-ESRGAN Vulkan** | [xinntao/Real-ESRGAN-ncnn-vulkan](https://github.com/xinntao/Real-ESRGAN-ncnn-vulkan) (inspect bundled license) | Repair a genuinely low-resolution or compressed isolated shot when absolutely necessary | Official **v0.2.0** Linux and Windows portable executables (models included). Vulkan GPU required. AI reconstruction can invent badges, grilles, paint or details; **never upscale approved high-resolution footage by default**. |

## Quick agent operations (after downloading/unpacking)

**Shot discovery — PySceneDetect:**

```bash
python -m pip install Tools/PySceneDetect/scenedetect_headless-0.7.2-py3-none-any.whl
scenedetect -i incoming_rs6.mp4 detect-adaptive list-scenes -o qa/
scenedetect -i incoming_rs6.mp4 detect-adaptive save-images -o qa/
```

Detect cuts, inspect real thumbnails, rank only shots containing the **correct car** and cinematic moving compositions. Preserve verified timecodes.

**Music/downbeat timing — Beat This!:**

```bash
# Install Python+PyTorch according to platform before use; initial weights download is required.
python -m pip install beat-this
beat_this supplied_music.mp3 --model small0 -o beat_times.beats
```

Do not assume detected beats dictate every cut. Use key accents and phrase boundaries, then refine by watching and listening. Include the generated timestamps with the final Remotion edit plan.

**Dead-shot candidates — auto-editor (GitHub Actions Linux x86_64):**

```bash
chmod +x Tools/auto-editor/auto-editor-linux-x86_64
Tools/auto-editor/auto-editor-linux-x86_64 footage.mp4 --edit motion:threshold=0.02 --export clip-sequence
```

Manually verify anything it proposes removing: a still hero/car detail shot can be a deliberate cinematic beat.

**GLSL transitions:** The files under `Tools/gl-transitions/transitions/` are **reference shaders**. A qualified editor must integrate with a supported WebGL/GLSL renderer and visual-QA the resulting frames. Prefer carefully crafted match-cut, natural blur or light continuity; don't use random effects between every clip.

**RIFE slow motion:** For **selected shots only**, use official RIFE executable with Vulkan on a GPU PC. Render an actual native clip and inspect for wobbly wheels, ghosting, deformed badges and drifting reflections. The 10 MB model included in the pack is **not** a complete runnable binary.

**Real-ESRGAN restoration:** Optional for particularly poor-resolution frames, never a substitute for good source footage. Compare restored and original 100% crops to ensure geometry and car identity are intact.

## Quality contract for every agent

1. The car and correct model identity remain unmistakable. Don't fabricate/repaint geometry or replace approved footage.
2. First detect **strong candidate timecodes**, then prove actual motion and camera framing, then assemble footage.
3. Beat analysis is an editing aid, not an excuse to make every cut on a metronome.
4. Use RIFE/ESRGAN only where their improvement is plainly visible after visual QA; preserve native resolution whenever possible.
5. Preserve supplied soundtrack, original music timing and appropriate credible engine sounds. Verify full audio/video decode and the actual finished MP4.
6. Confirm permission for any redistributable third-party footage and comply with each upstream code/shader licence. Code licences do not grant rights to automotive footage or music.
7. Downloading **source** is not the same as installing a usable application. Report exactly which executables passed smoke checks and which sources still require dependencies/GPU.

## Download process

The GitHub Actions job bundles `Tools/` and `CHECKSUMS.sha256`, plus a machine-readable manifest containing actual Git commit hashes and release versions. It deliberately avoids 400–800 MB RIFE GPU executable downloads, PyTorch wheels and pretrained Beat This checkpoint downloads. Agents may request them later if hardware and exact use are justified.

**Repo installation:** No files here are automatically installed into Termux, Windows or the production renderer. Keep all trials isolated from existing YUNEX edit source/working footage. To use Windows binaries, extract the official Windows files locally. To use Linux binaries, use a matching Linux x86_64 runtime.

**Security:** Release executables are third-party software; do not execute them on the phone. Check checksums and licences, and test within a disposable isolated build environment before relying on them.
