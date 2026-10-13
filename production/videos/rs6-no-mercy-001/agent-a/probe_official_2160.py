#!/usr/bin/env python3
"""Metadata-only official Audi source probe. Saves NO third-party video files."""
import json, pathlib, subprocess
ROOT=pathlib.Path('/tmp/rs6-out'); ROOT.mkdir(parents=True,exist_ok=True)
SOURCE='https://delivery-p123922-e1240369.adobeaemcloud.com/adobe/assets/urn:aaid:aem:99e86001-9bce-465b-b3ea-af573f2f3c0a/renditions/video_2160p.mp4/as/audi-rs-6-until-2025-daytona-grey-footage-on-location_2160p.mp4?accept-experimental=1'
def run(args,timeout):
    p=subprocess.run(args,text=True,capture_output=True,timeout=timeout)
    return {'exit_code':p.returncode,'stdout':p.stdout[-5500:],'stderr':p.stderr[-1800:]}
report={'source_page':'https://www.audi.com/en/videos/video/audi-rs-6-until-2025-daytona-grey-footage-on-location-4874','media_url':SOURCE,'rights':'not cleared for republishing','contains_source_video':False}
report['range_check']=run(['curl','--fail','--silent','--show-error','--location','--range','0-63','--max-time','25','--dump-header','/dev/stderr','--output','/dev/null',SOURCE],35)
report['ffprobe']=run(['ffprobe','-v','error','-rw_timeout','25000000','-analyzeduration','2000000','-probesize','2000000','-show_entries','format=duration,size,bit_rate:stream=codec_type,codec_name,width,height,avg_frame_rate','-of','json',SOURCE],95)
try:
    info=json.loads(report['ffprobe']['stdout'])
    v=next(s for s in info['streams'] if s.get('codec_type')=='video')
    report['detected_video']={k:v.get(k) for k in ('codec_name','width','height','avg_frame_rate')}
    report['resolution_gate']= v.get('width',0)>=1920 and v.get('height',0)>=1080
except Exception as exc: report['metadata_error']=str(exc)
(ROOT/'official_2160_diagnostics.json').write_text(json.dumps(report,indent=2))
print(json.dumps({k:report.get(k) for k in ('detected_video','resolution_gate','metadata_error')},indent=2))
