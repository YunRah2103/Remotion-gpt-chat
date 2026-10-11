# GPT-6 — AGENT A: MULTI-CAR GT3 Footage Acquisition Director

This is not a single Mercedes-AMG car video! Acquire real **multi-manufacturer GT3 endurance racing** footage.

Repo: `YunRah2103/Remotion-gpt-chat`
Own branch: `automotive-edits/gt3-nurburgring-multicar-001/a-footage`
Contract: `automotive-edits/gt3-nurburgring-multicar-001/contract` at `production/videos/gt3-nurburgring-multicar-001/PRODUCTION_CONTRACT.md`, plus `FOOTAGE_DISCOVERY.md`. Read both completely.
Manager D tracks via the new production issue. Do not modify other projects or `YunRah2103/yunus-video-lab`.

### Non-negotiable requirements
- Download **30–40 distinct moving shots** (24+ usable gate) across **6+ REAL GT3 car makes**; diverse angles, scenes, long-lens pans, dusk/night, pack racing, onboard, trackside, flybys, pit/action. Strongest footage first, 4K preferred, source decoded resolution at least 1920x1080 for landscape or 1080x1920 if a portrait original. Never silently accept 720p as 1080p; no repeated camera footage disguised as different shots.
- **High-priority direct MP4** from team/manufacturer/race organisations: test `curl -L --fail`, `wget`, correct original CDN resolution. Then use reusable repo `production/footage/yt_dlp_ingest.py` / `yt-dlp` for accessible YouTube or other video sites. TikTok/Instagram permitted where technical access works; avoid hours wasted on blocked authentication. Dailymotion only if TRUE source is >=1080p and clean. Pexels/Pixabay are secondary, never substitute generic street cars for real GT3 race cars.
- Don't get stuck on platform blocking. Two failed attempts -> pick another original source. No synthetic placeholder frame tests presented as real footage.
- Racecars may include Porsche 911 GT3 R, BMW M4 GT3, Mercedes-AMG GT3, Lamborghini Huracán GT3 EVO2, Ferrari 296 GT3, Audi R8 LMS GT3, Aston Martin Vantage GT3, McLaren 720S GT3 EVO. Verify specific competition car per shot (manufacturer-specific wings and liveries), not merely metadata tags.
- Preserve original media quality. The primary edit is **full-bleed 16:9 1920x1080**; both native landscape and portrait sources accepted, but portrait sources must allow natural landscape cropping or reserve for optional vertical alternate. No blackletterbox/pillarbox, stretched cars or obvious watermarks.
- Preserve source video if possible; only trim/remux by stream copy until final selection. Probe with FFprobe, make low-res review contact sheet separately from originals, hash originals and detect duplicate viewpoints.
- Record complete actual manifest. Release *ONE* ZIP downloadable in GitHub Actions named `GT3-MULTICAR-FOOTAGE-30PLUS`: real files, JSON manifest, source URLs, scene boundaries, model ID, native resolutions, camera/crop notes, contact sheets; include a `README.md` describing independent clip count and source count.
- Commit real supporting code/manifest to your own branch; evidence posted to tracking issue: source SHA, action run, artifact ID/link, real shot count, multi-make breakdown and PASS/BLOCKED; DO NOT claim PASS with no downloadable clips or only file names.
- Rights/source metadata may be recorded, but **prioritize practical retrieval and file-quality QA** over endless discussion of licenses and API credentials.

If after a reasonable diverse search fewer than 24 good angles exist, deliver usable verified assets and mark Gate A BLOCKED with precise missing makes/angles.
