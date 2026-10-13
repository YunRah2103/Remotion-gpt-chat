# Agent A2 — technical media delivery audit (13 Oct 2026)

## Verified original UHD (not a publicly redistributable clip)
- **Manufacturer / model:** AUDI AG, real C8 Audi RS 6 Avant (Daytona Grey, until 2025), original on-location press footage.
- **Canonical page:** https://www.audi.com/en/videos/video/audi-rs-6-until-2025-daytona-grey-footage-on-location-4874
- **Original rendition:** https://delivery-p123922-e1240369.adobeaemcloud.com/adobe/assets/urn:aaid:aem:99e86001-9bce-465b-b3ea-af573f2f3c0a/renditions/video_2160p.mp4/as/audi-rs-6-until-2025-daytona-grey-footage-on-location_2160p.mp4?accept-experimental=1
- **Verified HTTP:** 206 Partial Content, `bytes 0-127/788872228`, MP4 `ftyp` header.
- **Verified FFprobe:** `3840x2160`, `25/1 fps`; *actual native UHD* not upscaled low-resolution footage.
- **Independent video acquisition:** FFmpeg requested `-ss 3 -t 1.5`, obtained a real H.264 temporary MP4 of **3,719,801 bytes**, SHA256 and full-decode exit 0 as shown in audit JSON. The actual test media existed and was decoded on the GitHub Actions runner; it was removed afterwards because no redistribution grant exists.
- **Automation run:** https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38358533050
- **Auditable evidence ZIP:** https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38358533050/artifacts/11794257104
- **Studio crop advantage:** UHD gives enough spatial pixels for reframing; specific cinematography, C8 front/side visibility and 9:16 active crop remain pending *frame-level* QA.
- **Rights:** Audi press/editorial footage; commercial YUNEX remix and GitHub re-upload rights not confirmed. **Do not publish 4K source excerpts, thumbnails or derived media without explicit permission.**

## Rejected first preview (for dedupe)
Manufacturer Mythos Black footage page https://audi-mediacenter.pl/film,48075,footage:-audi-rs-6-avant-performance-mythos-black-metallic-.html exposed a downloadable H.264/AAC, `620x348`, 25fps / 639.018s, SHA256 `b3b69741e3d60d6bc680cd870b558975a77734cb95ddaf4cfc9a0d79c69a513b`. Actual MP4 fully decoded on runner, **reject** for native 1080p gate. Audit https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38358145764/artifacts/11793737371.

## Premium night alternative
Creator-source rights review at https://github.com/YunRah2103/Remotion-gpt-chat/issues/49 — Niterun `The Night Ship`, self-described Zürich C8 RS6 original; preliminary review windows `00:20-00:32`, `00:55-01:07`. No reuse grant or V4 phone job yet.

**A2 editor handoff status:** technically verified UHD exists and 1.5s acquired/decoded temporarily, but **zero approved/redistributable media-bearing artifacts**. Await permission and visual shot QA, not another low-res preview.