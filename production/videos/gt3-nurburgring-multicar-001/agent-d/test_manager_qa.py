"""Proof that the independent release gates fail closed on absent/fake inputs.

Synthetic fixtures are intentionally invalid and are NEVER counted as GT3 footage.
"""
import json
import subprocess
import tempfile
import unittest
import zipfile
from pathlib import Path

import manager_qa as qa


class ManagerGateTests(unittest.TestCase):
    def test_no_files_means_no_pass(self):
        report = qa.audit()
        self.assertEqual(report["gate_a_footage"]["status"], "BLOCKED")
        self.assertEqual(report["song_gate"]["status"], "BLOCKED")
        self.assertEqual(report["gate_c_master"]["status"], "BLOCKED")
        self.assertEqual(report["gate_d_manager"], "BLOCKED")

    def test_wrong_music_hash_is_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "fake.mp3"
            path.write_bytes(b"not the uploaded soundtrack")
            self.assertEqual(qa.song_gate(path)["status"], "FAIL")

    def test_corrupt_zip_is_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "bad.zip"
            path.write_bytes(b"zip not real")
            self.assertEqual(qa.footage_gate(path)["status"], "FAIL")

    def test_empty_archive_does_not_count_as_footage(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "empty.zip"
            with zipfile.ZipFile(path, "w") as bundle:
                bundle.writestr("manifest.json", json.dumps({"shots": []}))
            gate = qa.footage_gate(path)
            self.assertEqual(gate["status"], "FAIL")
            self.assertEqual(gate["clip_files"], 0)

    def test_low_resolution_synthetic_mp4_cannot_pass(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "synthetic.mp4"
            subprocess.run(["ffmpeg", "-nostdin", "-v", "error",
                            "-f", "lavfi", "-i", "color=c=black:s=320x180:r=30:d=1",
                            "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
                            "-t", "1", "-c:v", "libx264", "-pix_fmt", "yuv420p",
                            "-c:a", "aac", "-shortest", "-y", str(path)],
                           check=True, capture_output=True)
            gate = qa.master_gate(path)
            self.assertEqual(gate["status"], "FAIL")
            self.assertIn("Not 1920x1080", gate["reasons"])


if __name__ == "__main__":
    unittest.main()
