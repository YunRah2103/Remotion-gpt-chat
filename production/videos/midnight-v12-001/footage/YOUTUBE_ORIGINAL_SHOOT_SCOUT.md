# EXOTIC AFTER DARK — targeted YouTube original-shoot footage acquisition

**2026-10-10 · Agent A branch · A footage gate FAIL.** This addendum supersedes further unrelated Pexels scouting. Video sources below are **entire films of one specific vehicle**, not random stock clips or source fragments.

## Actual execution and source rights QA

Downloaded official **yt-dlp 2026.08.19 ARM64 binary** on the remote inspection runner (40,167,448 bytes; version independently executed). Queried YouTube search directly for original 4K films of Jesko Attack, Aventador SVJ, Apollo IE and Senna GTR; checked original watch-page *licence metadata* and upload descriptions. Attempted actual `yt-dlp --list-formats --skip-download` on highest-ranked creative-commons Jesko film.

**Test source:** https://www.youtube.com/watch?v=PxSSCIdmEZ8

**Actual remote result:** `ERROR: [youtube] PxSSCIdmEZ8: Sign in to confirm you’re not a bot.` This happened **before any formats were returned**, and no file or video SHA can be claimed. Do not bypass sign-in, regional access or other restrictions with other people's cookies. As of this run, original YouTube footage is not available via this cloud IP.

### Source ranking

| Priority | Original-source film | Duration | Reuse evidence | Actual video/4K/11 angles? |
|---|---|---|---|---|
| 1 | [Ricky Blackwell / Developed Films — Jesko Attack USA Delivery](https://www.youtube.com/watch?v=PxSSCIdmEZ8) | 0:48 | **CC Attribution label** on YouTube; description identifies crew and car owner | Not decoded; 4K / angle count unknown |
| 2 | [gchrisfx — Aventador filmed in Austin with A7III](https://www.youtube.com/watch?v=mOSnX0QDdsE) | 2:14 | **CC Attribution label**; description says uploader filmed it with A7III, Mavic, gimbal | Not decoded; 4K / 11 moving angles unknown |
| 3 | [Remnant Media — Jesko Attack 4K](https://www.youtube.com/watch?v=rBPCQQZN2wk) | 2:12 | No CC reuse label observed; **request permission** | Stream resolution unverified |
| 4 | [Fastrmedia — SVJ Night Drive 4K](https://www.youtube.com/watch?v=VNCnUpAmrCo) | 8:40 | No CC reuse label observed; **request permission** | Strong reference look but source inaccessible |
| 5 | [Hartnett Media — Gintani SVJ 4K](https://www.youtube.com/watch?v=fdS1ZQ7WJMk) | 3:45 | No CC reuse label observed; **request permission** | Strong cinematic source unverified |
| 6 | [MF Media — Aventador S Cinematic](https://www.youtube.com/watch?v=6d_zd1EhdiU) | 0:34 | CC Attribution label; description mentions third-party music | May be too short; not decoded |

Watch-page licence label only confirms **declared** reuse terms; confirm filmer ownership of all recorded footage (and remove any soundtrack). Commercial brand identities may have additional usage restrictions, avoid endorsements. Video counts above are durations, not unique angles or verified formats. A raw uploader's **single long film can legitimately contain 11 unique shots** if actual camera views are distinct and the moving car is recognisable, but **you cannot assume that without decoding the film**.

## Local yt-dlp acquisition — without passwords or circumvention

The user has yt-dlp installed. This runs on their **own machine** where their regular internet connection may succeed when cloud YouTube access is blocked:

```bash
yt-dlp --version
yt-dlp --no-playlist -F "https://www.youtube.com/watch?v=PxSSCIdmEZ8"
yt-dlp --no-playlist -F "https://www.youtube.com/watch?v=mOSnX0QDdsE"
```

**Only after personally confirming the uploader permits downloading and adaptation**, first try the existing repo importer, with explicit rights flag:

```bash
python production/footage/yt_dlp_ingest.py fetch \
  --url "https://www.youtube.com/watch?v=PxSSCIdmEZ8" \
  --output out/midnight-v12-001-jesko-original \
  --min-height 2160 --min-fps 24 --max-mb 900 \
  --max-duration 600 --rights-confirmed
```

The importer intentionally downloads only authorised content; **it must fail rather than upscale 1080p**. For native vertical 1920-high uploaded media, adjust the min-height gate to 1920 and independently check width >=1080. Do not use paid authentication bypass or cookie export to evade a protection. Reuse a creator-supplied original download link if provided.

After download: record original SHA256, FFprobe source dimensions/bitrate/fps, 9:16 safe crop composition for **11 true independently filmed camera angles**, independent motion and one-livery continuity. Strip unrelated audio, generate original/middle/end contact sheets per independent shot, preserve original video files outside public git. The original music is separate.

## Hard blocker and concrete relaxations

- **Zero-relaxation route:** Original filmer supplies 11+ real moving, same-car native 4K/crop-safe source angles and grants licence. Cost and delivery time unknown until creator reply. This is the only robust full-Gate-A path.
- **YouTube CC route, conditional:** If one Creative Commons upload decodes as native 4K and has 11 genuinely different moving setups, the full constraint set *may* be achievable with attribution; night **not mandatory** under current revised creative contract. If fewer camera setups exist, explicitly lower shot count to what is actually proven rather than split one angle.
- **Single film cinematic route:** Relax the required 11 *unique moving angles* to say 6–8 true views (not mere repeat cuts); the editing director can still beat-sync 11 **cuts** using deliberate repeated motifs **only with user approval**. This violates the existing no-repeats contract until changed.
- **Premium 4K vertical alternative:** Keep 11 unique angles + same car, allow paid creator stock rights; much more costly than one YouTube film.
- **Cheap archive route:** Allow 1080p landscape upscaling to TikTok portrait, mismatched cars or stationary hero inserts; **not recommended** given user's quality benchmark.
- **Digital recreation:** Relax “real source footage” and explicitly permit physically accurate CGI/game capture of one model; separate creative decision, not a genuine film acquisition.

**NO gate pass** from metadata alone. No verified video bytes, 11 true angles, licence transfer for standard sources, source hashes, or final ZIP were produced in this pass. Agents B/D must remain blocked. The prior legitimate [V2 scout ZIP](https://378e0378-9dfe-48d4-9d9c-73912757403f.sandbox.floot.app/_cdn/static/midnight-v12-001/agent-a-expanded-scout-v2.zip) remains unchanged, is not the new single-car pack, and cannot be promoted to PASS.
