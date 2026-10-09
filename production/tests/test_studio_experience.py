import json
import sys
import tempfile
import unittest
import wave
from pathlib import Path

from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"production/sound"))
sys.path.insert(0,str(ROOT/"production/phoneqa"))
sys.path.insert(0,str(ROOT/"production/portal"))

from sound import check_plan, render
from phone_qa import audit, perform
from build import build, projects

class StudioExperienceTests(unittest.TestCase):
    def test_synthesised_events_make_valid_48k_wav(self):
        data={"schemaVersion":1,"fps":30,"frames":15,"events":[
            {"type":"valve","frame":2,"lengthFrames":4,"gain":.25},
            {"type":"brake","frame":6,"lengthFrames":7,"gain":.3}]}
        with tempfile.TemporaryDirectory() as tmp:
            dest=Path(tmp)/"effects.wav"
            manifest=render(data,dest)
            with wave.open(str(dest),"rb") as w:
                self.assertEqual(w.getframerate(),48000)
                self.assertEqual(w.getnchannels(),1)
                self.assertEqual(w.getnframes(),24000)
                self.assertGreater(max(w.readframes(24000)),0)
            self.assertEqual(manifest["effects"],2)
            self.assertTrue((Path(tmp)/"effects-report.json").is_file())
        bad=dict(data)
        bad["events"]=[{"type":"valve","frame":17,"lengthFrames":3,"gain":.4}]
        with self.assertRaises(ValueError):check_plan(bad)
        bad["events"]=[{"type":"illegal","frame":1,"lengthFrames":1,"gain":.4}]
        with self.assertRaises(ValueError):check_plan(bad)

    def test_phone_safety_detects_ui_collisions_and_small_text(self):
        bad={"schemaVersion":1,"captions":[{"name":"caption","bounds":[.8,.70,.18,.08],"fontSizePx":25}],
             "subjects":[{"name":"hero","bounds":[.17,.25,.45,.3]}]}
        report=audit(bad)
        self.assertTrue(any(x.get("zone")=="right_buttons" for x in report["warnings"]))
        self.assertTrue(any("small" in x.get("reason","") for x in report["warnings"]))
        good={"schemaVersion":1,"captions":[{"name":"caption","bounds":[.15,.65,.5,.08],"fontSizePx":56}],
              "subjects":[{"name":"hero","bounds":[.17,.22,.5,.3]}]}
        self.assertEqual(audit(good)["warnings"],[])
        with tempfile.TemporaryDirectory() as tmp:
            src=Path(tmp)/"frame.png"
            Image.new("RGB",(360,640),"#284b5f").save(src)
            result=perform(good,Path(tmp)/"output",images=[src])
            self.assertEqual(result["technicalStatus"],"DECLARED_LAYOUT_CLEAR")
            self.assertTrue((Path(tmp)/"output/phone-preview-00.jpg").is_file())
            self.assertTrue((Path(tmp)/"output/phone-report.json").is_file())
        with self.assertRaises(ValueError):
            audit({"schemaVersion":1,"subjects":[{"bounds":[.9,.2,.4,.5]}]})

    def test_offline_portal_build_and_truthful_briefs(self):
        with tempfile.TemporaryDirectory() as tmp:
            catalogue=Path(tmp)/"site"
            report=build(ROOT,catalogue,{"runs":[],"prs":[],"issues":[]})
            self.assertGreaterEqual(report["projects"],2)
            self.assertTrue((catalogue/"viewer/index.html").is_file())
            self.assertTrue((catalogue/"viewer/viewer.mjs").is_file())
            body=(catalogue/"dashboard/index.html").read_text()
            self.assertIn("snapshot",body.lower())
            self.assertIn("Turbocharger",body)
            self.assertIn("No registered composition",body)
            self.assertEqual(json.loads((catalogue/"dashboard/snapshot.json").read_text())["repo"],
                             "YunRah2103/Remotion-gpt-chat")
        list_briefs=projects(ROOT)
        self.assertTrue(any(x["slug"]=="abs-001" and not x["registered"] for x in list_briefs))

    def test_portal_escapes_external_issue_titles(self):
        data={"runs":[{"name":"<script>alert(1)</script>","conclusion":"success",
                       "html_url":"https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/5"}],
              "prs":[],"issues":[]}
        with tempfile.TemporaryDirectory() as tmp:
            build(ROOT,tmp,data)
            markup=(Path(tmp)/"dashboard/index.html").read_text()
            self.assertIn("&lt;script&gt;",markup)
            self.assertNotIn("<script>alert(1)</script>",markup)

if __name__=="__main__":unittest.main()
