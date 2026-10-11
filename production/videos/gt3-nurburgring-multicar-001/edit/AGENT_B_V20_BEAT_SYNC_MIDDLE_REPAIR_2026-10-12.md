# Agent B V20 — actual middle-of-film beat sync correction

**Status:** Real MP4 rendered, full decode QA PASS, visual contact sheet inspected. Delivered via this ChatGPT conversation, not uploaded as a GitHub Actions artifact; **user's editorial approval pending**.

## User correction
User instructed to stop attempting audio repairs and fix the clips looking strange at the beginning of the middle. Preserve music, opening, pit service and finale.

## Exact physical output and technical verification

- Full rendered movie: `YUNEX_GT3_V20_CLEAN_MIDDLE_BEAT_SYNC_1080P.mp4`.
- **SHA256** `c623ff50b128ef1005dc7ed2e8e80f31e7b24587c3cd7b395a91e93adc10f137`, **26,739,242 bytes**.
- Format: genuine H.264 `1920×1080`, `30fps`, **466 frames**, **15.5333s**, stereo AAC 48k.
- Original picture base: previously approved **Agent B V11** `YUNEX_GT3_MULTICAR_AGENT_B_V11_BEAT_SYNC_1080P.mp4` (no rebuild from an older Agent C audio mix).
- **Audio**: original current V18 music-patch soundtrack copied from `YUNEX_GT3_V18_3TO6_NOISE_REMOVED_MUSIC_PATCH_1080P.mp4` **AAC packet-bitstream identically**. Zero modifications to soundtrack or inserted audio layers.
- Complete FFmpeg `-xerror` full video+audio decode: **PASS**.
- No cut, source-frame or motion changes to frames 0–42, 201–465; visual content preserved with only final codec reencoding (average PSNR 43.5–47.4dB across unaffected sections).
- ZIP `YUNEX_GT3_V20_EDIT_AND_QA.zip` **28,194,922 bytes**, SHA256 `d43552da329476d47b454a948d0d3dfc9d3268e5f4ab4afc59dd0a70237563ff`, contains actual MP4, reproducible script, QA JSON and photographic before/after contact sheets; ZIP CRC PASS.

## Precise 30fps correction

Old B11 clip transitions occurred at frames 76,86,103,130,155,174,201. Music peaks in the current V18 audio were detected around 78 (2.584s), 90 (3.003s), 108 (3.592s), 134 (4.470s), 160 (5.338s), 177 (5.897s), 201 (6.705s). Rebuilt transitions:

| Purpose | Old cut frame | New beat cut frame |
|---|---:|---:|
| Middle opens | 76 | 78 |
| Moving Porsche/multi-car | 86 | 90 |
| Wet Porsche driving | 103 | 108 |
| Blue GT3 rear corner | 130 | 134 |
| Falken Porsche **on-track moving pass** | 155 | 160 |
| Porsche enters pit | 174 | 177 |
| Exact visible wheel-tool action | 201 | **201 untouched** |
| Pit exit | 227 | **227 untouched** |
| Racing finale | 246 | **246 untouched** |

### Actual ugly visual glitch repaired

At original B11 output frames **167–173**, the car abruptly disappeared and the camera showed mostly empty track just before the Porsche pit close-up. Old midshot has two unrelated tiny internal source cuts. Replaced the entire V20 timeline **160–176** with one native real Nürburgring Falken Porsche 911 GT3 R moving racing shot from `FALKEN24_PORSCHE_GT3R_NATIVE_1080_SOURCE.mp4` source time **14.85–15.67 seconds**. Original physical film SHA-256: `3631b193900193fb341d36a1b449d0179bd8bdd9f9692869716e592781b3743f`. Video input only, no source audio. Same genuine source film as underlying pit-service sequence, producing a coherent same-car action-to-pit transition. No generic FX or added noise.

## Review and limitations
The output was evaluated through targeted before/after image contact sheets and quantitative full-decode/frame tests. No independent real-time viewing/listening of the entire movie was performed, and **the user has not approved V20 yet**. Technical PASS is not a creative PASS. Actual media files live in ChatGPT sandbox rather than GitHub workflows, so issue manager should not claim GH Action artifact delivery.

**No edits were made to Agent C's audio code or the user-locked reference files.**