"""Strict no-fake-delivery tests for the SINGLE FINAL ZIP builder."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("porsche_package",ROOT/"build_all_30_zip.py")
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

GENERATIONS=module.GENERATIONS

def good_plan():
    cuts=[]
    shots=[]
    total=0
    for slot,gen in enumerate(GENERATIONS,1):
        frames=14+(slot%5)
        cuts.append({"slot":slot,"generation":gen,"startFrame":total,
                     "endFrame":total+frames-1,"durationFrames":frames})
        total+=frames
        shots.append({
            "slot":slot,"generation":gen,"sourceId":f"source{slot}",
            "sourceUrl":f"https://example.org/{slot}.mp4","originCreator":"fixture",
            "localPath":f"source-{slot:02}.mp4","shotKey":f"unique-scene-{slot}",
            "independentCameraSetupId":f"unique-setup-{slot}","angleAndMotion":"test tracking",
            "actualTurboIdentityEvidence":"synthetic test only", "sha256":f"{slot:064x}",
            "sourceLicenseStatus":"unknown","width":3840,"height":2160,"fps":25.0,
            "focusX":0.5,"focusY":0.5,"sourceInSeconds":1.0,"sourceOutSeconds":3.0,
            "verifiedMovingVideo":True,"uniqueAngleVerified":True,
            "verifiedTurboCoupe":True,"cropManuallyReviewed":True,
            "humanReviewer":"synthetic fixture","reviewedAt":"2026-01-01",
            "handleFrames":2
        })
    # Exactly 510 frames across 30 slots.
    delta=510-total
    cuts[-1]["durationFrames"]+=delta
    cuts[-1]["endFrame"]+=delta
    return {"schemaVersion":1,"shots":shots},{"output":{"frames":510},"cuts":cuts}

class PackageGateTests(unittest.TestCase):
    def test_exact_30_slot_plan_is_valid_only_with_synthetic_signed_data(self):
        src,bm=good_plan()
        q=module.check_manifest(src,bm)
        self.assertEqual(q["slots"],30)
        self.assertEqual(q["frames"],510)

    def test_reject_blank_planning_template(self):
        src,bm=good_plan()
        src["shots"][5]["localPath"]=None
        with self.assertRaisesRegex(ValueError,"missing localPath"):
            module.check_manifest(src,bm)

    def test_reject_duplicate_camera_even_if_different_shot_key(self):
        src,bm=good_plan()
        src["shots"][12]["independentCameraSetupId"]=src["shots"][11]["independentCameraSetupId"]
        with self.assertRaisesRegex(ValueError,"reused or unknown independent camera"):
            module.check_manifest(src,bm)

    def test_reject_same_source_overlapping_ranges(self):
        src,bm=good_plan()
        src["shots"][3]["sha256"]=src["shots"][2]["sha256"]
        with self.assertRaisesRegex(ValueError,"overlap"):
            module.check_manifest(src,bm)

    def test_reject_unverified_model_and_cropping(self):
        src,bm=good_plan()
        src["shots"][7]["verifiedTurboCoupe"]=False
        with self.assertRaisesRegex(ValueError,"verifiedTurboCoupe"):
            module.check_manifest(src,bm)
        src,bm=good_plan()
        src["shots"][7]["cropManuallyReviewed"]=False
        with self.assertRaisesRegex(ValueError,"cropManuallyReviewed"):
            module.check_manifest(src,bm)

    def test_reject_invented_license(self):
        src,bm=good_plan()
        src["shots"][1]["sourceLicenseStatus"]="cleared"
        with self.assertRaisesRegex(ValueError,"licence"):
            module.check_manifest(src,bm)

    def test_reject_wrong_chronology(self):
        src,bm=good_plan()
        src["shots"][20]["generation"]="992"
        with self.assertRaisesRegex(ValueError,"generation"):
            module.check_manifest(src,bm)

    def test_crops_native_4k_to_9_16_and_avoids_artificial_native_claim(self):
        p={"width":3840,"height":2160}
        self.assertIn("crop=1214:2160",module.crop_filter(p,.5,.5))
        self.assertIn("scale=1080:1920",module.crop_filter(p,.5,.5))

    def test_reject_missing_media_inside_source_root(self):
        with tempfile.TemporaryDirectory() as root:
            with self.assertRaises(ValueError):
                module.safe_path(Path(root),"../fake.mp4")
            with self.assertRaises(ValueError):
                module.safe_path(Path(root),"missing.mp4")

    def test_final_zip_is_single_named_archive(self):
        self.assertEqual(module.TARGET_ZIP,"PORSCHE_911_TURBO_EVOLUTION_ALL_30_CLIPS_1080P.zip")

if __name__=="__main__":
    unittest.main()
