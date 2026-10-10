#!/usr/bin/env python3
"""Offline-native unit tests for Agent A acquisition and research QA.
Synthetic video tests validate machinery only; they NEVER count as M5 footage."""
import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

import prepare

class PreparationTests(unittest.TestCase):
    def test_42_contiguous_chronological_slots(self):
        prepare.validate_board()
        board=prepare.load(prepare.BOARD)
        self.assertEqual(board["totalFrames"], 552)
        self.assertEqual(len(board["slots"]), 42)
        self.assertEqual([x["generation"] for x in board["slots"][::6]],list(prepare.GENS))

    def test_no_unverified_media_claims(self):
        catalog=prepare.load(prepare.CATALOG)["sources"]
        self.assertGreaterEqual(len(catalog), 7)
        self.assertTrue(all(x.get("downloaded") is False for x in catalog))
        self.assertTrue(all(x.get("motionVerified") is False for x in catalog))
        board=prepare.load(prepare.BOARD)["slots"]
        self.assertTrue(all(x.get("status")=="MISSING_VERIFIED_CLIP" for x in board))
        self.assertTrue(all(x.get("fileSha256") is None for x in board))

    def test_safe_source_urls(self):
        allowed="https://mediapool.bmwgroup.com/download/edown/tvFootageDownload?actEvent=tvFootageSceneHD&attachment=1&filmSceneFileId=7902"
        self.assertIsNone(prepare.safe_download_url(allowed))
        unsafe=(
            "http://mediapool.bmwgroup.com/download/edown/tvFootageDownload?actEvent=tvFootageSceneHD&filmSceneFileId=7902",
            "https://example.com/download/edown/tvFootageDownload?actEvent=tvFootageSceneHD&filmSceneFileId=7902",
            "https://mediapool.bmwgroup.com/other-path?actEvent=tvFootageSceneHD&filmSceneFileId=7902",
            "https://mediapool.bmwgroup.com/download/edown/tvFootageDownload?actEvent=other&filmSceneFileId=7902",
        )
        for url in unsafe:
            with self.subTest(url=url),self.assertRaises(ValueError):
                prepare.safe_download_url(url)

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"),"FFmpeg is not installed")
    def test_native_ffprobe_sha_and_frame_extraction_on_synthetic_fixture(self):
        with tempfile.TemporaryDirectory() as folder:
            video=Path(folder)/"testsrc-only-not-an-m5.mp4"
            subprocess.run(
                ["ffmpeg","-hide_banner","-loglevel","error","-y",
                 "-f","lavfi","-i","testsrc2=size=640x360:rate=30",
                 "-frames:v","27","-c:v","mpeg4","-q:v","2",str(video)],
                timeout=45,check=True,capture_output=True)
            info=prepare.ffprobe(video)
            self.assertEqual((info["width"],info["height"]),(640,360))
            self.assertAlmostEqual(info["fps"],30,places=1)
            self.assertGreater(info["durationSeconds"],.85)
            self.assertEqual(len(info["sha256"]),64)
            self.assertEqual(info["sha256"],prepare.sha256(video))
            self.assertGreater(len(prepare.jpeg_at(video,.05)),3000)
            self.assertGreater(len(prepare.jpeg_at(video,.5)),3000)

if __name__=="__main__":
    unittest.main(verbosity=2)
