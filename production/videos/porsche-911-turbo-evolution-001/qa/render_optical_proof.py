#!/usr/bin/env python3
"""Native encoded A/B moving-image proof, deliberately SYNTHETIC, not Porsche media.
Requirements: Python cv2, numpy, ffmpeg and ffprobe. Output 720x1280/30/112 frames.
Never mark this proof as authentic footage/Remotion final footage validation.
"""
import argparse,hashlib,json,subprocess
from pathlib import Path
import cv2
import numpy as np
CHAPTERS=[('930','964',67,'micro-punch',3,.42),
          ('993','996',205,'match-shift',3,.38),
          ('997','991',343,'cut',0,0),
          ('991','992',429,'micro-punch',2,.32)]
W,H=360,1280

def scene(gen,local,chapter):
    y,x=np.indices((H,W),dtype=np.int16)
    pal=[(38,54,70),(70,58,48),(37,70,78),(57,48,80),(65,66,62),(32,62,85),(32,75,105)]
    index=['930','964','993','996','997','991','992'].index(gen)
    b,g,r=pal[index]
    frame=np.empty((H,W,3),dtype=np.uint8)
    fine=(x*7+y*3+local*17+chapter*22)%91
    for c,v in enumerate((b,g,r)):frame[:,:,c]=np.clip(v+fine//9+y*12//H,0,255)
    center=195+round(np.sin(local*.21+chapter)*32)+(local*5)%17
    cy=680+int(np.sin(local*.12)*28)
    for q in range(-6,7):
        xx=center+q*16
        cv2.line(frame,(xx,cy-170),(xx-20,cy+240),(30+index*7,110+index*4,170),1,cv2.LINE_AA)
    cv2.ellipse(frame,(center,cy),(145,184),3,0,360,(210,220,228),3,cv2.LINE_AA)
    cv2.rectangle(frame,(max(0,center-137),cy+60),(min(W-1,center+135),cy+93),(12,16,22),-1)
    for q in range(18):
        pos=(q*W//18+local*11)%W
        cv2.line(frame,(pos,cy+250),(min(W-1,pos+14),cy+250),(208,199,175),2)
    cv2.putText(frame,gen,(20,170),cv2.FONT_HERSHEY_SIMPLEX,1.05,(248,248,248),2,cv2.LINE_AA)
    cv2.putText(frame,'SYNTHETIC / NOT PORSCHE',(18,1160),cv2.FONT_HERSHEY_SIMPLEX,.49,(235,236,241),1,cv2.LINE_AA)
    return frame

def effect(frame,style,age,frames,strength):
    if age<0 or age>=frames:return frame
    t=(1-age/frames)**2*strength
    if style=='micro-punch':
        matrix=cv2.getRotationMatrix2D((W/2,H/2),0,1+.055*t)
    elif style=='match-shift':
        shift=round(-24*t)
        matrix=cv2.getRotationMatrix2D((W/2,H/2),0,1+abs(shift)/540)
        matrix[0,2]+=shift
    else:return frame
    return cv2.warpAffine(frame,matrix,(W,H),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT_101)

def main():
    p=argparse.ArgumentParser();p.add_argument('--out',default='out/porsche-agent-c-proof');args=p.parse_args()
    dest=Path(args.out);dest.mkdir(parents=True,exist_ok=True)
    mp4=dest/'C_AB_SYNTHETIC_TRANSITION_PROOF.mp4'
    proc=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y',
      '-f','rawvideo','-pixel_format','bgr24','-video_size','720x1280','-framerate','30',
      '-i','-','-an','-c:v','libx264','-preset','medium','-crf','15','-pix_fmt','yuv420p',
      '-movflags','+faststart',str(mp4)],stdin=subprocess.PIPE,stderr=subprocess.PIPE)
    proof=[]
    try:
        for chapter,(before,after,start,style,frames,strength) in enumerate(CHAPTERS):
            for t in range(28):
                age=t-9;source=scene(before if age<0 else after,t,chapter)
                clean=source.copy();edited=effect(source,style,age,frames,strength).copy()
                cv2.putText(clean,'CLEAN CUT',(18,75),cv2.FONT_HERSHEY_SIMPLEX,.7,(250,250,250),2,cv2.LINE_AA)
                cv2.putText(edited,style.upper(),(18,75),cv2.FONT_HERSHEY_SIMPLEX,.64,(250,250,250),2,cv2.LINE_AA)
                both=np.concatenate([clean,edited],axis=1)
                cv2.line(both,(W,0),(W,H),(244,244,244),2)
                if age in (-1,0,1,3):
                    snap=dest/f'frame-{start}{age:+d}.png'
                    if not cv2.imwrite(str(snap),both):raise RuntimeError('PNG proof failed')
                    proof.append(snap.name)
                proc.stdin.write(both.tobytes())
    finally:
        proc.stdin.close();error=proc.stderr.read().decode(errors='replace')
        code=proc.wait()
    if code:raise RuntimeError(error)
    stream=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0',
      '-show_entries','stream=width,height,nb_frames,r_frame_rate,codec_name',
      '-of','json',str(mp4)]))['streams'][0]
    assert (stream['width'],stream['height'],stream['r_frame_rate'],int(stream['nb_frames']))==(720,1280,'30/1',112)
    subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(mp4),'-f','null','-'],check=True)
    report={'status':'PASS_TECHNICAL_SYNTHETIC_ONLY','codec':stream['codec_name'],
      'size':[720,1280],'fps':30,'frames':112,'durationSeconds':112/30,'fullDecode':'PASS',
      'sha256':hashlib.sha256(mp4.read_bytes()).hexdigest(),
      'clipsRepresentRealPorsches':False,'nativeRemotionProof':False,
      'transitionChapterFrameStarts':[67,205,343,429],'captured':proof,
      'limitations':'Synthetic moving patterns, not licensed real Porsche footage or final film. Agent D must re-review actual 30 shots at full native resolution.'}
    (dest/'PROOF_QA.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
if __name__=='__main__':main()
