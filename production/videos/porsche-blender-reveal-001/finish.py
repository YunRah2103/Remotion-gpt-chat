"""Encode the native frames and preserve the supplied reference AAC packets."""
import argparse
import base64
import hashlib
import json
import subprocess
from pathlib import Path

def run(*args):
    return subprocess.check_output(args, text=True)

def packets(path):
    data = json.loads(run('ffprobe','-v','error','-select_streams','a:0',
                         '-show_packets','-show_data_hash','sha256','-of','json',str(path)))
    return [p['data_hash'] for p in data['packets']]

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--frames',required=True)
    p.add_argument('--audio',required=True)
    p.add_argument('--out',required=True)
    a=p.parse_args()
    out=Path(a.out); out.mkdir(parents=True,exist_ok=True)
    frames=Path(a.frames)
    for f in range(479):
        assert (frames/('frame_%04d.png'%f)).is_file(),f
    movie=out/'YUNEX_PORSCHE_BLENDER_REVEAL_1080P.mp4'
    visual=out/'visual-only.mp4'
    vf="drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='BUILT IN BLENDER':fontsize=27:fontcolor=white@0.85:x=(w-tw)/2:y=220:enable='lt(n,214)',drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='YUNEX':fontsize=19:fontcolor=white@0.6:x=(w-tw)/2:y=h-260,scale=in_range=full:out_range=tv:out_color_matrix=bt709"
    run('ffmpeg','-v','error','-y','-framerate','30','-start_number','0',
        '-i',str(frames/'frame_%04d.png'),
        '-frames:v','479','-vf',vf,
        '-c:v','libx264','-preset','slow','-crf','16','-pix_fmt','yuv420p',
        '-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709',
        '-an','-movflags','+faststart',str(visual))
    # Separate mux reads every AAC packet; the reference audio ends 11ms after its picture.
    run('ffmpeg','-v','error','-y','-i',str(visual),'-i',a.audio,
        '-map','0:v:0','-map','1:a:0','-c','copy','-movflags','+faststart',str(movie))
    visual.unlink()
    data=json.loads(run('ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(movie)))
    v=next(x for x in data['streams'] if x['codec_type']=='video')
    assert (v['width'],v['height'],v['avg_frame_rate'],v['nb_read_frames'])==(1080,1920,'30/1','479'),v
    assert packets(a.audio)==packets(movie),'audio packet mismatch'
    run('ffmpeg','-v','error','-xerror','-i',str(movie),'-f','null','-')
    report={'status':'TECHNICAL_PASS','width':1080,'height':1920,'fps':30,'frames':479,
            'reveal_frame':214,'audio':'original AAC copied; every audio packet SHA256 identical',
            'full_decode':'passed','sha256':hashlib.sha256(movie.read_bytes()).hexdigest(),
            'visual_review':'required independently of technical checks'}
    (out/'technical-qa.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report,indent=2))

if __name__=='__main__':
    main()
