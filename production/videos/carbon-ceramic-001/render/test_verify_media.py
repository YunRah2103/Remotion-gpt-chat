#!/usr/bin/env python3
"""Synthetic checker fixtures only; NEVER evidence of carbon-ceramic footage."""
import subprocess
import tempfile
import unittest
from pathlib import Path
from verify_media import verify

class MediaQATests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.path = Path(cls.temp.name) / "synthetic-checker-test.mp4"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                        "-f", "lavfi", "-i", "testsrc2=s=108x192:r=30",
                        "-frames:v", "45", "-c:v", "libx264", "-pix_fmt", "yuv420p",
                        str(cls.path)], check=True)

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def test_native_compatible_fixture_passes(self):
        r = verify(self.path, width=108, height=192, frames=45)
        self.assertTrue(r["technicalPass"], r["errors"])
        self.assertEqual(r["ffmpegDecodedFrames"], 45)
        self.assertEqual(len(r["sha256"]), 64)
        self.assertFalse(r["audio"]["present"])

    def test_wrong_frame_count_fails(self):
        self.assertFalse(verify(self.path, width=108, height=192, frames=750)["technicalPass"])

    def test_wrong_dimensions_fail(self):
        self.assertFalse(verify(self.path, width=1080, height=1920, frames=45)["technicalPass"])

    def test_missing_file_fails(self):
        with self.assertRaises(ValueError):
            verify(self.path.parent / "no-video.mp4")

if __name__ == "__main__":
    unittest.main()
