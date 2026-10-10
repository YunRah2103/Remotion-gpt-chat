"""Source-free contract checks for MIDNIGHT V12 001.

Does not require the user's private audio or third-party video in a public CI run.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROJECT = ROOT / "production" / "videos" / "midnight-v12-001"
MAP = PROJECT / "beat-map.json"
FPS = 30
FRAMES = 316


class MidnightV12ContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.data = json.loads(MAP.read_text(encoding="utf-8"))

    def test_output_exact_video_geometry(self) -> None:
        d = self.data
        self.assertEqual((d["width"], d["height"], d["fps"], d["frames"]),
                         (1080, 1920, FPS, FRAMES))
        self.assertAlmostEqual(d["durationSeconds"], FRAMES / FPS, places=8)

    def test_every_frame_assigned_exactly_once(self) -> None:
        shots = self.data["shots"]
        self.assertEqual(len(shots), 11)
        self.assertEqual([x["id"] for x in shots],
                         [f"S{i:02d}" for i in range(1, 12)])
        self.assertEqual(shots[0]["in"], 0)
        self.assertEqual(shots[-1]["out"], FRAMES)
        for idx, shot in enumerate(shots):
            self.assertGreater(shot["out"] - shot["in"], 7)
            self.assertIn("visual", shot)
            self.assertIn("movement", shot)
            if idx:
                self.assertEqual(shots[idx-1]["out"], shot["in"])

    def test_primary_transition_aligned_with_observed_audio_change(self) -> None:
        d = self.data
        self.assertIn(77, [x["in"] for x in d["shots"]])
        self.assertAlmostEqual(77 / FPS, d["audio"]["highConfidenceStructuralShiftSeconds"],
                               delta=0.04)
        self.assertTrue(all(0 <= t <= d["durationSeconds"] for t in d["musicalLandmarksSeconds"]))
        self.assertEqual(sorted(d["musicalLandmarksSeconds"]), d["musicalLandmarksSeconds"])

    def test_exotic_aggressive_director_override_is_locked(self) -> None:
        d = self.data
        self.assertIn("aggressive", d["creativeDirective"].lower())
        self.assertIn("exotic", d["creativeDirective"].lower())
        self.assertFalse(d["heroVehicle"]["mandatoryNight"])
        self.assertFalse(d["heroVehicle"]["mandatoryV12"])
        self.assertGreaterEqual(len(d["heroVehicle"]["candidates"]), 5)
        self.assertIn("f77", d["editPhilosophy"])
        self.assertNotIn("slow industrial", d["editPhilosophy"].lower())
        self.assertTrue(all(s.get("visual") and s.get("movement") and s.get("cut")
                            for s in d["shots"]))

    def test_private_audio_integrity_fingerprint(self) -> None:
        a = self.data["audio"]
        self.assertRegex(a["sha256"], r"^[0-9a-f]{64}$")
        self.assertEqual(a["sampleRateHz"], 44100)
        self.assertEqual(a["channels"], 2)
        self.assertFalse(a["storedInRepo"])
        self.assertLess(abs(a["decodedPcmSeconds"] - FRAMES/FPS), 1/FPS)
        self.assertNotEqual(a["filename"], "")

    def test_prompt_structure_and_deliverable_handoffs(self) -> None:
        names = [
            "AGENT-A-FOOTAGE-SCOUT.md", "AGENT-B-EDITOR.md",
            "AGENT-C-LOOK-SOUND-QA.md", "AGENT-D-MASTER.md"
        ]
        for filename in names:
            with self.subTest(filename=filename):
                prompt = (PROJECT / "agent-prompts" / filename).read_text(encoding="utf-8")
                self.assertGreater(len(prompt), 800)
                self.assertIn("midnight-v12-001", prompt)
        self.assertTrue((PROJECT / "PRODUCTION_CONTRACT.md").is_file())

    def test_audio_file_sha256_if_supplied_privately(self) -> None:
        # Optional private test: run python this_test.py /path/to/user-uploaded.mp3.
        # Never commit private audio or its rendered derivatives to GitHub.
        if not "--audio-sha-test" in sys.argv:
            return
        idx = sys.argv.index("--audio-sha-test")
        path = Path(sys.argv[idx+1])
        self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(),
                         self.data["audio"]["sha256"])


if __name__ == "__main__":
    if "--audio-sha-test" in sys.argv:
        idx = sys.argv.index("--audio-sha-test")
        audio_path = sys.argv[idx+1]
        del sys.argv[idx:idx+2]
        # Use contract SHA explicitly if an operator hands in audio.
        expected = json.loads(MAP.read_text())["audio"]["sha256"]
        actual = hashlib.sha256(Path(audio_path).read_bytes()).hexdigest()
        if actual != expected:
            raise SystemExit("PRIVATE_AUDIO_SHA_MISMATCH")
        print("PRIVATE_AUDIO_SHA_PASS")
    unittest.main()
