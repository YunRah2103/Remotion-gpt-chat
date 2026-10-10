"""Network-free unit tests and native FFmpeg verifier regression."""
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "footage"))
from yt_dlp_ingest import (
    canonical_video_url, build_download_command, locate_download,
    quality_report, validate_limits, inspect_video,
)


class YoutubeIngestTests(unittest.TestCase):
    def test_canonical_single_video_urls(self):
        expected = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        for source in (
            expected, "https://youtu.be/dQw4w9WgXcQ",
            "https://www.youtube.com/shorts/dQw4w9WgXcQ?feature=share",
            "https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123",
            "https://www.youtube.com/live/dQw4w9WgXcQ",
        ):
            self.assertEqual(canonical_video_url(source), expected)

    def test_rejects_non_youtube_and_non_video_urls(self):
        for source in (
            "http://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "https://www.youtube.com.evil.com/watch?v=dQw4w9WgXcQ",
            "https://evil.net/a", "https://localhost/video",
            "https://youtube.com/playlist?list=x",
            "https://youtube.com/@somechannel",
            "https://youtube.com/watch?v=bad",
            "https://user:pass@youtube.com/watch?v=dQw4w9WgXcQ",
            "https://youtube.com:444/watch?v=dQw4w9WgXcQ",
        ):
            with self.subTest(source=source):
                with self.assertRaises(ValueError):
                    canonical_video_url(source)

    def test_command_does_not_use_a_shell_or_upscale(self):
        cmd = build_download_command(
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ", Path("/tmp/a b"), 150)
        self.assertEqual(cmd[:3], [sys.executable, "-m", "yt_dlp"])
        self.assertIn("--no-playlist", cmd)
        self.assertIn("--js-runtimes", cmd)
        self.assertIn("node", cmd)
        self.assertIn("--merge-output-format", cmd)
        self.assertEqual(cmd[cmd.index("--max-filesize") + 1], "150M")
        self.assertIn("bv*+ba/b", cmd)
        self.assertIn("after_move:filepath", cmd)
        self.assertNotIn("shell", cmd)

    def test_rejects_invalid_config(self):
        for opts in [(0, 24, 600, 1800), (1080, 0, 600, 1800),
                     (1080, 24, 0, 1800), (1080, 24, 600, 0)]:
            with self.assertRaises(ValueError):
                validate_limits(*opts)

    def test_resolves_only_video_inside_destination(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            good = root / "dQw4w9WgXcQ.mkv"
            good.write_bytes(b"example")
            bad = root.parent / "outside-video.mp4"
            self.assertEqual(locate_download(str(good) + "\n", root), good)
            with self.assertRaises(ValueError):
                locate_download("/outside-video.mp4\n", root)

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"),
                         "Native FFmpeg not installed")
    def test_native_ffprobe_and_quality_gate_on_original_synthetic_video(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            media = root / "original.mov"
            subprocess.run([
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-f", "lavfi", "-i", "testsrc2=size=640x360:rate=30:duration=1",
                "-c:v", "mpeg4", "-q:v", "3", str(media),
            ], check=True, timeout=60)
            source = inspect_video(media)
            self.assertEqual(source["width"], 640)
            self.assertEqual(source["height"], 360)
            self.assertAlmostEqual(source["fps"], 30.0)
            accepted = quality_report(media, min_height=360, min_fps=30, max_mb=50)
            self.assertEqual(accepted["status"], "PASS")
            self.assertEqual(len(accepted["sourceFileSha256"]), 64)
            self.assertFalse(accepted["policy"]["reencoded"])
            rejected = quality_report(media, min_height=1080, min_fps=60, max_mb=50)
            self.assertEqual(rejected["status"], "REJECTED")
            self.assertEqual(len(rejected["reason"]), 2)


if __name__ == "__main__":
    unittest.main()
