"""Offline multi-engine footage acquisition tests; never requests actual social media."""
import importlib.util
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

FILE = Path(__file__).resolve().parents[1] / "footage_rescue" / "acquire.py"
spec = importlib.util.spec_from_file_location("footage_rescue", FILE)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class AcquisitionTests(unittest.TestCase):
    def test_individual_source_urls_only(self):
        self.assertEqual(mod.site_for("https://www.youtube.com/watch?v=abcdefghijk"), "youtube")
        self.assertEqual(mod.site_for("https://www.instagram.com/reel/abcd/"), "instagram")
        self.assertEqual(mod.site_for("https://vm.tiktok.com/ABCDE/"), "tiktok")
        for url in ("http://youtube.com/watch?v=abc",
                    "https://youtube.com.attacker.net/watch?v=abcdefghijk",
                    "https://www.youtube.com/@creator/videos",
                    "https://www.instagram.com/creator/",
                    "https://www.tiktok.com/@creator"):
            with self.assertRaises(ValueError):
                mod.site_for(url)

    def test_additional_social_single_video_allowlist(self):
        cases = {
            "snapchat": "https://www.snapchat.com/%40carclips24/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYb256dGtjdG9zAZRXQhLHAZRXQgtdAAAAAQ",
            "pinterest": "https://uk.pinterest.com/pin/615726580336703478/",
            "twitch": "https://www.twitch.tv/xqc/clip/CulturedAmazingKuduDatSheffy-TiZ_-ixAGYR3y2Uy",
            "x": "https://x.com/BrooklynNets/status/1349794411333394432",
            "bluesky": "https://bsky.app/profile/bsky.app/post/3l3vgf77uco2g",
        }
        for site, url in cases.items():
            with self.subTest(site=site):
                self.assertEqual(mod.site_for(url), site)
                self.assertEqual(mod.engines_for(site, "auto"), ["yt-dlp", "yt-dlp-chrome"])
        for url in ("https://www.pinterest.com/my-board/",
                    "https://www.snapchat.com/add/carclips24",
                    "https://bsky.app/profile/bsky.app",
                    "https://x.com/Porsche",
                    "https://www.twitch.tv/xqc"):
            with self.assertRaises(ValueError):
                mod.site_for(url)

    def test_fallback_order_and_engine_support(self):
        self.assertEqual(mod.engines_for("youtube", "auto", True),
                         ["yt-dlp", "pytubefix", "cobalt"])
        self.assertEqual(mod.engines_for("instagram", "auto", False),
                         ["yt-dlp", "yt-dlp-chrome", "gallery-dl"])
        self.assertEqual(mod.engines_for("tiktok", "auto", False),
                         ["yt-dlp", "yt-dlp-chrome", "gallery-dl"])
        with self.assertRaises(ValueError):
            mod.engines_for("youtube", "gallery-dl")
        with self.assertRaises(ValueError):
            mod.engines_for("youtube", "cobalt", False)

    def test_error_classification(self):
        self.assertEqual(mod.classify("HTTP Error 429"), "RATE_LIMITED")
        self.assertEqual(mod.classify("HTTP Error 403"), "REMOTE_ACCESS_DENIED")
        self.assertEqual(mod.classify("Login required"), "AUTH_REQUIRED")
        self.assertEqual(mod.classify("Video unavailable"), "SOURCE_UNAVAILABLE")

    def test_rights_gate(self):
        with tempfile.TemporaryDirectory() as td:
            with self.assertRaises(ValueError):
                mod.acquire("https://www.youtube.com/watch?v=abcdefghijk",
                            Path(td), rights_confirmed=False)

    def test_failure_still_packages_manifest(self):
        with tempfile.TemporaryDirectory() as td:
            with patch.object(mod, "ytdlp", side_effect=RuntimeError("HTTP Error 403")):
                with patch.object(mod, "pytubefix", side_effect=RuntimeError("Video unavailable")):
                    with patch.dict(mod.os.environ, {}, clear=True):
                        result = mod.acquire("https://www.youtube.com/watch?v=abcdefghijk",
                                             Path(td), rights_confirmed=True)
            self.assertEqual(result["status"], "FAILED")
            self.assertEqual(result["reasonCode"], "SOURCE_BLOCKED_OR_UNAVAILABLE")
            self.assertEqual(result["attempts"][0]["reasonCode"], "REMOTE_ACCESS_DENIED")
            self.assertEqual(len(result["attempts"]), 2)

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "FFmpeg needed")
    def test_native_video_probe(self):
        with tempfile.TemporaryDirectory() as td:
            sample = Path(td) / "synthetic.mp4"
            subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                            "-f", "lavfi", "-i", "testsrc2=size=640x360:rate=30:duration=1",
                            "-c:v", "mpeg4", "-q:v", "5", str(sample)], check=True)
            qa, issues = mod.examine(sample, 1080, 600, 1200)
            self.assertEqual(issues, ["LOW_RESOLUTION"])
            self.assertEqual(qa["fps"], 30)
            self.assertFalse(qa["nativeVertical1080CropPossible"])
            self.assertEqual(mod.examine(sample, 360, 600, 1200)[1], [])

if __name__ == "__main__":
    unittest.main()
