#!/usr/bin/env python3
"""Portable fail-closed tests, no private audio or footage required."""
import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import finalize


class FinalizeTests(unittest.TestCase):
    def test_known_digest(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / 'a'
            p.write_bytes(b'French Legends')
            self.assertEqual(finalize.digest(p), hashlib.sha256(b'French Legends').hexdigest())

    def test_soundtrack_is_hash_locked(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / 'imposter.m4a'
            p.write_bytes(b'wrong song')
            with self.assertRaisesRegex(ValueError, 'WRONG SOUNDTRACK'):
                finalize.validate_song(p)

    def test_ffprobe_and_malformed_visual_gate(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / 'fake_c.mp4'
            subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
                            '-f', 'lavfi', '-i', 'color=c=gray:s=640x360:r=30',
                            '-t', '1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                            str(p)], check=True)
            self.assertEqual(finalize.stream(finalize.probe(p), 'video')['width'], 640)
            with self.assertRaisesRegex(ValueError, 'needs native 1920x1080'):
                finalize.validate_c_video(p)

    def test_negative_missing_source_audio(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / 'broken_file.m4a'
            p.write_bytes(b'')
            with self.assertRaises(ValueError):
                finalize.validate_song(p)


if __name__ == '__main__':
    unittest.main(verbosity=2)
