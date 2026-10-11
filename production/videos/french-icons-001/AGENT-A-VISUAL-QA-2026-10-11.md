# FR Legends Agent A — independent decoded visual QA (2026-10-11)

## Verified evidence

- Run: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38147473826
- Media artifact: **11705423108**, `fr-legends-a-classics-real-media-zip`, 461,072,061 bytes, 7-day retention (until 18 Oct).
- Source implementation SHA: `820a18f236d60a94f132109855dd6cd0bb1cbd14`.
- ZIP internal SHA256 in job logs: `0c9df48556d7a4975973f7c2f6b9521f8152c35a12a6d6479fc169a6bad145dd`.
- Four real original video files were downloaded; 4 MP4 7-second samples were actually FFprobe-decoded at true 1080p or 4K. These are **technical** passes, not visual/model approval.
- Actual review: manually inspected **five decoded frames from each EXACT 1–8s delivered MP4**, plus five frames across each original source for context. The three rejected source files still sit in the existing ZIP as nonapproved leads.

## Candidate-by-candidate visual gate

| Clip | Technical | Camera/identity observed in delivered 7-second clip | Editor usable? |
|---|---|---|---|
| `citroen-2cv-convoy-2022.mp4` | 3840×2160 at 29.97 fps | **Clearly real Citroën 2CVs actually moving** through sharp full-bleed 4K roadside footage; multiple cars but **one fixed camera angle**. Clean of burned-in labels, genuine motion. Original OSeveno CC BY-SA 4.0, attribution and share-alike must be respected. | **ONE fallback/pass** technically and identity-wise, but weak cinematic hero coverage. |
| `citroen-2cv-meeting-2025.mp4` | 1920×1080 at 30 fps | First seconds wide roadway shot with burned-in `Postojna - SLO` text; other sections show entry sign/event, with little foreground 2CV action. | **REJECT selected clip**: graphic overlay, weak/not car-hero. Distinct source exists but sample not accepted. |
| `alpine-a110-1973-on-track.mp4` | 1920×1080 at 30 fps | Entire selected 1–8s clip is **empty winding road**, no car; original longer source does show an authentic classic 1973 Alpine rally car around a later time, BUT has **baked-in black cinematic bars** and sometimes black/logo frames. GionnoTV reused source rights not verified. | **REJECT selected clip**: no car in delivered segment, letterboxing, rights unresolved. Do not treat original as a full-bleed 1080p clip. |
| `citroen-ds-oldtimer-2024.mp4` | 1920×1080 at 29.97 fps | Selected first seconds are a **small light-blue Fiat 500/600-looking vintage car**, not a Citroën DS; static at museum exhibition. Although the overall source advertises Citroën DS, wrong cut. | **REJECT selected clip**: wrong car and no driving. |

### Honest Gate A

- **Acquired**: 4 genuine source videos / 4 native-HD MP4 samples, real SHA256 and FFmpeg screenshots.
- **Identity + motion + full-bleed verified usable**: **1** Citroën 2CV roadside camera angle (fallback-tier cinematography).
- **Cinematic hero shots verified**: **0**.
- **Distinct source models verified from ACCEPTED CLIPS**: **1**.
- **Contract requires**: 18 genuinely unique, high-quality, visually approved moving angles covering ≥5 assigned classic models.
- **Gate A: BLOCKED.** Neither GitHub Actions success nor playable files equal creative shot approval.
- **Important:** The existing Actions ZIP is a candidate/evidence pack, **not** an editor-ready approved 18-clip handoff. Only `citroen-2cv-convoy-2022.mp4` is temporarily fit as supporting footage. Rights and film-credit requirements apply.

## Next genuine sourcing priorities

High-quality footage of **original Renault 5 Turbo/Turbo2**, **205 GTI / T16**, **Peugeot 306 Maxi**, **Renault Clio V6**, and **original 1960s/70s Alpine A110**. Prioritize direct full-quality publisher files or authorized creator delivery. Do not fill with modern 5 Turbo 3E, Divine DS concept, static-photo parallax, 720p upscales, or edited watermarked reels. Inspect the exact selected in/out before packaging.

No creative editing or music work has been performed. Agent A branch only.
