# YUNEX — LÉGENDES FRANÇAISES 001: footage-first contract

**Project label:** FR Legends
**Date:** 2026-10-11
**NOW: two footage workers only, not five active agents.** Do not start editor, sound, render or manager agents until the user requests it.

## Creative intent
A 60-second premium cinematic film celebrating memorable French automotive icons, paced to the user's exact French-language track `sir..  [7623017441160891681].m4a`, which is in the initiating ChatGPT conversation, not GitHub. Final editor may switch cars at the ends of key sung/spoken words and phrases. **Footage workers must obtain broad visual coverage only; no film editing, word segmentation, or music replacement now.** Pair poetic nostalgia and heritage with aggressive performance and hypercar action.

## Division of work
- **Agent A — Classics:** classic Citroën DS and 2CV; Renault 5 Turbo/Turbo 2; Peugeot 205 GTI and 205 T16 rally; Renault Clio V6; Peugeot 306 Maxi; original Alpine A110. Classic French cars, hot hatches and rally legends.
- **Agent B — Modern:** modern Alpine A110 / A110 R; Renault Mégane RS/Trophy-R; Peugeot RCZ R; Peugeot 208 T16 Pikes Peak; Peugeot 9X8; Bugatti Veyron, Chiron, Bolide; other qualifying French modern icons with real moving footage.
- No duplicate model responsibility except Alpine A110, clearly distinguished *original classic* versus *modern*.
- **Each worker target:** 25–30 genuinely distinct real moving shot angles, **at least 18 usable** across at least 5 assigned car models. The two workers together aim for 50–60 source shots. Reject near-duplicate shots even if cut to different times. Balance models: do not deliver mostly Bugatti or mostly Peugeot.
- High cinematography: rolling, tracking, track/rally, low angle, front/side/rear, engine/bodywork details, unusual perspectives, night, golden-hour when authentic and achievable. Prefer clean original camera footage without baked-in edits or graphic overlays.

## Required native quality (strict)
- **1080p MIN, 4K MAX**: Full landscape originals 1920x1080 to 3840x2160; full vertical originals 1080x1920 to 2160x3840. 1440p is fine. Never consider 720p upscaled to 1080p as true 1080p.
- Full-bleed landscape or full-bleed vertical source; no black letterbox, pillarbox or small video in large frame; no aspect stretching.
- Actual FFprobe resolution, frames, duration, codec and bitrate. Decode/scrub candidate clips; examine real sharpness, focus, watermark and compression. Authentic model identification, not tags alone.
- Preserve original files/quality; minimum re-encodes. Reject artificial still-image pans. Record visible model, source and creator. If historic originals lack 1080p, prioritise modern professionally shot real classic cars rather than upscaling old archival footage.
- Match engine audio when original source includes it; keep audio on originals and note availability for future sound design.

## Practical source acquisition channels (ordered)
1. **Direct MP4/CDN URLs** from actual manufacturer, creator, team or archive sites: use `curl -fL`, `wget` and inspect bytes/streams.
2. **yt-dlp** on unobstructed publicly accessible downloadable sources where it works.
3. **GitHub Actions artifacts WORK as packaging/transport**: upload one real ZIP per agent and report actual Actions run, artifact ID and link.
4. **YouTube DOES NOT WORK RELIABLY** from our past GitHub environment despite yt-dlp installation and passing synthetic tests. Do not build the plan around YouTube, repeat failed login/cookie loops, or claim the downloader is dependable.
5. **TikTok/Instagram are hit-or-miss** with yt-dlp; pivot quickly if blocked, verify full-quality and clean clips.
6. **Dailymotion can be downloaded but quality can be poor**; use only genuinely decoded 1080p+ files, never a low-quality substitute.
7. Existing footage finder may identify candidates, but do not spend hours troubleshooting Pexels/Pixabay or their API secrets. Seek original quality from accessible publisher files.
Use footage you can legitimately access and record permission/source terms where known. Do not bypass access controls. Do not spend hours on generic copyright discussion instead of sourcing files.

## Deliverables per agent
- ONE downloadable GitHub Actions ZIP with `clips/`, `manifest.json`, `manifest.csv`, `contact_sheets/`, and an honest `README.md`; avoid checking large binaries into git history.
- Every clip: real SHA256, source URL, owner/creator, filename, accurate French make/model/variant, year/generation, original/restomod, unique scene/angle, decoded width/height/fps/bitrate/duration, exact usable source in/out, crop notes, landscape/vertical flag, engine-original-audio flag, provenance/usage notes, QA/duplicate notes.
- Source SHA of committed acquisition work, precise Actions artifact ID/download path and expiry. Show decoded contact sheet so visuals can be reviewed before accepting anything.
- Gate PASS requires >=18 actual technically/visually usable and distinct moving shots across >=5 assigned French models in real downloadable ZIP. Partial files should be delivered with honest BLOCKED/PARTIAL status rather than a false success.
- No blind copying of another worker's clips. No silent car substitutions, no YouTube-only lists with nothing downloadable, no bad upscales.

## Ownership and chat naming
**Agent A chat title desired:** `FR Legends | Agent A — Classics`.
**Agent B chat title desired:** `FR Legends | Agent B — Modern`.
Put your desired chat title on the **first line of your starting message** to encourage ChatGPT auto-titling. Chat title might still need manual rename; the assistants cannot guarantee a chat title change.
Work ONLY in `YunRah2103/Remotion-gpt-chat`. Never change `YunRah2103/yunus-video-lab`. No agents self-start merely because branches exist.
