# Agent C — alternative licence and quality source audit (2026-10-12)

## Reusable still source — optional, NOT motion footage

- [Wikimedia Commons, Audi RS6 Avant (C8) Washington DC Metro Area, USA (1).jpg](https://commons.wikimedia.org/wiki/File:Audi_RS6_Avant_(C8)_Washington_DC_Metro_Area,_USA_(1).jpg): photographed by OWS Photography, original 3240x2160, **CC BY 4.0**. Verified from the Commons file description, attribution and reuse conditions. High-angle daylight photograph of white C8 RS6, with another vehicle in the background. **Not approved as premium macro**, and must not be represented as moving footage. If adapted, credit OWS Photography, link source and CC BY 4.0, and describe modifications.
- [Wikimedia Commons, 2019 Audi RS6 Avant 4.0 Front End.jpg](https://commons.wikimedia.org/wiki/File:2019_Audi_RS6_Avant_4.0_Front_End.jpg): close-up still, original 3924x2617, **CC BY-SA 4.0**, not video. Share-alike obligations need to be considered for any adaptation.

## Motion-footage discovery status

- Pexels broad RS6 searches returned mostly unrelated generic car results; not a verified C8 video.
- Pixabay exact `audi rs6` search surfaced one 20s HD generic driving result and a 14s 4K retro-vehicle result in a localized listing; neither was confirmed as genuine C8 RS6. Do not label these approved.
- Stock listings for RS6 C8 are available in HD/4K (Pond5), but the located items were explicitly **editorial-only** and require purchase. No download or permission to republish obtained.
- Existing official Audi source still technically passes FFprobe/full decode at 1280x720 but is **below native 1080p** and limited to editorial/journalistic use. See prior C-branch motion QA.

## Execution

Added `agent_c_commons_video_search.py` at commit `f353a685892e04dedf680f524a06f5a7f75836ee` to query Wikimedia Commons' video search and output license/dimension evidence. **Not yet executed on an internet-connected runner**; do not claim its output or video files exist. This run could not establish a new Actions trigger through the available GitHub write interface. Existing GitHub runs remain as recorded in `agent-c-motion-candidates.md`.

**Gate remains CLOSED**: 0 new genuine moving C8 macro clips, 0 rights-cleared 1080p video artifacts. Still-image options are not a substitute for Agent C's actual moving footage contract.
