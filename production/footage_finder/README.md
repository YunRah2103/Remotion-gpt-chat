# Automotive Footage Finder — one GitHub Actions run

Find permitted car footage, download quality-verified candidate originals, and receive **one ZIP** with videos, contact sheets and a detailed report. No separate agents required.

## First setup (required for live API searches)

Both official footage search APIs require API keys.

1. Request a [Pexels API key](https://www.pexels.com/api/) and/or a [Pixabay API key](https://pixabay.com/api/docs/).
2. Go to repository **Settings → Secrets and variables → Actions → New repository secret**. Set the secret named **PEXELS_API_KEY** for Pexels, and optionally **PIXABAY_API_KEY** for Pixabay. Never put these values in a public commit or chat.
3. Open **Actions → Automotive Footage Finder - Search and Package → Run workflow** on the GitHub repository. The workflow must be merged onto default branch main before GitHub shows this manual-run interface.
4. Search e.g. **Koenigsegg Jesko Attack cinematic driving**. Select provider, tick **Download**, and confirm you have permission to use the footage after checking applicable source licences. Choose 3, 6, 9 or 12 maximum candidate downloads.
5. Open the Actions run → **Artifacts → automotive-footage-finder-results**. Inside is **automotive-footage-finder.zip** (GitHub may package the ZIP inside a second artifact ZIP). It contains the source MP4s, visual contact sheets, a detailed JSON manifest and an HTML review page. Retention: **3 days**.

One provider key is enough if you choose that provider in the workflow. Without either key the workflow writes a diagnostic report and fails clearly with **CONFIGURATION_REQUIRED**, not a false success.

## What gets checked

- Search results are queried from the current [Pexels video API](https://www.pexels.com/api/documentation/) and [Pixabay video API](https://pixabay.com/api/docs/). Best downloadable source quality is selected by *actual video-file rendition dimensions*, not a thumbnail.
- **True 9:16 crop pixels**: a 1920x1080 landscape file offers only about 608x1080 from a center vertical crop. A 3840x2160 original offers 1215x2160; this is acceptable. If a source cannot meet 1080x1920 without upscaling, it is flagged/rejected.
- Native **FFprobe** determines video resolution, frame rate, codec, duration, bytes and SHA-256; **FFmpeg** removes original stock audio using video stream copy (no unnecessary video transcode).
- Real source **contact sheets** show actual sampled frames and LEFT/CENTER/RIGHT crop possibilities. These are manual framing choices, *not an AI claim that the car is detected*.
- [PySceneDetect](https://github.com/Breakthrough/PySceneDetect) finds potential shot boundaries in video. Temporal differences and perceptual frame hashes flag suspiciously static or possibly duplicate sources. **None of this can certify unique camera angles or exact car model.**

## Honest statuses

| Code | Meaning |
|---|---|
| CONFIGURATION_REQUIRED | Required provider API keys absent |
| NO_MATCHES_OR_PROVIDER_ERROR | Provider returned no valid search candidates, or API failed |
| PERMISSION_CONFIRMATION_REQUIRED | Download disabled until user confirms permissions |
| REJECTED_LOW_VERTICAL_RESOLUTION | Best available rendition is too small for a genuine sharp vertical crop |
| REJECTED_ACTUAL_VERTICAL_RESOLUTION | Real FFprobe dimensions fall short |
| REJECTED_TOO_SHORT_OR_LOW_FPS | Actual clip too short or below 23fps |
| POSSIBLE_DUPLICATE_REQUIRES_REVIEW | Similar source frames detected; manually inspect |
| POSSIBLE_STATIC_REQUIRES_REVIEW | Little change between sampled real frames |
| TECHNICAL_PASS_MANUAL_IDENTITY_REVIEW | Technically usable video; **vehicle model and source permissions still need review** |
| PARTIAL_SOURCES_MORE_REQUIRED | Some clips downloaded but not enough for your film |

The manifest deliberately reports **zero approved same-vehicle shots** until a person verifies car identity, framing, camera-angle diversity and permission. Successful CI is NOT an actual 11-shot source approval.

## How this relates to your existing yt-dlp

Your existing YouTube importer remains installed under the separate production/footage folder. Its installation and synthetic test passed, but YouTube access from GitHub cloud runners has *not* been proven working. This finder uses the Pexels/Pixabay APIs instead and does **not** promise to circumvent YouTube restrictions. It supplies a YouTube **research-only search link** for sources that are not in stock catalogs.

A rare Koenigsegg or Apollo may have **no matching footage** in free stock catalogs. The report should tell you that rather than substitute an unrelated car or falsely declare that the footage is ready. Producer-provided footage or licensed specialized catalogs may be needed.

Pexels and Pixabay have their own terms for footage, brands and endorsements. Each selected result includes the original source page and creator for review. Do not use GitHub public artifacts as secret/private archives, and never upload the user's TikTok MP3 into public Git.

## Local use

Requires Python 3.12 and FFmpeg.

Install: python -m pip install -r production/footage_finder/requirements.txt

Set your API keys as environment variables named PEXELS_API_KEY / PIXABAY_API_KEY, then run:

python production/footage_finder/finder.py --query "Koenigsegg Jesko Attack cinematic driving" --providers both --download --rights-confirmed --max-clips 6

Search-only: omit --download. ZIP output: out/automotive-footage-finder.zip.

Run completely offline regression tests:

python -m unittest discover -s production/tests -p test_automotive_footage_finder.py -v

Tests include API mocks and real native synthetic FFmpeg video, crop/frame-sample analysis, source fingerprint and ZIP security checks. No provider credentials or copyrighted video required in CI.
