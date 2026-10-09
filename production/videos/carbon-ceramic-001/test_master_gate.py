"""Offline unit tests for the master release gate (no Blender/render claims)."""
import json
import tempfile
import unittest
from pathlib import Path

from master_gate import BASE_SHA, PROJECT, SPECIALISTS, evaluate


class MasterGateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.project = self.root / PROJECT
        (self.project / "handoffs").mkdir(parents=True)
        (self.root / "src").mkdir(parents=True)
        (self.root / "src" / "brakes001").mkdir(parents=True)
        (self.root / "src" / "Root.tsx").write_text('<Composition id="CarbonCeramic001" />', encoding="utf8")
        (self.root / "src" / "brakes001" / "CarbonCeramic001.tsx").write_text("export const CarbonCeramic001 = () => null;", encoding="utf8")
        self.brief = {
            "status": "implemented",
            "sourceCompositionId": "CarbonCeramic001",
            "fps": 30,
            "durationInFrames": 750,
            "resolution": [1080, 1920],
        }
        self._brief()
        self.handoffs = {}
        for letter, (owner, suffix, prefix) in SPECIALISTS.items():
            name = prefix + "proof.ts"
            dst = self.root / name
            dst.parent.mkdir(parents=True, exist_ok=True)
            dst.write_text("export const proof = true;", encoding="utf8")
            self.handoffs[letter] = {
                "schemaVersion": 1,
                "task": "carbon-ceramic-001-agent-" + letter,
                "branch": "automotive-brakes-001/" + suffix,
                "owner": owner,
                "sourceSha": "a" * 40,
                "status": "ready",
                "files": [name],
                "evidence": ["Native frame sequence inspected"],
                "blockers": [],
            }
            self._handoff(letter)

    def _brief(self):
        (self.project / "brief.json").write_text(json.dumps(self.brief), encoding="utf8")

    def _handoff(self, letter):
        (self.project / "handoffs" / f"agent-{letter}.json").write_text(
            json.dumps(self.handoffs[letter]), encoding="utf8"
        )

    def test_ready_only_when_all_four_agents_and_master_are_integrated(self):
        report = evaluate(self.root)
        self.assertTrue(report["releaseReadyForRendering"])
        self.assertEqual(len(report["specialists"]), 4)

    def test_placeholder_is_not_counted_as_implementation(self):
        self.handoffs["a"]["status"] = "blocked"
        self.handoffs["a"]["sourceSha"] = BASE_SHA
        self.handoffs["a"]["evidence"] = []
        self._handoff("a")
        report = evaluate(self.root)
        self.assertFalse(report["releaseReadyForRendering"])
        self.assertTrue(any("Agent A" in issue for issue in report["blockers"]))

    def test_missing_merged_source_rejects_ready_label(self):
        path = self.root / self.handoffs["b"]["files"][0]
        path.unlink()
        self.assertFalse(evaluate(self.root)["releaseReadyForRendering"])

    def test_storyboard_is_not_finished_video(self):
        self.brief["status"] = "preproduction"
        self.brief["sourceCompositionId"] = None
        self._brief()
        report = evaluate(self.root)
        self.assertFalse(report["releaseReadyForRendering"])
        self.assertTrue(any("not marked implemented" in s for s in report["blockers"]))

    def test_missing_master_composition_blocks(self):
        (self.root / "src" / "Root.tsx").write_text("", encoding="utf8")
        self.assertFalse(evaluate(self.root)["releaseReadyForRendering"])


if __name__ == "__main__":
    unittest.main()
