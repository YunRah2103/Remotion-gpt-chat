import json,sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"tools"))
from production_pipeline import preflight,compositions
from visual_plan import plan
from benchmark import job_plan,measure
from handoff import validate as validate_handoff

ROOT=Path(__file__).resolve().parents[2]

class PipelineTests(unittest.TestCase):
    def test_real_registered_existing_composition_passes(self):
        result=preflight(ROOT,"turbo-001")
        self.assertEqual(result["renderCompositionId"],"TurboDocumentary")
        self.assertEqual(result["frames"],840)
        self.assertEqual(result["storyboard"]["shots"],5)

    def test_preproduction_abs_not_claimed_finished(self):
        with self.assertRaisesRegex(ValueError,"Preproduction"):preflight(ROOT,"abs-001")

    def test_captioned_composition_registered(self):
        self.assertEqual(compositions(ROOT)["TurboDocumentaryCaptioned"]["durationInFrames"],840)
        with tempfile.TemporaryDirectory() as root:
            path=Path(root)/"words.json"
            path.write_text(json.dumps({"words":[{"start":0,"end":.3,"word":"Turbo"},
                                                 {"start":.3,"end":.9,"word":"works."}]}))
            out=Path(root)/"preflight"
            result=preflight(ROOT,"turbo-001",captions=path,dest=out)
            self.assertEqual(result["captionWords"],2)
            self.assertEqual(result["renderCompositionId"],"TurboDocumentaryCaptioned")
            self.assertEqual(json.loads((out/"props.json").read_text())["words"][0]["word"],"Turbo")

    def test_wrong_duration_refused(self):
        with self.assertRaisesRegex(ValueError,"does not match"):preflight(ROOT,"turbo-001",composition="GpuDriveFilm")

    def test_visual_selection_is_specific(self):
        with tempfile.TemporaryDirectory() as root:
            for directory in ("old","new"):
                path=Path(root)/directory/"src";path.mkdir(parents=True)
                (path/"Root.tsx").write_text('<Composition id="A" durationInFrames={100}/>\n'
                                            '<Composition id="B" durationInFrames={60}/>\n'
                                            '<Composition id="GpuDriveFilm" durationInFrames={180}/>\n'
                                            '<Composition id="TurboDocumentary" durationInFrames={840}/>\n')
            a=plan(Path(root)/"old",Path(root)/"new",["src/turbo/Mechanical.tsx"])
            self.assertEqual([x["composition"] for x in a["targets"]],["TurboDocumentary"])
            self.assertTrue(a["targets"][0]["baselineExists"])
            b=plan(Path(root)/"old",Path(root)/"new",["src/GpuDriveFilm.tsx"])
            self.assertEqual([x["composition"] for x in b["targets"]],["GpuDriveFilm"])

    def test_benchmark_safe_limits_and_plan(self):
        self.assertEqual(len(job_plan("GpuDriveFilm",12,.25,"1,2,3",1)),3)
        for levels in ("0","1,1","1,2,4"):
            with self.assertRaises(ValueError):job_plan("GpuDriveFilm",12,.25,levels,1)
        with self.assertRaises(ValueError):job_plan("GpuDriveFilm",400,.25,"1",1)
        with tempfile.TemporaryDirectory() as root:
            value=measure("GpuDriveFilm",12,.25,"1,2",1,root,dry_run=True)
            self.assertTrue(value["dryRun"])
            self.assertEqual(len(value["plan"]),2)

    def test_verified_agent_handoff(self):
        record={"schemaVersion":1,"task":"abs-caliper-qa","branch":"feature/abs-caliper",
                "sourceSha":"a"*40,"owner":"hardware","summary":"Rendered a valid GLB",
                "status":"ready","files":["production/assets/caliper.glb"],
                "evidence":["https://github.com/test/run/3"],"blockers":[]}
        self.assertEqual(validate_handoff(record)["owner"],"hardware")
        record["evidence"]=[]
        with self.assertRaises(ValueError):validate_handoff(record)
        record["status"]="blocked"
        with self.assertRaises(ValueError):validate_handoff(record)
if __name__=="__main__":unittest.main()
