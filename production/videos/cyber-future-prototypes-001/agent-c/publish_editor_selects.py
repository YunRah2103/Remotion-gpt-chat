#!/usr/bin/env python3
"""Agent C: derive human-curated editor selections from verified consolidated footage ZIP.
Never change source frames or conflate the photographed 2025 R5 with the 2022 CGI-like show film.
"""
import hashlib,json,zipfile
from pathlib import Path

IN=Path("out/CYBER-FUTURE-001-FOOTAGE-C.zip")
OUT=Path("out/CYBER-FUTURE-001-C-FRANCE-EDITOR-SELECTS.zip")
BASE="corsica_physical_2025/"
CHOICES={
5:("blue-red car frontal on real mountain road","hero_candidate","moving"),
6:("coast road high aerial moving car","support","moving"),
7:("yellow-black prototype low frontal rolling hero","hero_candidate","moving"),
8:("yellow-black prototype frontal mountain road","hero_candidate","moving"),
12:("blue-red car moving extreme side and wheel detail","support","moving"),
13:("blue-red car harbour road overhead","support","moving"),
14:("sunset wide aerial moving car","support","moving"),
15:("blue-red car accelerating side-on","hero_candidate","moving"),
16:("blue-red prototype golden-hour turning car","hero_candidate","moving"),
18:("yellow-black prototype close frontal beauty view","support","beauty"),
19:("blue-red prototype golden-hour portrait","support","beauty"),
}
def digest(data):return hashlib.sha256(data).hexdigest()
def main():
    assert IN.is_file(),f"Required verified source ZIP missing: {IN}"
    OUT.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(IN) as src,zipfile.ZipFile(OUT,"w",zipfile.ZIP_STORED,allowZip64=True) as dst:
        assert src.testzip() is None
        detailed=json.loads(src.read(BASE+"manifest.json"))
        indexed={int(Path(x["file"]).stem.split("_")[-1]):x for x in detailed}
        records=[]
        original=BASE+"originals/renault_r5_turbo_3e_real_corsica_2025_original.mp4"
        raw=src.read(original)
        assert digest(raw)=="edf970e4b3b6d407b4e84e85cc130ddf3c8b16aee8166da90735a57c6299f6f5"
        dst.writestr("originals/renault_r5_turbo_3e_2025_corsica_original.mp4",raw)
        for idx,(label,tier,motion) in CHOICES.items():
            assert idx in indexed,f"Missing distinct original-shot cut {idx}"
            candidate=indexed[idx]
            old=BASE+candidate["file"]
            data=src.read(old)
            assert digest(data)==candidate["clip_sha256"],idx
            dest=f"clips/C{idx:02d}_{motion}_renault_r5_turbo_3e_2025.mp4"
            dst.writestr(dest,data)
            frames=[]
            for p in range(1,4):
                oldframe=BASE+f"frames/R5_CORSICA_REAL_{idx:02d}_frame{p}.jpg"
                newframe=f"contact_frames/C{idx:02d}_f{p}.jpg"
                dst.writestr(newframe,src.read(oldframe))
                frames.append(newframe)
            records.append({
               "file":dest,"vehicle":"Renault 5 Turbo 3E physical prototypes 2025 (Corsica)",
               "original_source":"https://www.auto-medienportal.net/video/load/original/3469/",
               "source_page":"https://www.auto-medienportal.net/artikel/detail/68630",
               "source_sha256":digest(raw),"clip_sha256":digest(data),
               "original_in":candidate["source_in"],"original_out":candidate["source_out"],
               "resolution":"1920x1080","fps":25,
               "description":label,"motion":motion,"editor_tier":tier,
               "human_visual_review":"appears physical-car photographic footage, inspected all contact frames",
               "rights":"publication and modification permissions NOT independently confirmed",
               "contact_frames":frames
            })
        assert len(records)==11
        dst.writestr("manifest.json",json.dumps(records,indent=2))
        dst.writestr("QA_NOTES.md",
          "# Agent C / French footage — manually curated editor picks\n\n"+
          "Eleven different camera shots from ONE Renault 5 Turbo 3E 2025 Corsica original: 9 moving shots, 2 beauty/support views. "+
          "All are native 1920x1080 25fps. The complete original publisher video is included. "+
          "Original and extracted clips are byte-for-byte unchanged from the verified archive and SHA-256 checked. "+
          "Visually inspected contact frames indicate physical prototypes outdoors; check final footage before commercial use. "+
          "Editorial reuse rights have NOT been established. This is not two-model contract PASS.\n\n"+
          "The 2025 photographed prototype is distinct from the 2022 R5 Turbo 3E concept. "+
          "CGI-suspect early Renault promo material is excluded.\n")
    with zipfile.ZipFile(OUT) as z:
        assert z.testzip() is None
    print("CURATED_REAL_FRENCH_CLIPS",len(records),"ZIP_BYTES",OUT.stat().st_size,"SHA256",digest(OUT.read_bytes()),flush=True)
if __name__=="__main__":main()
