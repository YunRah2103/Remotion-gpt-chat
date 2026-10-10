"""Tests use original pixel/tempo rules, no outside Porsche media required."""
import json
import math
import sys
import tempfile
import unittest
from pathlib import Path

FX=Path(__file__).resolve().parents[1]/"fx"
sys.path.insert(0,str(FX))
from make_luts import PRESETS,grade,generate
from speed_ramp import validate,filtergraph

class FXToolkitTests(unittest.TestCase):
    def test_lut_generation_checksums_3d_contrast(self):
        with tempfile.TemporaryDirectory() as folder:
            one=generate(folder,17)
            self.assertEqual(len(one["presets"]),5)
            self.assertEqual(len(PRESETS),5)
            for p in one["presets"]:
                text=(Path(folder)/p["path"]).read_text()
                self.assertIn("LUT_3D_SIZE 17",text)
                self.assertEqual(len(text.splitlines()),17**3+4)
                self.assertGreater(len(text),150000)
                self.assertEqual(p["sha256"],next(q["sha256"] for q in generate(folder,17)["presets"] if q["name"]==p["name"]))
    def test_colour_values_bounded_and_neutral(self):
        for p in PRESETS.values():
            for value in [(0,0,0),(1,1,1),(.35,.45,.55)]:
                x=grade(value,p)
                self.assertEqual(len(x),3)
                self.assertTrue(all(0<=v<=1 for v in x))
                self.assertTrue(all(math.isfinite(v) for v in x))
    def test_speed_ramps_produce_contiguous_filter(self):
        parts=json.loads((FX/"plans/sample-ramp.json").read_text())["segments"]
        self.assertAlmostEqual(validate(parts),1.8,places=4)
        cmd=filtergraph(parts,30)
        self.assertIn("concat=n=3:v=1:a=0",cmd)
        self.assertIn("fps=30",cmd)
        with self.assertRaises(ValueError):
            validate([{"start":0,"end":1,"speed":.3},{"start":1.2,"end":2,"speed":1}])
        with self.assertRaises(ValueError):
            validate([{"start":0,"end":1,"speed":0.01}])

if __name__=="__main__":unittest.main()
