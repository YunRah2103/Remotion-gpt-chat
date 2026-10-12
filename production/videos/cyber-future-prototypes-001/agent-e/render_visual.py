#!/usr/bin/env python3
"""YUNEX CYBER//FUTURE Agent E: actual A/B/C/D footage, FFmpeg 632-frame renderer.
Source SHA-256 checked before use. No synthetic car animations, no fake HDR.
Original user soundtrack is NOT in git; Agent F does final music/sound mux.
"""
import argparse,hashlib,json,pathlib,subprocess
R=pathlib.Path(__file__).resolve().parent
def run(argv):
 p=subprocess.run(argv,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 if p.returncode:raise RuntimeError(" ".join(argv)+"\n"+p.stderr[-3500:])
 return p.stdout
def filt(s,w,h):
 prefix="crop=1920:796:0:142," if s["source"].startswith("A/clips/") else ""
 grade="eq=contrast=1.07:saturation=1.10:gamma=0.98,setsar=1"
 if s["reframe"]=="full":
  return prefix+f"scale={w}:{h}:force_original_aspect_ratio=increase:flags=lanczos,crop={w}:{h},"+grade+",format=yuv420p"
 fw=round(w*1.08/2)*2
 bw,bh=max(160,w//4),max(280,h//4)
 bg=f"scale={bw}:{bh}:force_original_aspect_ratio=increase,crop={bw}:{bh},boxblur=18:1,scale={w}:{h},eq=brightness=-0.11:contrast=1.15:saturation=0.82,setsar=1"
 fg=f"scale={fw}:-2:flags=lanczos,crop={w}:ih:(iw-{w})/2:0,"+grade
 return prefix+f"split=2[b][f];[b]{bg}[back];[f]{fg}[front];[back][front]overlay=(W-w)/2:(H-h)/2:shortest=1,format=yuv420p"
def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("--size",choices=["proof","master"],default="master")
 ap.add_argument("--audio",default=None)
 ap.add_argument("--out",default=None)
 a=ap.parse_args()
 w,h=(540,960) if a.size=="proof" else (1080,1920)
 data=json.loads((R/"shotmap.json").read_text())
 assert data["fps"]==30 and data["duration_frames"]==632 and len(data["scenes"])==16
 t=R/"_render_tmp";t.mkdir(parents=True,exist_ok=True)
 for s in data["scenes"]:
  source=R/"assets"/s["source"]
  if not source.is_file():raise FileNotFoundError(source)
  if hashlib.sha256(source.read_bytes()).hexdigest()!=s["sha256"]:raise ValueError("SOURCE SHA-256 FAIL: "+str(source))
  output=t/f"{s['order']:02d}.mp4"
  filters=filt(s,w,h)+f",setpts=(PTS-STARTPTS)/{s['source_speed']},fps=30,trim=end_frame={s['frames']},setpts=N/(30*TB)"
  print(s["order"],s["model"],s["frames"],s["reframe"],flush=True)
  run(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y","-ss",str(s["source_seek_seconds"]),"-i",str(source),"-an","-filter_complex","[0:v]"+filters+"[v]","-map","[v]","-r","30","-frames:v",str(s["frames"]),"-c:v","libx264","-preset","veryfast" if a.size=="master" else "ultrafast","-crf","18" if a.size=="master" else "19","-pix_fmt","yuv420p",str(output)])
  count=json.loads(run(["ffprobe","-v","error","-count_frames","-select_streams","v:0","-show_entries","stream=nb_read_frames","-of","json",str(output)]))["streams"][0]["nb_read_frames"]
  if int(count)!=s["frames"]:raise RuntimeError("BAD SHOT FRAME COUNT "+str(s["order"]))
 (t/"concat.txt").write_text("".join("file '"+f"{s['order']:02d}.mp4"+"'"+"\n" for s in data["scenes"]))
 output=pathlib.Path(a.out or str(R/"CYBER-FUTURE-001-E-VISUAL.mp4"))
 cmd=["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y","-f","concat","-safe","0","-i",str(t/"concat.txt")]
 if a.audio:
  source=pathlib.Path(a.audio)
  if hashlib.sha256(source.read_bytes()).hexdigest()!=data["audio_sha256"]:raise ValueError("Wrong user music, refusing replacement")
  cmd+=["-i",str(source),"-map","0:v:0","-map","1:a:0","-af","aresample=48000:async=1","-c:a","aac","-b:a","256k"]
 else:cmd+=["-map","0:v:0","-an"]
 run(cmd+["-c:v","copy","-movflags","+faststart",str(output)])
 probe=json.loads(run(["ffprobe","-v","error","-count_frames","-show_entries","format=duration,size:stream=codec_name,width,height,r_frame_rate,nb_read_frames","-of","json",str(output)]))
 if not any(s.get("codec_name")=="h264" and int(s.get("nb_read_frames",0))==632 for s in probe["streams"]):raise RuntimeError("FINAL FRAME COUNT FAIL")
 print("PASS:",output,"SHA256",hashlib.sha256(output.read_bytes()).hexdigest(),json.dumps(probe),flush=True)
if __name__=="__main__":main()
