# YUNEX HDR10 Night Drive — Galaxy S25 preview

The user-facing rendered file is **YUNEX_HDR10_NIGHT_DRIVE_S25_TEST.mp4**, delivered in ChatGPT; it is **not** in GitHub. This branch contains the FFmpeg reproducible HDR10 mastering/verification method. Main and other car projects are unchanged.

## Important distinction
**The delivered film is a true 10-bit PQ HDR10 video bitstream**, not an 8-bit MP4 with only HDR flags. It originates from the user's prior **SDR** YUNEX night-car edit, however. FFmpeg transforms its BT.709 SDR into higher-precision scene-linear values, applies intentional highlight reinterpretation, then encodes BT.2020/PQ HDR10. This **cannot restore camera-clipped reflections or native HDR dynamic range**. For the true next step, use source footage actually recorded as PQ, HLG, or 10-bit log, then process with a camera-aware HDR grade, retaining the full original highlight information.

Remotion builds/edit plans may be reused, but direct HDR final mastering should happen in a high-bit-depth pipeline. Remotion HDR limitation: https://www.remotion.dev/docs/hdr .

## Run
Requires FFmpeg with libx265, zscale, lutrgb, gblur and ffprobe. The original user video 193667.mp4 is SDR BT709 at 1920×3412 and contains a 1920×1080 widescreen film frame at crop x=0 y=1166. Supply the original file separately:

    bash production/videos/yunex-hdr10-night-drive-001/render_hdr10.sh 193667.mp4 YUNEX_HDR10_NIGHT_DRIVE_S25_TEST.mp4 10.533333 1920:1080:0:1166 1080:1920

The video displays the hero film on a dark, motion-matched blurred background. Don't apply this **SDR-specific** filter to HDR source video.

## Verify
    ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,profile,width,height,pix_fmt,color_primaries,color_transfer,color_space -of default=noprint_wrappers=1 YUNEX_HDR10_NIGHT_DRIVE_S25_TEST.mp4
    ffprobe -v error -select_streams v:0 -show_frames -read_intervals '%+#1' -show_entries frame=side_data_list -of json YUNEX_HDR10_NIGHT_DRIVE_S25_TEST.mp4
    ffmpeg -v error -xerror -i YUNEX_HDR10_NIGHT_DRIVE_S25_TEST.mp4 -f null -

Expected HEVC Main 10, yuv420p10le, 1080×1920, bt2020 primaries, SMPTE2084 PQ transfer, bt2020nc matrix and Mastering Display / Content Light Level static SEI. Metadata alone is insufficient to establish the footage was natively HDR captured: consult input/QA.

## Samsung Galaxy S25 test
Download the MP4 onto the phone and play it **locally in Samsung Gallery** to avoid SDR-tone-mapped in-app previews. Compare against original SDR video. UI button dimming might happen with HDR playback but is not a conclusive proof; encoded transfer characteristics and actual picture code values are independent evidence. Device brightness may change with ambient conditions/settings.

## Source limitations
The exact soundtrack is from the original edit; no new engine audio or separately sourced HDR car footage in this proof. Some source frames use deep blacks and brief intentional fade near the end. Some clips are landscape letterbox reframed into portrait with dark blurred surround; this is not a full portrait-native video capture.
