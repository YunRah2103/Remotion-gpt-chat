# Polish 04 native frame evidence / Agent D annotations

**These annotations refer to *genuine* 1080×1920 decoded frames from the source-locked film, not schematic or generated replacement art.** Source E SHA \`21c2b581b46251b0bd45028d32eb40b4341eeb2a\`, full [Polish04 Actions original artifact](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37983072846/artifacts/11641871804); MP4 SHA256 \`fad39a08e151913792da0c827b7c621f511b817b17e4cf4559fdcefa31ae7fbb\`.

The locally generated supplementary photographic contact sheets were prepared from decoded frames with frame labels and simple colored **analyst-added** crop/visibility boxes. Those extra red/amber boxes are annotations, **not present in original video**. The original unmodified frames are in the Actions artifact and can be reproduced from the MP4 with the commands below. This GitHub text file preserves durable, verifiable frame-specific descriptions; no invented screenshot is provided.

| Frame | Time | Visual annotation from extracted 1080 frame | Priority |
|---|---|---|---|
| 48 | 1.600s | Faint ghost car with readable main title; large negative space. | Minor |
| 95 / 98 | 3.167 / 3.267s | Original line-art wheel/rotor and title still visible. | Reference |
| **99 / 100** | **3.300 / 3.333s** | Abrupt dark navy overlay removes actual car/brake, main title still visible; frame 100 starts pad readout on near-empty canvas. | **MAJOR transition** |
| 101 / 105 | 3.367 / 3.500s | Three-quarter rotor/caliper suddenly appear after mask; initial 0.48→1.06 mm readout. | Transition |
| **107** | **3.567s** | Caliper hidden by E cutaway visibility switch, pads remain real A meshes; occlusion change is sudden. | Major pedagogical clarity |
| **117** | **3.900s** | \`2.35 mm\` readout/0.15 mm clearance, rotor right edge **clipped by x=1080 boundary**; opposing two-pad clamping visually ambiguous. Red right-margin annotation in local contact. | **MAJOR crop** |
| **132 / 140 / 145** | **4.400 / 4.667 / 4.833s** | Stationary-pressure macro sustained; visible face/hat dominate, opposite pad isn't independently interpretable. Amber annotation marks area in local contact. | Major teaching |
| **147 / 148** | **4.900 / 4.933s** | Second hard dark overlay removes all brake geometry while still showing tiny text/labels. | **MAJOR transition** |
| 149 / 150 | 4.967 / 5.000s | Normal assembly reappears at new three-quarter angle, abrupt spatial jump. | Major transition consequence |
| 168 | 5.600s | Normal mechanical reveal legible; fixed caliper/rotating rotor. | Pass |
| 305 / 321 / 345 / 365 | 10.167–12.167s | Orange sectors localised to rotor friction track; centre hub unheated; boundaries faceted. | Pass / Minor |
| 395 / 420 | 13.167 / 14.000s | Thermal colour retreats, illustrative disclaimer still present. | Pass |
| 450 / 531 / 629 | 15.000 / 17.700 / 20.967s | Benefits shot hardware all within 1080 canvas; text small, background sparse. | Pass / Minor |
| 630 / 660 | 21.000 / 22.000s | Opening 3/4 hero, clear disc face. | Pass |
| **690 / 705 / 730 / 749** | **23.000–24.967s** | Film changes to actual edge-on 3/4 view, revealing rotor thickness/cooling vanes; not a freeze or stopped render. At frame 749 brake nearly edge-on. | **Hero correction PASS**, thin final profile minor |

## Reproduction from original film

\`\`\`bash
sha256sum carbon-ceramic-001-polish04-candidate.mp4
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,pix_fmt,r_frame_rate,nb_frames -of json carbon-ceramic-001-polish04-candidate.mp4
ffmpeg -hide_banner -nostats -loglevel error -xerror -i carbon-ceramic-001-polish04-candidate.mp4 -map 0:v:0 -f null -
# Example exact native image: frame117 (select by zero-based frame number)
ffmpeg -i carbon-ceramic-001-polish04-candidate.mp4 -vf 'select=eq(n\,117)' -vsync vfr -frames:v 1 frame-117.png
\`\`\`

## Independent full-frame numeric corroboration

Measured by separately decoding both old and new MP4s with OpenCV (resize to 180×320 gray and mean absolute adjacent difference). All 750 frames processed per film.

| Metric | Old | Polish04 |
|---|---:|---:|
| Frames decoded | 750 | 750 |
| 600–749 mean adjacent change | 0.1649 | **0.2526** |
| 630–749 hero mean adjacent change | 0.1294 | **0.2489** |
| 600–749 adjacent pairs under 0.15 | 108 | **25** |
| Whole-film mean brightness under 6 frames | 0 | 0 |
| Dark transition frame pairs present around 99–100 / 147–148 | N/A | **Yes, verified** |

The motion proxy is **not** an automated creative-quality score, and large changes at edits do **not** mean physically impossible motion; actual stills and relevant source code were separately checked. Annotated proof only pertains to the exact source SHA and media above.

**Reviewer limitation:** no tool provided uninterrupted real-time playback. This is independently inspected native frames and full video decode; do not claim real-time viewing when reporting to Master.
