# YUNEX TURBO → INDYCAR 001 — locked footage contract

**GitHub issue:** https://github.com/YunRah2103/Remotion-gpt-chat/issues/37
**Repo:** `YunRah2103/Remotion-gpt-chat`. Do not access or modify `YunRah2103/yunus-video-lab`.
**Contract branch:** `automotive-edits/turbo-indy-reality-001/footage-contract`.

## Idea
Start with the **real 2013 DreamWorks Turbo film's** oval-track animated racing. Build a surprising coherent visual transformation into **real camera-filmed IndyCar / Indianapolis 500** racing. This is not a basic crossfade or unrelated montage. Match turn banking, track perspective, screen direction, vehicle velocity, camera movement, subject screen location and light. Later editor will develop a 16s short around the best feasible seamless changeover. No generic glitch transition. No invented CGI IndyCar shots disguised as real.

User reference: uploaded `193814.mp4` (16.266667s, 1024x576 video). Its key transition at roughly 5.9s moves from real NASCAR tire smoke to animated McQueen in dust. Reference is a **creative pacing example**, not a source of IndyCar footage and not permission to reuse its visuals. No worker should claim they watched it unless they have that file.

## Audio lock
Use the **exact audio from user's reference**, not a similar song, recreated sound, or music from another project.
Audio was bit-for-bit remuxed without re-encoding into `YUNEX_Turbo_Reference_Original_Audio.m4a`, AAC 44.1kHz stereo, **16.045011s**, SHA256 `ce988e2cffe6cd3c9b6c95626a6417a4fe63842848eee18cd2d4d842f1fa8c78`.
Original source video SHA256 `f47c383beb3a429f7056af476d22863f86eb0746fc84b965f0c97240c4634dad`.
**Neither binary is currently on GitHub.** Audio is available from the initiating user's ChatGPT thread; in a later editing chat, request its actual .m4a attachment. Do not hallucinate it exists on GitHub or attempt to recreate it. Four agents are doing **footage only**, not the mix or edit. Note that audio ends ~0.22 seconds before last visual frame of the reference.

## Roles / non-overlap
- A: actual Turbo movie/trailer animated oval footage: 3–6 excellent distinct usable short shots and key perspective frames.
- B: actual **real IndyCar** direct match transition shots from low / side / rear-follow banked oval cameras: 4–8 candidate moving shots, prioritise matching A's banking and direction.
- C: actual real IndyCar race action: 8–12 distinct high-quality moving angles showing racing packs, overtakes, close passes, circuit scale, Indianapolis 500. No generic stock-car NASCAR footage.
- D: actual real IndyCar cinematic details: 6–10 diverse onboard, wheel, pit-work, start/grid, low mounted and dramatic cameras that complement C (no repeated feed clips).

## Acquisition and QA
1. Actually acquire full clips using legal, openly accessible direct MP4/MOV/CDN sources, manufacturer/team press pages, established sources; social video only if verifiably obtainable. YouTube is useful for discovery but notoriously blocks GitHub Actions downloads: don't loop endlessly. Do not bypass logins, DRM, technical access controls, or rights restrictions.
2. Inspect *decoded frames* and actual moving footage. Source should be genuinely 1080p/4K native (landscape or portrait); evaluate active picture area, baked letterboxing, compression, framing and real subject identity. NEVER pass upscaled 720p as native 1080p. If a crucial non-1080p scene is all that can be found, flag for user decision without pretending it passed.
3. Preserve scene motion, ideally cuts with useful 1–4 second moments; maintain source context where possible. Trim only where helpful. Don't fake a moving clip from stills or reuse identical camera angles.
4. Document `source_url`, title/uploader, actual dimensions, active picture dimensions where relevant, fps, codec, SHA256, timecodes, angle, direction of travel, clip quality and known reuse restrictions. Publicly accessible is **not** necessarily licensed for reuse.
5. Deliver a **real downloadable GitHub Actions artifact ZIP** containing actual playable video bytes, per-shot contact sheets and the manifest. Link the successful run and artifact (ID/name) to issue #37. A file list or documentation-only commit is not completion.
6. Agent branches are independent. Commit actual scripts + manifest + QA documentation; media binaries belong in artifacts, not in normal Git. If unable to obtain acceptable sources, state true blocker and alternatives, not imaginary success.
7. Prioritize the handful of exceptional transition-compatible shots over bulk. Do not begin editing, create new worker chats, or overwrite other projects.

**Initial project status:** four ChatGPT footage agents have NOT been auto-launched; project begins only when user opens the four chats. No clips are verified by this setup.
