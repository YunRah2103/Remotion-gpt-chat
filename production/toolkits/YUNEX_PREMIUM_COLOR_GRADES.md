# YUNEX — Premium Automotive Colour Grades

Eight **original, production-ready 3D LUT colour grades**, available as standard 33×33×33 .cube files and through a verified FFmpeg grading pipeline.

## The looks

| Preset | Name | Recommended footage |
| --- | --- | --- |
| emerald-noir | **Emerald Noir** | Deep green Aston Martin DB12, premium paint reflections, moody roads |
| monaco-gold | **Monaco Gold** | Golden-hour luxury and beautiful coastal tracking shots |
| arctic-silver | **Arctic Silver** | Silver McLaren P1, white Porsche GT3 RS, architectural backgrounds |
| midnight-cobalt | **Midnight Cobalt** | Rain, tunnels, blue-hour night driving, cooler metallic highlights |
| track-attack | **Track Attack** | Aggressive GT3, RS6, McLaren, NASCAR edits and fast track motion |
| heritage-film | **Heritage Film** | Old cars, classic film mood, automotive nostalgia |
| sunset-rose | **Sunset Rose** | Romantic sunrise, sunset and warm coastal footage |
| studio-clean | **Studio Clean** | Technical explainers, clean car colour and consistent film-wide grade |

These are intentionally restrained automotive looks. They alter film contrast, shadow / midtone / highlight tints and colour response. **No AI recolouring, warped bodywork, fake reflections or film footage replacements.**

## Fast-start commands

- **List available filters:** python production/toolkits/yunex_color_grades.py list
- **Export all eight real .cube LUT files:** python production/toolkits/yunex_color_grades.py export --preset all --size 33 --output-dir out/YUNEX-LOOKS
- **Compare all looks using the same actual source frame:** python production/toolkits/yunex_color_grades.py preview --video original.mp4 --preset all --strength 0.75 --output-dir out/YUNEX-PREVIEWS
- **Render a real graded MP4 with untouched original encoded audio:** python production/toolkits/yunex_color_grades.py apply --video original.mp4 --preset emerald-noir --strength 0.75 --output out/emerald-noir.mp4

Only preview/contact sheets require Pillow. LUT creation and grading require Python standard library + FFmpeg/FFprobe.

Source-MP4 render uses a full-quality 33-point LUT, adjustable 0..1 blend strength, H.264 video encoding, existing resolution/timing, encoded source audio stream copy, full video decode verification and before/after file SHA256 evidence. It never overwrites the original footage or the user-supplied music, and records a .grade.json report. The original soundtrack is **not automatically added** when the source video doesn't contain one.

A lower strength (0.55–0.80) usually protects paint and highlights better than extreme full-strength looks. Apply matching exposure/white balance corrections to the shots BEFORE grading. Check continuity across every angle.

## GitHub Actions — downloadable LUTs and source-specific grades

Open [YUNEX Cinematic Colour Grades — 8 LUTs + real video QA](../../.github/workflows/yunex-color-grades.yml). On every successful test run, download the **YUNEX-8-CINEMATIC-33-CUBE-LUTS** artifact. This artifact contains eight importable LUT files with checksums. No extra paid tools or presets required.

Manual dispatch:
- **pack:** creates eight LUTs without media.
- **preview:** enter the original GitHub Actions run ID + exact media artifact name containing ONE MP4/MOV, choose all or one look, choose 0..1 strength. Download the source-matched comparison image.
- **apply:** enter that same media artifact, one named look and strength; download the graded playable MP4, metadata and SHA256/QA report.

The workflow does NOT fetch files from private S25 V4 draft Releases directly. Reuse the existing verified YUNEX V4 import action inside your editor workflow to recover those original source media first. Avoid re-downloading or re-uploading source clips.

## Safety and aesthetic standards

1. These are **SDR display-referred LUTs**. They are **NOT** suitable as direct colour transforms for HDR PQ/HLG, Log or BT.2020 wide-gamut footage. The script rejects detected HDR / wide gamut rather than silently crushing contrast or washing out paint.
2. Compare **original LEFT** vs **graded RIGHT** on the same car source frame. Then visually inspect the full-length original-quality moving MP4 for wheel edges, grille shadows, sky banding, badge clarity, highlight clipping and accurate paint colour.
3. Choose grade **per sequence**, not a random preset on every cut. For bright educational diagrams use Studio Clean; for real green DB12 use Emerald Noir, for silver P1 use Arctic Silver, for track driving start with Track Attack.
4. Do not recolour approved edits automatically, touch the Galaxy S25 V4 worker, introduce unnecessary dependencies or replace the original supplied soundtrack.
5. Car footage and music must still be rights-cleared for publication. The LUTs are original to YUNEX; they do not grant permission to use third-party videos.
6. A passing LUT/video codec test proves technical operation, **not** that the filter improves every source. An editor must compare the actual visuals and listen to the entire finished film.

**Source:** [YUNEX colour grading script](yunex_color_grades.py) · [Real-media unit tests](../tests/test_yunex_color_grades.py) · [GitHub Actions workflow](../../.github/workflows/yunex-color-grades.yml).

**Technical reference:** https://ffmpeg.org/ffmpeg-filters.html (lut3d, blend). .cube files are a standard interchange format; check the specific editor's 3D LUT import support before claiming native compatibility.
