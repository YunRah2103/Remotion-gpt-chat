import tempfile
import unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"tools"))
from shot_validator import validate

class TimelineTests(unittest.TestCase):
    def test_good_timeline(self):
        b={"durationInFrames":750,"fps":30}
        s=[{"startFrame":0,"endFrame":149},{"startFrame":150,"endFrame":749}]
        self.assertEqual(validate(b,s,"ABS uses wheel-speed sensors")["frames"],750)

    def test_gap_rejected(self):
        with self.assertRaises(ValueError):
            validate({"durationInFrames":12,"fps":30},
                     [{"startFrame":0,"endFrame":4},{"startFrame":6,"endFrame":11}])

    def test_overlap_rejected(self):
        with self.assertRaises(ValueError):
            validate({"durationInFrames":12,"fps":30},
                     [{"startFrame":0,"endFrame":5},{"startFrame":5,"endFrame":11}])
