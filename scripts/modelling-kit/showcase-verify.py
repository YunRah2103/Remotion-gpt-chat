"""Native showcase media evidence; visual approval remains a separate explicit decision."""
import hashlib,json,pathlib,subprocess,sys
folder=pathlib.Path(sys.argv[1]);video=folder/'proof.mp4'
plan=json.loads((folder/'plan.json').read_text());contract=json.loads((folder/'source-contract.json').read_text())
sha=hashlib.sha256(video.read_bytes()).hexdigest();assert sha==contract['sha256'],'Video identity mismatch'
meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]));v=next(s for s in meta['streams'] if s['codec_type']=='video')
assert (v['width'],v['height'])==(1080,1920) and v['r_frame_rate']=='30/1'
assert v['codec_name']=='h264' and v['pix_fmt']=='yuv420p'
assert int(v['nb_frames'])==plan['frames'] and abs(float(meta['format']['duration'])-plan['frames']/30)<.05
assert not any(s['codec_type']=='audio' for s in meta['streams']),'Silent proof contract'
subprocess.run(['ffmpeg','-v','error','-i',str(video),'-f','null','-'],check=True)
md5=subprocess.check_output(['ffmpeg','-v','error','-i',str(video),'-vf','crop=iw*.8:ih*.6:iw*.1:ih*.18,scale=160:160','-f','framemd5','-']).decode()
hashes=[line.rsplit(',',1)[-1].strip() for line in md5.splitlines() if line and not line.startswith('#')]
assert len(hashes)==plan['frames']
shots=[]
for shot in plan['shots']:
 a,b=shot['range'];distinct=len(set(hashes[a:b+1]));assert distinct>=(b-a+1)*.95,(shot['id'],'Insufficient moving scene content')
 shots.append({'id':shot['id'],'frames':b-a+1,'uniqueSceneFrames':distinct})
report={'revision':contract['revision'],'sourceFingerprint':contract['source'],'sha256':sha,'dimensions':[1080,1920],'fps':30,'frames':len(hashes),'duration':plan['frames']/30,'fullDecode':'pass','audio':'silent','shots':shots,'automated':'pass','render':'pass','visual':'pending actual moving review'}
(folder/'video-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
