# Agent A — Official RS6 footage source audit
Date: 2026-10-12
Status: SOURCE IDENTIFIED; **NO CLIPS ACQUIRED OR RIGHTS-CLEARED**.

## Source 1 — Audi RS 6 Avant performance, Mythos Black metallic
- Official 2023 Audi press footage: https://audi-mediacenter.pl/film,48075,footage:-audi-rs-6-avant-performance-mythos-black-metallic-.html
- Listed downloadable MP4: 69.45 MB (site listing, NOT verified downloaded bytes)
- Vehicle identity: C8 RS 6 Avant performance, Mythos Black metallic (title); individual shot quality and driving motion unverified.
- Publisher states: "Wykorzystanie: bezpłatnie, wyłącznie dla celów dziennikarskich" = free use exclusively for journalistic purposes.
- **Not approved for YUNEX promotional/social reuse or public redistribution. Do not mirror to GitHub Actions/public Releases without permission.**
- FFprobe: NOT RUN. SHA256: NOT AVAILABLE. Contact sheet: NOT AVAILABLE.
- Acquisition attempt in this execution environment: direct host DNS resolution failed. No source bytes were retrieved.

## Source 2 — Audi RS 6 (until 2025), Daytona Grey footage on location
- https://www.audi.com/en/videos/video/audi-rs-6-until-2025-daytona-grey-footage-on-location-4874
- Audi official page; needs video endpoint verification and reuse permission.
- File not downloaded; specs, codec, quality, shot motion and duration unverified.

## Source 3 — Audi RS 6 Avant performance, Dew Silver Matt footage on location
- https://www.audi.com/en/videos/video/audi-rs-6-avant-performance-dew-silver-matt-footage-on-location-6557
- Audi official page; needs original-video endpoint verification and reuse permission.
- File not downloaded; specs, codec, quality, shot motion and duration unverified.

## Blocker and next action
Audi MediaCenter explicitly prohibits promotional reuse of its media; rights permission must be obtained before public video-bearing artifact/release distribution. GitHub S25 V4 worker is not a bypass; its source registry contains only pre-approved sources, not these RS6 URLs, and requires an owner-operated Termux worker. No phone job queued. This is an honest source-audit handoff, **not** footage delivery. Agent F must NOT count these candidates as verified clips.

Once permission exists: secure direct authorized MP4, download to an appropriate permitted execution environment, full-decode, ffprobe, three-frame-per-shot contact sheet, active-frame crop review, source SHA256 and per-shot 1–5 second motion ranking; deliver only under the permission's conditions.

## Retry 2 — 12 Oct 2026
- Re-fetched Audi Polish official page via web browsing; page MP4 link does not expose a direct file in extracted HTML (click resolves back to page).
- Independently retried HTTPS via Python requests in container: DNS resolution error for `audi-mediacenter.pl` before HTTP response.
- Discovered Auditography 2026 C8 RS6 performance film (original creator): https://www.youtube.com/watch?v=8l9D4aS0IIs (published 5 Jan 2026). Strong original lead, but publisher rights and download unverified.
- Secondary original manufacturer-associated source: RaceChip 2020/2021 C8 RS6 filming: https://press.racechip.co.uk/2020_audi-rs6-avant/ (film link embedded; download unverified).
- No playable video acquired. No source MP4 SHA/FFprobe/contact sheets can honestly be provided.

## Verified source download (second execution environment, 12 Oct 2026)
- Original official website extracted playable `<video><source src>`: `https://audi-mediacenter.pl/data/filmy/48075/o/7405893_content_1280x720_play.mp4`.
- HTTP byte-range probe: `206 Partial Content`, type `video/mp4`, server total `72,820,901` bytes. First bytes valid ISO BMFF ftyp (isom/iso2/avc1/mp41).
- Whole file transferred successfully via HTTPS to transient isolated compute (`/tmp/audi_rs6_official_preview.mp4`), `72,820,901` bytes exactly, SHA256 `b3b69741e3d60d6bc680cd870b558975a77734cb95ddaf4cfc9a0d79c69a513b`.
- MP4 atoms `ftyp`, `moov` and `mdat` detected. **This confirms downloaded MP4 bytes, not full playback validation.** ffprobe/decoded moving-frame visual QA unavailable in that transient environment (ffmpeg/ffprobe executables absent). Source URI labels 1280x720 preview; no verified original-resolution claim.
- Licensing: Audi press page says journalistic uses only. **Do not copy file into public GitHub releases or republish as a cleared YUNEX clip without Audi's permission.**
- This first technical download is **not an Actions ZIP or completed Agent A handoff.** Original source link is playable remotely; transient VM file not persisted in ChatGPT artifact store.

## Independent MP4 stream metadata (MP4Box parser, 2026-10-12)
- Byte count 72,820,901; SHA256 `b3b69741e3d60d6bc680cd870b558975a77734cb95ddaf4cfc9a0d79c69a513b`.
- Container duration **639.042 seconds** (10m39.042s).
- H.264 AVC High `avc1.64001e`, actual **620x348** coded video display, **25fps**, 15,975 video samples. This contradicts filename suffix `1280x720_play`. **REJECT as quality source** for YUNEX native 1080x1920 edit.
- Audio AAC-LC `mp4a.40.2`, 44.1kHz stereo.
- Runtime could not install FFmpeg due to VM container privilege restrictions; codec frames not fully decoded/visually ranked. Structural MP4Box parser ready.
- DO NOT present source as final 720p or 1080p; cannot infer native quality from website, file name, or byte size.

## Further official-source discovery
- Audi MediaCenter model catalogue: https://audi-mediacenter.pl/modele,audi-a6,audi-rs-6-avant.html . Additional RS6 C8 entries listed, notably original early C8 RS6 00:00:47 short promo, on-location Daytona Grey and Tango Red under 20-year RS6 catalogue. These sources are NOT download/quality-verified and should be checked for an actual high-definition master.
- Audi press collection: https://www.audi-mediacenter.pl/modele,audi-a6,audi-20-lat-audi-rs-6.html lists Daytona Grey 10:34 and Tango Red 9:38 on-location footage but also contains other generations, so isolate C8 only.
- 2024 RS6 GT footage found but **intentionally excluded**: contract disallows GT without manager exception.
- Status remains **one true source MP4 obtained at 620x348 and rejected on fidelity; zero production-usable delivered clips**.
