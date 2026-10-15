# YUNEX GT-R R35 / ATTESA E-TS — editor production checkpoint (15 Oct 2026)

## Canonical edit
- Repo: `YunRah2103/Remotion-gpt-chat` only.
- Real-footage composition: `src/yunex/GtrAttesaFilm.tsx`, `GtrAttesaFilm`, 1920×1080 landscape, 30 fps, 825 frames / 27.5 s.
- Three ORIGINAL owner-verified, private Galaxy S25 V4 source media: jobs #97 #98 #99. Nine silent scene extracts from `production/yunex/gtr_r35_attesa/pack_private_clips.py`. Do not reacquire from YouTube.
- The nine source scenes are **technical candidates**, not independently approved shot angles or safe crops. Copyright/reuse rights remain **unverified**. No public video or scene artifact.
- Earlier picture QA run: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38730994442 (started before closing-shot fix).
- Corrected picture run: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38731862269 (queued on commit `4fbcfe3219b179c48df1b0cba0378afb84ea7bbc`).
- Corrected closing scene `C02_99_scene88.mp4` at ~0.84× from 20.64s through 27.50s instead of stopping at 26.44s; this prevents >1s unintended black tail without fabricating a new shot.

## Approved original ChatGPT-supplied audio
- British narrator file `openai-fm-alloy-audio.mp3`, 27.120 s, MP3 mono / 24 kHz.
- Quiet original user-supplied music `Killswitch Lullaby by Flawed Mangoes ... .m4a`, 60 s, AAC / 44.1 kHz.
- Separate local mixed soundtrack `YUNEX_GTR_ATTESA_APPROVED_AUDIO_BED.m4a`, 27.500 s, AAC stereo / 48 kHz, 674538 bytes, SHA256 `5ef359fbcf1a1a834753c5c3d4f166d3c71fbd034c1339e9d0075da67a002117`. Full FFmpeg decode PASS; EBU R128 integrated ~−18.8 LUFS, true peak ~−4.9 dBFS.
- The mixed soundtrack currently exists in its user-visible ChatGPT conversation / working container **only**. Do not falsely claim it is present on the GitHub runner or in the picture draft Release. No substitute or generated narration.

## Secure next steps
1. Wait for corrected **picture** workflow to finish and confirm that `GTR_ATTESA_PICTURE_ONLY.mp4` passed full decode and was stored in a **private GitHub DRAFT Release** under `yunex-gtr-r35-attesa-private-picture-38731862269`. If render fails, diagnose actual logs, repair then rerun.
2. Original user audio MUST be transferred privately (not committed to this public repository). An owner can download the verified `YUNEX_GTR_ATTESA_APPROVED_AUDIO_BED.m4a` from the conversation and attach it to the same draft Release. Avoid public Releases, source commits, and artifacts for unlicensed footage and soundtrack.
3. Run `.github/workflows/yunex-gtr-attesa-final-mux.yml` with the successful picture draft tag and exact audio filename; it privately produces `YUNEX_GTR_ATTESA_MASTER_REVIEW.mp4` with real AAC48 narration/music and verifies full decode, 1920×1080, duration, and loudness.
4. Actually inspect the real picture frames (car consistency, visually attractive cuts, diagram, titles, black gap, sharpness), **not** just FFprobe. Obtain usage permission before publishing.

## Engineering reference
Nissan's own official R35 press kit: https://usa.nissannews.com/en-US/releases/us-2017-nissan-gt-r-press-kit — under normal conditions 0:100 front:rear; up to 50:50 as conditions require. Drivetrain graphic is a conceptual illustration, not live telemetry or exact CAD.

**As of this checkpoint there is NO verified final narrated MP4; never say the film is finished based on completed source downloads, picture render or a standalone audio bed.**
