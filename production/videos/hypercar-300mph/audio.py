import numpy as np, subprocess, wave
SR=48000; D=21.5; N=int(SR*D); t=np.arange(N)/SR
rng=np.random.default_rng(3)
def ss(a,b,x):
    u=np.clip((x-a)/(b-a),0,1); return u*u*(3-2*u)
def bp(x,lo,hi):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); m=((f>lo)&(f<hi)).astype(float)
    m=np.convolve(m,np.hanning(61)/np.hanning(61).sum(),'same'); return np.fft.irfft(X*m,len(x))
def noise(lo,hi): n=bp(rng.standard_normal(N),lo,hi); return n/np.abs(n).max()
# doppler pitch factors at passes
def dop(t0,w=0.35): return 1+0.28*(1-ss(t0-w,t0+w,t))*1 - 0.28*ss(t0-w,t0+w,t)
pitch=dop(0.8)*np.where(t>5,1,1)
pitch=np.where(t<4,dop(0.8),dop(19.35)); 
pitch=np.where(t>=4,dop(19.35),pitch)
rpm=(0.78+0.22*ss(0.4,3.6,t))*(1+0.04*np.sin(t*1.7))
f0=(70+110*rpm)*pitch
ph=2*np.pi*np.cumsum(f0)/SR
eng=sum((1/k**0.8)*np.sin(k*ph+k) for k in range(1,14))+0.4*np.sign(np.sin(ph/2))*0.3
eng=eng*(0.8+0.2*np.sin(ph/2+0.3))
eng=np.tanh(eng*0.9)
whine=np.sin(2*np.pi*np.cumsum(2400+2200*rpm*pitch)/SR)*0.10+np.sin(2*np.pi*np.cumsum(5100*rpm*pitch)/SR)*0.04
sub=np.sin(2*np.pi*np.cumsum(38+40*rpm)/SR)*0.5
env=ss(0,0.25,t)*(1-ss(19.4,20.9,t))
engine=(eng*0.5+whine+sub)*env
wind=noise(200,5000)*(0.15+0.55*ss(0,4,t)+0.35*np.exp(-((t-9.8)/1.5)**2))*(1-ss(19.6,21.3,t))*0.5+noise(1500,9000)*0.1*ss(0,4,t)*(1-ss(19.6,21,t))
tyre=noise(60,400)*0.45*(0.4+0.6*np.exp(-((t-7.2)/1.6)**2))*(1-ss(19.4,20.5,t))*ss(0,1,t)+np.sin(2*np.pi*np.cumsum(260*rpm)/SR)*0.05
# whoosh passes
def whoosh(t0,lo=400,hi=7000,w=0.45):
    return noise(lo,hi)*np.exp(-((t-t0)/w)**2)
passes=whoosh(0.8)*1.1+whoosh(19.35)*1.2
# riser before finale and hits
riser=noise(500,9000)*ss(14.6,15.75,t)*(t<15.8)*0.5
def hit(t0,f=48,dur=0.7,amp=1.0):
    x=np.where(t>=t0,np.exp(-(t-t0)/dur*5),0)
    return (np.sin(2*np.pi*f*(t-t0)*np.exp(-(t-t0)*3))*x+0.3*noise(40,300)*x)*amp
hits=hit(0.0,60,0.5,0.8)+hit(5.6,50,0.5)+hit(8.75,50,0.5)+hit(11.55,45,0.6)+hit(15.75,40,1.0,1.2)+hit(19.9,38,1.6,1.3)
# stereo pans for passes
pan1=0.5+0.5*np.tanh((t-0.8)*5)
pan2=0.5+0.5*np.tanh((t-19.35)*5)
def st(x,pan=0.5): return np.stack([x*np.sqrt(1-pan),x*np.sqrt(pan)],1)
bed=st(engine*1.0)+st(wind)+st(tyre)+st(passes*(t<5),pan1)+st(passes*(t>5),pan2)+st(riser)+st(hits)
# load narration
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','/root/.claude/uploads/447cd6e3-4400-5cac-ba9a-75ba759026e4/f00f4495-openai-fm-alloy-audio_1.mp3','-ar',str(SR),'-ac','1','voice.wav'])
w=wave.open('voice.wav'); v=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16)/32768.0
voice=np.zeros(N); o=int(0.3*SR); voice[o:o+len(v)]=v[:N-o]
# sidechain duck
a=np.abs(voice); k=int(0.15*SR); sm=np.convolve(a,np.ones(k)/k,'same'); duck=1-0.45*np.clip(sm/0.08,0,1)
bed=bed*duck[:,None]
bed/=np.abs(bed).max(); bed*=0.55
# gentle low-pass smoothing not needed; mix
mix=bed+np.stack([voice,voice],1)*1.1
mix=np.tanh(mix*1.1)*0.95
pcm=(mix*32767).astype(np.int16)
w=wave.open('mix.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok')
