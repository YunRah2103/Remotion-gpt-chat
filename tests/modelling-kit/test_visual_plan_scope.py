"""Ensure kit-only integration narrows native review without hiding legacy edits."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[2] / "production/tools/visual_plan.py"
spec = importlib.util.spec_from_file_location("yunex_visual_plan", SOURCE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

def root(path, extra=False):
    path.mkdir(parents=True, exist_ok=True)
    (path / "src").mkdir(exist_ok=True)
    compositions = ('<Composition id="StudioMaterialProof" durationInFrames={150} />\n'
                    '<Composition id="ChironFourTurbosFilm" durationInFrames={858} />\n'
                    '<Composition id="GpuDriveFilm" durationInFrames={180} />\n')
    if extra:
        compositions += '<Composition id="NewUnrelated" durationInFrames={60} />\n'
    (path / "src/Root.tsx").write_text(compositions)

class IntegrationVisualPlanTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.base = Path(self.tmp.name) / "base"
        self.candidate = Path(self.tmp.name) / "candidate"
        root(self.base)
        root(self.candidate)

    def names(self, changes):
        return {t["composition"] for t in module.plan(self.base, self.candidate, changes)["targets"]}

    def test_additive_studio_scoped_work_passes_only_studio_reference(self):
        changes = [
            "src/yunex/modelling-kit/rig.ts", "src/yunex/parts-kit/chassis.ts",
            "src/yunex/world-kit/road.ts", "src/Root.tsx", "package.json",
            ".github/workflows/yunex-kit-main-integration.yml",
            "docs/YUNEX_V4_OVERHAUL_HANDOFF.md",
            "production/tools/visual_plan.py",
        ]
        self.assertEqual(self.names(changes), {"StudioMaterialProof"})

    def test_changed_episode_preserves_broad_native_review(self):
        changes = ["src/yunex/modelling-kit/rig.ts", "src/Root.tsx",
                   "production/yunex/f1_sparks_ep004/story/StorySequence.tsx"]
        self.assertIn("ChironFourTurbosFilm", self.names(changes))

    def test_modified_root_registry_preserves_broad_review(self):
        root(self.candidate, extra=True)
        self.assertIn("NewUnrelated", self.names(["src/yunex/modelling-kit/rig.ts", "src/Root.tsx"]))

    def test_unrelated_legacy_change_keeps_original_targeting(self):
        self.assertEqual(self.names(["src/GpuDriveFilm.tsx"]), {"GpuDriveFilm"})

if __name__ == "__main__":
    unittest.main()
