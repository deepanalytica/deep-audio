import { useStudioStore } from '../store.js';
import { PROGRESSIONS, ROOM_SOUNDS } from '../data.js';

const KEY_OFFSETS={C:0,'C#':1,D:2,Eb:3,E:4,F:5,'F#':6,G:7,Ab:8,A:9,Bb:10,B:11};
const MAX_TRACK_BYTES=500*1024*1024;
const RECORDING_TYPES=['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4'];

function recordingExtension(type=''){
  if(type.includes('mp4'))return 'm4a';
  if(type.includes('ogg'))return 'ogg';
  return 'webm';
}

function recordingName(extension){
  const stamp=new Intl.DateTimeFormat('sv-SE',{dateStyle:'short',timeStyle:'medium'}).format(new Date()).replace(/[\s:]/g,'-');
  return `Toma-${stamp}.${extension}`;
}

class StudioAudioEngine{
  constructor(){
    this.ctx=null;this.mix=null;this.convolver=null;this.wet=null;this.master=null;this.comp=null;
    this.timer=null;this.nextTime=0;this.step=0;
    this.backing=null;this.backingSource=null;this.backingUrl=null;
    this.mediaRecorder=null;this.recordingStream=null;this.recordingChunks=[];this.recordingResult=null;
    this.recordingUrl=null;
  }
  async init(){
    if(!this.ctx){
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)throw new Error('Este navegador no ofrece Web Audio. Usa una versión reciente de Chrome, Edge, Firefox o Safari.');
      this.ctx=new AC();
      this.mix=this.ctx.createGain();
      this.convolver=this.ctx.createConvolver();
      this.wet=this.ctx.createGain();
      this.master=this.ctx.createGain();
      this.comp=this.ctx.createDynamicsCompressor();
      this.master.gain.value=.64;
      this.mix.connect(this.master);
      this.mix.connect(this.convolver);
      this.convolver.connect(this.wet);
      this.wet.connect(this.master);
      this.master.connect(this.comp);
      this.comp.connect(this.ctx.destination);
      this.setRoom(useStudioStore.getState().roomSound);
    }
    if(this.ctx.state==='suspended')await this.ctx.resume();
    useStudioStore.getState().setAudioReady(true);
  }
  setRoom(name){
    if(!this.ctx)return;
    const profile=ROOM_SOUNDS.find((r)=>r.name===name)||ROOM_SOUNDS[1];
    const seconds=profile.decay;
    const length=Math.max(1,Math.floor(this.ctx.sampleRate*seconds));
    const impulse=this.ctx.createBuffer(2,length,this.ctx.sampleRate);
    for(let c=0;c<2;c++){
      const d=impulse.getChannelData(c);
      for(let i=0;i<length;i++){
        const t=i/length;
        d[i]=(Math.random()*2-1)*Math.pow(1-t,2.6)*(i<this.ctx.sampleRate*.014?1.25:1);
      }
    }
    this.convolver.buffer=impulse;
    this.wet.gain.setTargetAtTime(profile.wet,this.ctx.currentTime,.03);
  }
  async loadTrack(file){
    if(!file)throw new Error('No se seleccionó ningún archivo.');
    if(file.size>MAX_TRACK_BYTES)throw new Error('La pista supera 500 MB. Elige un archivo más liviano.');
    if(file.type&&!file.type.startsWith('audio/'))throw new Error('El archivo no parece ser audio. Usa WAV, MP3, M4A, FLAC u OGG.');
    await this.init();

    if(this.backing){
      this.backing.pause();
      this.backingSource?.disconnect();
      if(this.backingUrl)URL.revokeObjectURL(this.backingUrl);
    }

    const url=URL.createObjectURL(file);
    const audio=new Audio();
    audio.preload='metadata';
    audio.src=url;
    await new Promise((resolve,reject)=>{
      const timeout=window.setTimeout(()=>reject(new Error('No pudimos leer la pista a tiempo. Prueba otro formato.')),10000);
      audio.addEventListener('loadedmetadata',()=>{window.clearTimeout(timeout);resolve();},{once:true});
      audio.addEventListener('error',()=>{window.clearTimeout(timeout);reject(new Error('El navegador no pudo abrir este formato de audio.'))},{once:true});
    }).catch((error)=>{URL.revokeObjectURL(url);throw error});

    this.backing=audio;
    this.backingUrl=url;
    this.backingSource=this.ctx.createMediaElementSource(audio);
    this.backingSource.connect(this.mix);
    audio.addEventListener('ended',()=>{
      this.pause();
      useStudioStore.getState().notify('La pista llegó al final.','info');
    });
    const track={name:file.name,size:file.size,type:file.type||'audio',duration:Number.isFinite(audio.duration)?audio.duration:0};
    useStudioStore.getState().setTrack(track);
    return track;
  }
  getPositionMs(){return this.backing?this.backing.currentTime*1000:null}
  async startRecording(){
    if(this.mediaRecorder?.state==='recording')return;
    if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){
      throw new Error('La grabación de micrófono no está disponible en este navegador.');
    }
    const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    const mimeType=RECORDING_TYPES.find((type)=>MediaRecorder.isTypeSupported(type));
    const recorder=new MediaRecorder(stream,mimeType?{mimeType}:undefined);
    this.recordingStream=stream;
    this.mediaRecorder=recorder;
    this.recordingChunks=[];
    this.recordingResult=new Promise((resolve,reject)=>{
      recorder.addEventListener('dataavailable',(event)=>{if(event.data.size)this.recordingChunks.push(event.data)});
      recorder.addEventListener('error',(event)=>{
        this.recordingStream?.getTracks().forEach((track)=>track.stop());
        this.recordingStream=null;this.mediaRecorder=null;this.recordingChunks=[];
        reject(event.error||new Error('La grabación se interrumpió.'));
      },{once:true});
      recorder.addEventListener('stop',()=>{
        const type=recorder.mimeType||mimeType||'audio/webm';
        const blob=new Blob(this.recordingChunks,{type});
        if(this.recordingUrl)URL.revokeObjectURL(this.recordingUrl);
        this.recordingUrl=URL.createObjectURL(blob);
        const result={url:this.recordingUrl,name:recordingName(recordingExtension(type)),size:blob.size,type};
        this.recordingStream?.getTracks().forEach((track)=>track.stop());
        this.recordingStream=null;this.mediaRecorder=null;this.recordingChunks=[];
        this.recordingResult=null;
        useStudioStore.getState().setLastRecording(result);
        resolve(result);
      },{once:true});
    });
    recorder.start(250);
  }
  async stopRecording(){
    if(!this.mediaRecorder||this.mediaRecorder.state==='inactive')return null;
    const result=this.recordingResult;
    this.mediaRecorder.stop();
    return result;
  }
  frequency(midi){return 440*Math.pow(2,(midi-69)/12)}
  osc(type,midi,time,duration,gain=.06,cutoff=2200,pan=0){
    const o=this.ctx.createOscillator(),g=this.ctx.createGain(),f=this.ctx.createBiquadFilter(),p=this.ctx.createStereoPanner();
    o.type=type;o.frequency.setValueAtTime(this.frequency(midi),time);
    f.type='lowpass';f.frequency.value=cutoff;f.Q.value=.55;p.pan.value=pan;
    g.gain.setValueAtTime(.0001,time);
    g.gain.exponentialRampToValueAtTime(gain,time+.012);
    g.gain.exponentialRampToValueAtTime(.0001,time+duration);
    o.connect(f);f.connect(g);g.connect(p);p.connect(this.mix);o.start(time);o.stop(time+duration+.04);
  }
  noise(time,duration=.13,gain=.12,highpass=1600,pan=0){
    const len=Math.floor(this.ctx.sampleRate*duration);
    const buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=(Math.random()*2-1);
    const s=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain(),p=this.ctx.createStereoPanner();
    s.buffer=buf;f.type='highpass';f.frequency.value=highpass;p.pan.value=pan;
    g.gain.setValueAtTime(gain,time);g.gain.exponentialRampToValueAtTime(.0001,time+duration);
    s.connect(f);f.connect(g);g.connect(p);p.connect(this.mix);s.start(time);
  }
  kick(time,hard=false){
    const o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type='sine';o.frequency.setValueAtTime(hard?170:135,time);o.frequency.exponentialRampToValueAtTime(46,time+.14);
    g.gain.setValueAtTime(hard?.62:.48,time);g.gain.exponentialRampToValueAtTime(.0001,time+.34);
    o.connect(g);g.connect(this.mix);o.start(time);o.stop(time+.35);
  }
  chordFor(step){
    const s=useStudioStore.getState();
    const p=PROGRESSIONS[s.progression]||PROGRESSIONS['I–V–vi–IV'];
    const degree=p[Math.floor(step/4)%p.length],root=48+(KEY_OFFSETS[s.key]||0)+degree;
    const minor=[2,4,9,11].includes(degree%12);
    return [root,root+(minor?3:4),root+7];
  }
  drums(step,time,preset){
    const rock=preset==='Arena Rock';
    if(step===0||step===8||rock&&[6,14].includes(step))this.kick(time,rock);
    if(step===4||step===12)this.noise(time,.16,rock?.22:.16,900);
    if(step%2===0)this.noise(time,.035,.032,6200,step%4===0?-.18:.18);
  }
  bass(step,time,preset){
    if(step%2)return;
    const root=this.chordFor(step)[0]-12+(step%4===2?12:0);
    this.osc('sawtooth',root,time,.19,.052,preset==='Modern Pick'?980:520,-.12);
  }
  keys(step,time,preset){
    if(step%4)return;
    this.chordFor(step).forEach((n,i)=>this.osc(preset==='Studio Grand'?'sine':'triangle',n+12,time,.58,.026,1500+i*450,(i-1)*.18));
  }
  synth(step,time,preset){
    if(step%2)return;
    const chord=this.chordFor(step),note=chord[(step/2)%3|0]+24;
    this.osc(preset==='FM Glass'?'sine':'square',note,time,.14,.021,preset==='FM Glass'?3300:1400,.22);
  }
  guitar(step,time,preset){
    if(![0,3,6,8,11,14].includes(step))return;
    const chord=this.chordFor(step),note=chord[step%3]+12;
    this.osc(preset==='British Crunch'?'sawtooth':'triangle',note,time,.11,.028,preset==='British Crunch'?1800:2800,.28);
  }
  click(step,time){if(step%4===0)this.osc('sine',step===0?86:82,time,.03,.018,5000,0)}
  schedule(step,time){
    const s=useStudioStore.getState(),a=s.activePlayers,p=s.presets;
    if(a.includes('drummer'))this.drums(step,time,p.drummer);
    if(a.includes('bassist'))this.bass(step,time,p.bassist);
    if(a.includes('keys'))this.keys(step,time,p.keys);
    if(a.includes('synth'))this.synth(step,time,p.synth);
    if(a.includes('guitarist'))this.guitar(step,time,p.guitarist);
    if(s.metronome)this.click(step,time);
  }
  tick(){
    if(!this.ctx||!useStudioStore.getState().playing)return;
    const bpm=Math.max(40,Math.min(240,useStudioStore.getState().bpm||120));
    const stepSeconds=60/bpm/4;
    while(this.nextTime<this.ctx.currentTime+.12){
      this.schedule(this.step,this.nextTime);
      this.nextTime+=stepSeconds;
      this.step=(this.step+1)%16;
    }
  }
  async play(){
    await this.init();
    const s=useStudioStore.getState();
    if(s.playing)return;
    if(this.backing){
      if(this.backing.ended)this.backing.currentTime=0;
      await this.backing.play();
    }
    s.setPlaying(true);this.step=0;this.nextTime=this.ctx.currentTime+.05;
    clearInterval(this.timer);this.timer=setInterval(()=>this.tick(),25);
  }
  pause(){
    clearInterval(this.timer);this.timer=null;this.backing?.pause();useStudioStore.getState().setPlaying(false);
  }
  stop(){
    clearInterval(this.timer);this.timer=null;this.step=0;
    if(this.backing){this.backing.pause();this.backing.currentTime=0}
    useStudioStore.getState().setPlaying(false);
  }
}

export const audioEngine=new StudioAudioEngine();
