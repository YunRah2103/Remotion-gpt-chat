import numpy as np, wave
SR=48000; D=21.5; N=int(SR*D); t=np.arange(N)/SR
rng=np.random.default_rng(5)
def rd(p):
    w=wave.open(p); return np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).reshape(-1,w.getnchannels()).astype(float)/32768
def ss(a,b,x):
    u=np.clip((x-a)/(b-a),0,1); return u*u*(3-2*u)
def bp(x,lo,hi):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); m=((f>lo)&(f<hi)).astype(float)
    m=np.convolve(m,np.hanning(61)/np.hanning(61).sum(),'same'); return np.fft.irfft(X*m,len(x))
def noise(lo,hi): n=bp(rng.standard_normal(N),lo,hi); return n/np.abs(n).max()
car=rd('car.wav'); a=int(6.0*SR); eng=car[a:a+N]
eng=eng/np.abs(eng).max()
eng*=ss(0,0.12,t)[:,None]*(1-ss(19.6,21.3,t))[:,None]
# real recording as the engine; light wind bed and two passing whooshes only
wind=noise(300,4000)*(0.05+0.10*ss(0,4,t)+0.08*np.exp(-((t-9.8)/1.5)**2))*(1-ss(19.6,21.3,t))
def whoosh(t0,w=0.4): return noise(500,6000)*np.exp(-((t-t0)/w)**2)
wsh=whoosh(0.8)*0.35+whoosh(19.35)*0.4
pan=lambda t0:0.5+0.5*np.tanh((t-t0)*5)
def st(x,p=0.5): return np.stack([x*np.sqrt(1-p),x*np.sqrt(p)],1)
bed=eng*0.75+st(wind)+st(wsh*(t<5),pan(0.8))+st(wsh*(t>5),pan(19.35))
v=rd('voice.wav')[:,0]; voice=np.zeros(N); o=int(0.3*SR); voice[o:o+len(v)]=v[:N-o]
k=int(0.15*SR); sm=np.convolve(np.abs(voice),np.ones(k)/k,'same'); duck=1-0.5*np.clip(sm/0.07,0,1)
mix=bed*duck[:,None]*0.9+np.stack([voice,voice],1)*1.15
mix=np.tanh(mix*1.05)*0.95
w=wave.open('mix2.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix*32767).astype(np.int16).tobytes()); w.close()
print('ok')
