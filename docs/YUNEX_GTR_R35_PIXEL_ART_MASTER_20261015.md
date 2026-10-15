# YUNEX — GT-R R35 ATTESA E-TS — 3D pixel documentary

## Output and provenance

- Source: `src/yunex/AttesaVoxelFilm.tsx`, entry `src/yunex/attesa-index.tsx`.
- Pure deterministic Three.js / React Three Fiber / Remotion model and torque-pulse animation; no generic still slideshow.
- Master workflow: `.github/workflows/yunex-gtr-attesae-native-master.yml`.
- The workflow renders genuine moving frames from the Remotion composition through software WebGL at **360x640** and then uses nearest-neighbor scaling to deliver sharp **1080x1920, 30fps** output, exactly **814 frames / 27.133 seconds**.
- Native source is stylized engineering illustration, not GT-R CAD or an OEM drivetrain schematic.
- Torque bias is representative and illustrative, with the technical extrema from Nissan: normal rear drive 0:100, adaptable up to front:rear 50:50; not a claim every traction event uses maximum split.

## Narration integrity

The owner provided the **27.12-second** original voiceover named `openai-fm-alloy-audio.mp3` in the conversation. Its SHA-256 fingerprint:

`a80f64e19c131a08d38ddbd6111a928141a1e4e4c17fc4f96f89c50a1dc93991`

This personal source audio is deliberately **not uploaded to the public repository** or replaced by synthetic speech. The Actions artifact is a visuals-only Remotion master. To mux the **exact** supplied voiceover locally after downloading the MP4 artifact:

```bash
ffmpeg -hide_banner -y -i YUNEX-GTR-ATTESA-REMOTION-PIXEL-VISUAL.mp4 \
  -i openai-fm-alloy-audio.mp3 \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -t 27.1333 -movflags +faststart YUNEX-GTR-ATTESA-REMOTION-PIXEL-FINAL.mp4
ffmpeg -v error -xerror -i YUNEX-GTR-ATTESA-REMOTION-PIXEL-FINAL.mp4 -f null -
```

Alternatively, to preview inside the Remotion editor without exporting narration, put the voiceover at `public/gtr-attesa/voiceover.mp3` and set `withVoiceover:true`. Do not commit or publish the original voice track without the owner's approval.

## QA

The companion short native 3D proof is GitHub Actions run [38730617469](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38730617469), PASSED with four 24-frame genuine moving WebGL clips and screenshots. The expanded full-master workflow independently validates four complete frame chunks, stitches, full-decodes, checks dimensions/frame rate/count, and saves stills and a SHA256 proof. Re-review the final actual stills before claiming visual approval.
