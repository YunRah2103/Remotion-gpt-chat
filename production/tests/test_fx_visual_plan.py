"""Composition-aware FX PR selection must not touch old unrelated media assets."""
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"tools"))
from visual_plan import plan

class FXVisualSelectionTests(unittest.TestCase):
    def test_new_fx_composition_and_dependency_smoke_not_private_photo_assets(self):
        with tempfile.TemporaryDirectory() as t:
            old=Path(t)/"baseline"
            new=Path(t)/"candidate"
            for path in (old,new):(path/"src").mkdir(parents=True)
            oldroot='<Composition id="GpuDriveFilm" durationInFrames={180}/>\n<Composition id="AutomotivePhotoCollage001" durationInFrames={600}/>'
            (old/"src/Root.tsx").write_text(oldroot)
            (new/"src/Root.tsx").write_text(oldroot+'\n<Composition id="AutomotiveFXShowcase" durationInFrames={220}/>')
            check=plan(old,new,["src/Root.tsx","src/fx/FXShowcase.tsx","package.json"])
            comps=[r["composition"] for r in check["targets"]]
            self.assertEqual(comps,["AutomotiveFXShowcase","GpuDriveFilm"])
            self.assertTrue(next(r for r in check["targets"] if r["composition"]=="GpuDriveFilm")["baselineExists"])
            self.assertFalse(next(r for r in check["targets"] if r["composition"]=="AutomotiveFXShowcase")["baselineExists"])
            self.assertNotIn("AutomotivePhotoCollage001",comps)
    def test_root_change_existing_composition_duration_selected(self):
        with tempfile.TemporaryDirectory() as t:
            old=Path(t)/"baseline";new=Path(t)/"candidate"
            for path in (old,new):(path/"src").mkdir(parents=True)
            (old/"src/Root.tsx").write_text('<Composition id="GpuDriveFilm" durationInFrames={180}/>')
            (new/"src/Root.tsx").write_text('<Composition id="GpuDriveFilm" durationInFrames={240}/>')
            check=plan(old,new,["src/Root.tsx"])
            self.assertEqual(len(check["targets"]),1)
            self.assertFalse(check["targets"][0]["baselineExists"])

if __name__=="__main__":
    unittest.main()
