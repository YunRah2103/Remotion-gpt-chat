#!/usr/bin/env python3
"""Independent Cobalt 11 probe of genuine filmmakers' Huracan STO Vimeo films.

Reuses native FFprobe, checksum, and frame-contact proof from the previously
validated self-hosted Cobalt test. Reject portrait and files below native 1080.
"""
from pathlib import Path
import test_cobalt_selfhosted as core

core.ROOT = Path("out/sto-cobalt-vimeo")
core.ROOT.mkdir(parents=True,exist_ok=True)
core.SOURCES = [
    ("vimeo-clint-davis-566128123", "https://vimeo.com/566128123"),
    ("vimeo-elias-maria-808787211", "https://vimeo.com/808787211"),
    ("vimeo-lamborghini-sto-daytona-529262404", "https://vimeo.com/529262404"),
    ("vimeo-lamborghini-sto-behind-story-513872033", "https://vimeo.com/513872033"),
]
# Each actual file can be large. Preserve raw original only when native
# landscape and a maximum size guard is passed; never generate "1080p" upscale.
core.MAX_BYTES=180_000_000
core.main()
