import json
import sys
import tempfile
import unittest
from pathlib import Path

ADV=Path(__file__).resolve().parents[1]/"advanced"
sys.path.insert(0,str(ADV))
from asset_contract import validate
from clearance import audit,shared
from recovery import slices,evaluate,source_run

class AdvancedTests(unittest.TestCase):
    def test_valid_mechanism_and_pivot_checks(self):
        base=json.loads((ADV/"contracts/rotor-demo.json").read_text())
        self.assertEqual(validate(base)["movingParts"][0]["name"],"Rotor")
        bad=json.loads(json.dumps(base))
        bad["movingParts"][0]["axis"]=[5,0,0]
        with self.assertRaisesRegex(ValueError,"axis"):validate(bad)
        bad=json.loads(json.dumps(base))
        bad["movingParts"].append(dict(bad["movingParts"][0]))
        with self.assertRaisesRegex(ValueError,"Duplicate"):validate(bad)
    def test_real_bbox_overlaps_and_intended_contact(self):
        sample={"schemaVersion":1,"frames":[
            {"frame":1,"parts":{"wheel":[0,0,0,2,2,1],"caliper":[1,.5,0,3,1.5,1]}},
            {"frame":2,"parts":{"wheel":[0,0,0,2,2,1],"caliper":[3,0,0,4,1,1]}}],
            "allowedContactPairs":[],"tolerance":0.001}
        report=audit(sample)
        self.assertEqual(len(report["potentialIntersections"]),1)
        self.assertEqual(report["potentialIntersections"][0]["frame"],1)
        sample["allowedContactPairs"]=[["wheel","caliper"]]
        self.assertEqual(len(audit(sample)["potentialIntersections"]),0)
        self.assertEqual(shared([0,0,0,1,1,1],[2,2,2,3,3,3]),[0,0,0])
        bad={"schemaVersion":1,"frames":[{"frame":1,"parts":{"a":[1,2,3,0,4,5]}}]}
        with self.assertRaises(ValueError):audit(bad)
    def test_frame_chunk_boundaries_and_partial_completion(self):
        chunks=slices(751)
        self.assertEqual(chunks[0],{"part":0,"start":0,"end":150})
        self.assertEqual(chunks[-1],{"part":4,"start":604,"end":750})
        plan=evaluate(751,[0,2,4])
        self.assertEqual(plan["missingParts"],[1,3])
        self.assertEqual(plan["reusableParts"],[0,2,4])
        self.assertEqual(sum(x["end"]-x["start"]+1 for x in chunks),751)
        with self.assertRaises(ValueError):evaluate(751,[7])
    def test_recovery_run_rejects_other_projects_and_sources(self):
        good={"id":123,"repository":{"full_name":"YunRah2103/Remotion-gpt-chat"},
              "name":"Production - automated preflight, 3D proofs and final master",
              "head_sha":"a"*40}
        self.assertEqual(source_run(good,"YunRah2103/Remotion-gpt-chat",123),"a"*40)
        good["repository"]["full_name"]="YunRah2103/yunus-video-lab"
        with self.assertRaises(ValueError):source_run(good,"YunRah2103/Remotion-gpt-chat",123)

if __name__=="__main__":unittest.main()
