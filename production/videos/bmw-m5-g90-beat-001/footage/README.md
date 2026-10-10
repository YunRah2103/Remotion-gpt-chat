# Agent A — BMW M5 G90 footage research / editor handoff

**Status: BLOCKED for actual picture editing.** This branch contains real research, a frame-exact 39-beat *editorial target* map, and a runnable rights+video quality gate. It does **not** contain 39 sourced G90 shot segments. Every shot entry has null source/times so nobody can accidentally render invented footage.

## Research

- Best clearly identified candidate: BMW Group PressClub \`PF0009730\`, **scene #3**, “The new BMW M5. Driving Shots”, tagged **G90/Sedan**, described as 6 min 30 sec of driving car-to-car/drone/FPV/fly-by/slo-mo material. Downloadable press availability is **not** permission to re-edit it for a public TikTok. Written consent or a qualified applicable licence is needed.
- BMW Group PressClub Munich 2024 on-location G90 moving media is a second conditional candidate.
- Pond5 #309455215 is a paid $39 editorial **BMW M5** rolling shot, but its **G90 identity was not verified** and purchase/usage terms have not been cleared.
- Pexels and Pixabay search pages are *not model evidence*. None of their BMW search results was verified as a specifically licensed moving **G90 sedan** source here.
- The previous collage's BMW footage is explicitly labelled **M4**, and was rejected.

Sources/links and license status are recorded in \`research.json\`. \`approved.json\` intentionally stays empty.

## Mapping, files & test commands

\`shot-plan.json\` covers all 600 consecutive frames: exactly 39 slots with **distinct desired camera motions**. This is a concept-only allocation until actual downloaded clips, real source in/out seconds, and human model proof exist.

\`\`\`bash
cd production/videos/bmw-m5-g90-beat-001/footage
python3 audit.py --plan shot-plan.json --sources approved.json --mode plan
python3 -m unittest -v test_audit.py
# After licensing, actual source downloads, verified frames and source manifest:
python3 audit.py --plan shot-plan.json --sources approved.json \
  --mode ready --media-dir /secure/path/to/real-g90-videos --proof-dir /tmp/g90-proof-stills
\`\`\`

The \`ready\` audit must reject the current materials. In a future licensed handoff, all 39 slots require sourceId, inSeconds/outSeconds, speed and crop. Each \`approved.json\` source requires: id, localFilename, vehicle="BMW M5 G90 sedan", sourceUrl, creator, licenseName, licenseTermsUrl, permissionStatus="approved", rightsEvidence, requiredCredit, identityReviewer, identityEvidence and verified sha256. The script probes actual media (duration/dimensions/fps), decodes low-res frame sequences for motion, checks no overlapping excerpts from a source, and writes a still for each of 39 assignments. Its motion check is a mechanical anti-still test, **not automatic visual vehicle identification**; a human must confirm the full G90 saloon in every shot.

**No original G90 clip downloaded, probed, viewed frame by frame or hashed** during this research pass. ffprobe and decoded-frame tests passed for *synthetic test fixtures only* (not film footage); no G90 visuals or approved rights can be claimed.

## Agent B: integration contract

Do not treat this as \`READY\`, do not use the old collage's M4, an F90 M5, or a G99 Touring. Do not replace slots with zooming still photographs. Obtain permission + the BMW G90 source pack from the user or authorised distributor, then perform real candidate clip analysis and fill in 39 non-overlapping moving selections. Keep video binary in restricted local storage/Actions artifacts, not Git. The user's music upload is not here and redistribution rights are also unverified. Only then run \`--mode ready\`, create contact sheet/artifact and integrate into the 600-frame film.

## Required missing items

1. At least one (preferably 12–20 diverse) genuinely moving BMW M5 G90 sedan source clip(s) licensed for an edited public TikTok.
2. Evidence of creator, rights, attribution and allowed redistribution; SHA256 of downloaded originals.
3. Real per-slot source in/out/crop/speed selections and visual model-verification evidence.
4. Human verification of 39 distinct moving shots, contact sheets, and output video QC.
