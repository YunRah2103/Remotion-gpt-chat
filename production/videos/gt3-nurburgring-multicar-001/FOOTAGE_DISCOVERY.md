# Acquisition strategy — GT3 multi-car original assets

**Target**: 30–40 genuine shots, no duplicate angles, 1920x1080 or 4K native originals. A "downloadable link" is not proof of media. SHA + FFprobe + sampled decoded frames required.

### Prioritised acquisition routes
1. **Real MP4 URLs (best)**: original approved team/manufacturer/race publisher-hosted .mp4 or CDN, fetch with `curl -L --fail --retry 2` or `wget` and confirm content type, bytes and ffprobe. Check for 4K renditions first, then actual 1080p. Never download webpage HTML as if video.
2. **Race organisation/team media video & official embedded videos**: 24h Nürburgring, Nürburgring Langstrecken-Serie (NLS), ADAC GT Masters, GT World Challenge Europe / 24 Hours of Spa, BMW M Motorsport, Porsche Motorsport, Mercedes-AMG Customer Racing, Lamborghini Squadra Corse, Ferrari Races, Aston Martin Racing, Audi Sport customer racing, McLaren Motorsport. Search official downloadable media libraries and genuine original source files.
3. **yt-dlp** on publicly accessible videos with a genuine direct stream; best video at >=1080p; FFMPEG mux as needed; don't repeatedly retry blocked sources or claim a synthetic test demonstrates live YouTube success. Inspect each download with ffprobe and contact sheets.
4. **TikTok/Instagram**, useful for native vertical, often blocked: try legitimate standard extract once/twice if usable. Never spend the whole project fighting login/cookies; pivot.
5. **Dailymotion**, possible fallback if source has authentic >=1080p; reject 720p or highly compressed output, regardless of nominal labels.
6. **Existing repository footage finder**: can search Pexels/Pixabay but rare GT3 identity and full-resolution video are unproven; do NOT go into long API/secret troubleshooting. Find original race material first.
7. **GitHub Actions** is a VALID large-media transport: stream download + ffprobe QA on runner; upload one `GT3-MULTICAR-FOOTAGE-30PLUS` ZIP artifact; report actual Actions run link, artifact ID, SHA and expiry; Manager C/D obtain archive and visually verify. Do NOT commit large original media into Git history.
8. If sources prohibit ordinary direct fetch, seek authorised export or alternate public original; avoid "download works" claims until bytes exist.

### Web-verified lead pages (not file acquisition proof)
- ADAC 24h Nürburgring official YouTube onboard #17 Mercedes: https://www.youtube.com/watch?v=6H-rKAzI3vc ; #14: https://www.youtube.com/watch?v=9EIuC_v_lQg
- BMW M Motorsport Nürburgring official onboards and broadcast: https://www.bmw-m.com/en/topics/magazine-article-pool/live-stream-nurburgring-24h.html
- Porsche race report/official content: https://racing.porsche.com/articles/nurburgring-2025
- Porsche Newsroom video media guide: https://pnr-prd2-pub2.newsroom.porsche.com/en/motorsports/media-guide.html
- Mercedes-AMG Customer Racing https://www.mercedes-amg.com/en/customer-racing
- 24h Nürburgring event official broadcaster youtube channel: https://www.youtube.com/@24hnurburgring
- GT World Challenge https://www.youtube.com/@GTWorld

**Coverage balance**: Porsche 911 GT3 R, BMW M4 GT3, Mercedes-AMG GT3, Lamborghini Huracán GT3 EVO2, Ferrari 296 GT3, Audi R8 LMS GT3, Aston Martin Vantage GT3 and McLaren 720S GT3. Minimum 6 makes with source model verified from physical livery/metadata; avoid using 911 GT3 Cup, street Mercedes AMG GT, trackday hypercars as substitute GT3 racecars. Offer 8 makes if there is actual footage.

### Acceptance protocol
Manifest per shot: clip_id, marque + GT3 model, exact source URL and rights/usage metadata, original filename, sha256, native resolution + fps + bitrate, camera angle description, in/out, visible model/identity evidence, contact-sheet file, duplicate analysis, whether real nat-audio engine sound is usable, 16:9 crop status, certainty. Validate byte integrity, ffmpeg decode, stream presence. Remove watermarks by choosing clean permitted originals, not by obscuring meaningful footage. Audio naturally sourced from the car on screen where possible.

No footage package or 30-shot claim can PASS if composed by repeating clips or downloading 720p sources and upscaling.
