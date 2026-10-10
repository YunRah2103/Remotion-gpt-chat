# Agent A — BMW M5 G90 footage handoff (BLOCKED)

**Real code/research source commit:** `2da1f31683fdc02bc2993d0b34da7e9cd8080ef5`  
**Owner branch:** `automotive-edits/bmw-m5-g90-001/a-footage`  
**Agent B:** `automotive-edits/bmw-m5-g90-001/b-editor-master`

## What I implemented

I reviewed the project contract, the full 39-beat map and earlier Pexels moving-car collage workflow. I committed six production assets in `footage/`: five-source rights research catalogue, 39-slot frame-accurate editorial shot concepts, empty approved media manifest, executable FFprobe/FFmpeg frame-motion audit, six tests, and instructions. All cuts exactly cover 600 frames at 30 fps. Every planned camera angle is unique, but **the 39 concepts are not falsely described as filmed selections**.

### Native checks actually run

- `python3 -m unittest -v test_audit.py` → **6 tests passed**: 39 beats/600f, gap rejection, F90 rejection, repeated shot rejection, rights gate, FFprobe and native FFmpeg decoded-motion checks (moving test pattern versus static black). **Test patterns are not film assets.**
- `python3 audit.py --plan shot-plan.json --sources approved.json --mode plan` → **PASS** (39/600, 0 real selections).
- `python3 audit.py --plan shot-plan.json --sources approved.json --mode ready --media-dir /tmp/empty --proof-dir /tmp/g90-proof` → **FAIL as required**: `No approved sources`.
- I did not claim 1080x1920 G90 master footage, real car contact sheets, a real moving G90 source checksum, or a workflow media artifact. None exists from this handoff.

## Best identified genuine G90 driving asset — licence not granted

**BMW Group PressClub, footage PF0009730, scene #3** is explicitly catalogued as **2025 BMW M5 G90 Sedan**, with **6 minutes 30 seconds of driving footage** (car-to-car, aerial/drone, FPV, fly-by and slo-mo), listed in low/high resolution. Source: https://www.press.bmwgroup.com/global/tv-footage/detail/PF0009730/the-new-bmw-m5 . BMW's stated terms do **not** grant blanket permission to redistribute public TikTok edits: https://mediapool.bmwgroup.com/download/edown/common/info?actEvent=mediaRights . This is a **research lead, not a ready-to-edit clip**. A second BMW official Munich launch listing, an editorial paid Pond5 M5 (generation unverified), and unverified Pexels/Pixabay search pages are catalogued in `research.json` with reasons none is approved.

## Exact Agent B action

Do **not** integrate a placeholder as licensed G90 footage. Obtain actual high-quality moving **G90 sedan** files whose owners/terms authorise an edited public TikTok; preferably diverse shots from the BMW Group scene if permission is expressly granted. Record source URLs, rights evidence, attribution, actual original-file SHA256, human model verification, timecodes, crop and speed, populate `approved.json` + 39 actual non-overlapping `shot-plan.json` assignments. Run `audit.py --mode ready`, inspect its resulting 39 stills plus the motion footage, then render your final master only after rights + musical audio are cleared. No F90/G99/M4 substitutes; audio pack stays private.

**Blocked reason:** zero available, approved, observed real moving G90 clips, and thus **0/39 final actual selections**.
