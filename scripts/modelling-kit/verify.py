"""Native preview decode, metadata and sampled movement evidence (not a visual approval)."""
import hashlib,json,pathlib,subprocess,sys
import numpy as np
root=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'out/modelling-kit-v2')
reports=[]
for path in sorted(root.glob('*.mp4')):
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]))
    video=next(s for s in probe['streams'] if s['codec_type']=='video')
    duration=float(probe['format']['duration']);portrait='Portrait' in path.name
    assert (video['width'],video['height'])==((540,960) if portrait else (960,540))
    assert video['codec_name']=='h264' and video['pix_fmt']=='yuv420p'
    expected=9 if path.stem.startswith('KitA') else 6
    assert abs(duration-expected)<.05 and video['r_frame_rate']=='12/1'
    subprocess.run(['ffmpeg','-v','error','-i',str(path),'-f','null','-'],check=True)
    data=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-vf','fps=2,crop=iw*.8:ih*.60:iw*.1:ih*.18,scale=96:54,format=gray','-f','rawvideo','-'])
    frames=np.frombuffer(data,dtype=np.uint8).reshape(-1,54,96).astype(float)
    differences=np.abs(np.diff(frames,axis=0)).mean(axis=(1,2))
    assert np.count_nonzero(differences>.1)>=len(differences)*.8,(path,differences)
    reports.append(dict(file=path.name,width=video['width'],height=video['height'],fps=12,duration=duration,frames=int(video['nb_frames']),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),sampleMeanAbsoluteDifferences=differences.tolist(),fullDecode=True))
assert reports,'No MP4 files were found'
(root/'video-qa.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports,indent=2))
