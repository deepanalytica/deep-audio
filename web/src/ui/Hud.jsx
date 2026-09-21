import React, { useEffect, useState } from 'react';
import AudioSetup from './AudioSetup.jsx';
import ProjectBrowser from './ProjectBrowser.jsx';
import { useStudioStore } from '../store.js';
import { KEYS, MUSICIANS, PROGRESSIONS, ROOMS, ROOM_SOUNDS, SOUNDS } from '../data.js';
import { audioEngine } from '../audio/engine.js';
import { exportNativeRecording, isNativeShell, nativeAllNotesOff, nativeAudioStatus, nativeMeter, nativeNoteOff, nativeNoteOn, nativeTransport, NativeParam, playNativeLastRecording, saveNativeSession, setNativeMetronome, setNativeParameter, setNativeRoom, startNativeAudio, startNativeRecording, stopNativePlayback, stopNativeRecording } from '../nativeBridge.js';

function Brand(){
  return <div className="brand">
    <span className="brand-bars">{[10,22,32,21,12].map((h,i)=><i key={i} style={{height:h}}/>)}</span>
    <span><b>DEEP MUSIC</b><small>PRODUCER</small><em>TU ESTUDIO. SIN LÍMITES.</em></span>
  </div>;
}

function TopBar(){
  const audioReady=useStudioStore((s)=>s.audioReady);
  const setMapOpen=useStudioStore((s)=>s.setMapOpen);
  const room=useStudioStore((s)=>s.room),setRoom=useStudioStore((s)=>s.setRoom);
  const [nativeAudio,setNativeAudio]=useState({connected:isNativeShell(),running:false,backend:null});
  const [audioSetupOpen,setAudioSetupOpen]=useState(false);

  useEffect(()=>{
    let alive=true;
    if(isNativeShell()){
      nativeAudioStatus().then((status)=>{if(alive)setNativeAudio({connected:true,...status})}).catch(()=>{});
    }
    return()=>{alive=false};
  },[]);

  const activateAudio=async()=>{
    if(isNativeShell()){
      try{
        const status=await startNativeAudio(false);
        setNativeAudio({connected:true,...status});
      }catch(error){
        console.error('Native audio start failed',error);
      }
      return;
    }
    await audioEngine.init();
  };

  const ready=nativeAudio.connected?nativeAudio.running:audioReady;
  const label=nativeAudio.connected
    ?(ready?('RUST AUDIO · '+String(nativeAudio.backend||'native').toUpperCase()):'ACTIVAR AUDIO NATIVO')
    :(audioReady?'AUDIO ON':'ACTIVAR AUDIO');

  return <header className="topbar">
    <Brand/>
    <nav className="workflow-nav" aria-label="Flujo de producción">{Object.entries(ROOMS).map(([id,r])=>
      <button key={id} className={room===id?'active':''} onClick={()=>setRoom(id)}>
        <span>{r.number}</span><div><b>{r.label}</b><small>{r.action}</small></div>
      </button>
    )}</nav>
    <div className="top-tools">
      <button className="icon-button" aria-label="Mapa del estudio" onClick={()=>setMapOpen(true)}>⌘</button>
      {isNativeShell()&&<button className="icon-button io-button" aria-label="Configurar audio" onClick={()=>setAudioSetupOpen(true)}>I/O</button>}
      <button className={'audio-state '+(ready?'active':'')} onClick={activateAudio}><i/>{label}</button>
    </div>
    <AudioSetup open={audioSetupOpen} onClose={()=>setAudioSetupOpen(false)} onStatus={(status)=>setNativeAudio({connected:true,...status})}/>
  </header>;
}

function RoomRail(){
  const room=useStudioStore((s)=>s.room),setRoom=useStudioStore((s)=>s.setRoom);
  return <nav className="room-rail">{Object.entries(ROOMS).map(([id,r])=>
    <button key={id} className={room===id?'active':''} onClick={()=>setRoom(id)}>
      <span>{r.number}</span><b>{r.label}</b><small>{r.action}</small>
    </button>
  )}</nav>;
}

function RoomIntro(){
  const room=useStudioStore((s)=>s.room),r=ROOMS[room];
  return <section className="room-intro">
    <small>{r.eyebrow}</small><h1>{r.title}</h1><p>{r.copy}</p>
  </section>;
}

const quick=[
  ['musicians','✦','Músicos','Convocar sesión'],
  ['sounds','▥','Sonidos','Instrumentos & presets'],
  ['harmony','⌁','Harmony Lab','Acordes & progresiones'],
  ['rooms','◉','Room','Acústica inmersiva']
];

function QuickActions(){
  const openDrawer=useStudioStore((s)=>s.openDrawer);
  const room=useStudioStore((s)=>s.room),r=ROOMS[room];
  const [rtMeter,setRtMeter]=useState(null);
  const roomStatus={practice:'BANDA PREPARADA',record:'SEÑAL ARMADA',production:'IDEA EN CURSO',mix:'MEZCLA ABIERTA',master:'MASTER LISTO'}[room];
  const signalLabel={practice:'Interpretación',record:'Entrada principal',production:'Bus creativo',mix:'Mezcla estéreo',master:'Salida final'}[room];
  const bars=[9,15,22,11,28,34,18,42,27,19,37,51,29,44,17,31,55,39,24,48,35,57,26,45,33,20,41,53,30,47,24,38,50,28,43,18,34,46,23,39,29,49,21,36,52,31,44,26];

  useEffect(()=>{
    if(!isNativeShell())return undefined;
    let alive=true;
    const tick=()=>nativeMeter().then((value)=>{if(alive)setRtMeter(value)}).catch(()=>{});
    tick();
    const id=setInterval(tick,50);
    return()=>{alive=false;clearInterval(id)};
  },[]);

  return <aside className="stage-console">
    <div className="stage-console-head">
      <div className="stage-identity"><span>{r.number}</span><div><b>{r.label}</b><small>{r.eyebrow.replace(/^SALA \d+ · /,'')}</small></div></div>
      <div className="session-status"><i/>{roomStatus}</div>
    </div>
    <div className="stage-console-body">
      <div className="signal-strip">
        <div className="signal-meta"><span>{signalLabel}</span><b>{rtMeter&&room==='mix'?((rtMeter.gain_reduction_db??0).toFixed(1)+' dB GR'):(room==='master'?'−9.2 LUFS':'00:00:00')}</b></div>
        <div className="waveform" aria-hidden="true">{bars.map((h,i)=><i key={i} style={{height:h+'%'}}/>)}</div>
        <div className="channel-meter"><i/><i/></div>
      </div>
      <div className="quick-actions">{quick.map(([id,icon,title,sub])=>
        <button key={id} onClick={()=>openDrawer(id)}><span>{icon}</span><div><b>{title}</b><small>{sub}</small></div><em>↗</em></button>
      )}</div>
    </div>
  </aside>;
}

const MASTERING_PROFILES=['Natural','Streaming','Dynamic','Power','Custom'];
const MASTERING_CHAIN=['Tone','Dynamic EQ','Compression','Saturation','Stereo','Limiter','Reference','Metering'];
const DEMO_MASTERING_METRICS=[
  ['Integrated','−13.8','LUFS'],
  ['Short-term','−12.6','LUFS'],
  ['True Peak','−1.0','dBTP'],
  ['Crest Factor','9.4','dB'],
  ['Correlation','+0.82',''],
  ['Dynamic Range','10.7','LU']
];

function MasteringContext({selected,close}){
  const profile=useStudioStore((s)=>s.masteringProfile);
  const [liveMeter,setLiveMeter]=useState(null);
  const setProfile=useStudioStore((s)=>s.setMasteringProfile);
  const controls=useStudioStore((s)=>s.masteringControls);
  const setControl=useStudioStore((s)=>s.setMasteringControl);
  useEffect(()=>{
    if(!isNativeShell())return undefined;
    let alive=true;
    const tick=()=>nativeMeter().then((value)=>{if(alive)setLiveMeter(value)}).catch(()=>{});
    tick();
    const id=setInterval(tick,80);
    return()=>{alive=false;clearInterval(id)};
  },[]);

  const db=(linear)=>linear>1e-9?20*Math.log10(linear):-120;
  const metrics=liveMeter?[
    ['Sample Peak',db(liveMeter.peak).toFixed(1),'dBFS'],
    ['RMS',db(liveMeter.rms).toFixed(1),'dBFS'],
    ['Gain Reduction',Number(liveMeter.gain_reduction_db??0).toFixed(1),'dB']
  ]:DEMO_MASTERING_METRICS;

  const applyProfile=(name)=>{
    setProfile(name);
    if(!isNativeShell()||name==='Custom')return;
    const values={
      Natural:[0,-1,0],
      Streaming:[-1,-1,5],
      Dynamic:[0,-1.2,0],
      Power:[2,-.8,20]
    }[name];
    if(!values)return;
    void setNativeParameter(NativeParam.MASTER_INPUT_DB,values[0]);
    void setNativeParameter(NativeParam.MASTER_CEILING_DB,values[1]);
    void setNativeParameter(NativeParam.MASTER_DRIVE_PERCENT,values[2]);
  };

  const advanced=[
    ['tone','Tone','−','+'],
    ['dynamicEq','Dynamic EQ','0','100'],
    ['compression','Compression','0','100'],
    ['saturation','Saturation','0','100'],
    ['stereo','Stereo','Mono','Wide'],
    ['ceiling','Ceiling','−3','0']
  ];
  return <aside className="context-panel mastering-context open">
    <div className="panel-head"><div><small>{selected.type}</small><h2>{selected.title}</h2></div><button aria-label="Volver al estudio" onClick={close}>×</button></div>
    <p>{selected.description}</p>
    <div className="master-section-label"><span>Starting point</span><small>REVERSIBLE</small></div>
    <div className="master-profiles">{MASTERING_PROFILES.map((name)=><button key={name} className={profile===name?'active':''} onClick={()=>applyProfile(name)}>{name}</button>)}</div>
    <div className="master-chain" aria-label="Mastering signal chain">{MASTERING_CHAIN.map((item,index)=><span key={item} className={index<6?'enabled':''}>{item}</span>)}</div>
    <div className="master-section-label"><span>Metering</span><small className="demo-badge">{liveMeter?'LIVE · RUST DSP':'DEMO · NO LIVE ANALYSER'}</small></div>
    <div className="master-meters">{metrics.map(([label,value,unit])=><div key={label}><span>{label}</span><b>{value}<small>{unit}</small></b></div>)}</div>
    <details className="advanced-controls">
      <summary>Advanced controls <span>Open only when precision matters</span></summary>
      <div>{advanced.map(([id,label,minLabel,maxLabel])=>{
        const min=id==='tone'?-100:id==='ceiling'?-3:0;
        const max=id==='ceiling'?0:id==='stereo'?150:100;
        const step=id==='ceiling'?.1:1;
        const onChange=(event)=>{
          const value=Number(event.target.value);
          setControl(id,value);
          if(isNativeShell()){
            if(id==='tone')void setNativeParameter(NativeParam.MASTER_INPUT_DB,value*.12);
            if(id==='saturation')void setNativeParameter(NativeParam.MASTER_DRIVE_PERCENT,value);
            if(id==='ceiling')void setNativeParameter(NativeParam.MASTER_CEILING_DB,value);
          }
        };
        return <label key={id}><span><b>{label}</b><small>{minLabel} · {maxLabel}</small></span><input type="range" min={min} max={max} step={step} value={controls[id]} onChange={onChange}/></label>;
      })}</div>
    </details>
    <button className="return-studio" onClick={close}>Return to operator view</button>
  </aside>;
}

function ContextPanel(){
  const selected=useStudioStore((s)=>s.selected),close=useStudioStore((s)=>s.closeSelected);
  if(!selected)return null;
  if(selected.panel==='mastering')return <MasteringContext selected={selected} close={close}/>;
  return <aside className="context-panel open">
    <div className="panel-head"><div><small>{selected.type}</small><h2>{selected.title}</h2></div><button aria-label="Volver al estudio" onClick={close}>×</button></div>
    <p>{selected.description}</p>
    <div className="context-grid">{selected.actions?.map((a,i)=><button key={a} className="context-option">
      <small>PRESET {String(i+1).padStart(2,'0')}</small><b>{a}</b><span>Escuchar y comparar</span>
    </button>)}</div>
  </aside>;
}

function MusiciansDrawer(){
  const active=useStudioStore((s)=>s.activePlayers),toggle=useStudioStore((s)=>s.togglePlayer),playing=useStudioStore((s)=>s.playing);
  const onToggle=async(id)=>{
    await audioEngine.init();toggle(id);
    if(!playing)setTimeout(()=>audioEngine.play(),0);
  };
  return <div className="card-grid musicians">{MUSICIANS.map(m=>
    <button key={m.id} className={'library-card '+(active.includes(m.id)?'active':'')} onClick={()=>onToggle(m.id)}>
      <i className="live-dot"/><span className="avatar">{m.initials}</span><small>{m.style}</small><b>{m.name}</b><p>{m.subtitle}</p>
    </button>
  )}</div>;
}

function SoundsDrawer(){
  const presets=useStudioStore((s)=>s.presets),setPreset=useStudioStore((s)=>s.setPreset);
  return <div className="card-grid sounds">{SOUNDS.map(s=>
    <button key={s.role+'-'+s.name} className={'library-card '+(presets[s.role]===s.name?'active':'')} onClick={async()=>{await audioEngine.init();setPreset(s.role,s.name)}}>
      <small>{s.group}</small><b>{s.name}</b><p>{s.desc}</p><span className="mini-wave">{[4,9,13,7,15,10,5,12,8].map((h,i)=><i key={i} style={{height:h}}/>)}</span>
    </button>
  )}</div>;
}

function HarmonyDrawer(){
  const key=useStudioStore((s)=>s.key),setKey=useStudioStore((s)=>s.setKey);
  const progression=useStudioStore((s)=>s.progression),setProgression=useStudioStore((s)=>s.setProgression);
  return <>
    <div className="drawer-toolbar"><label>Tonalidad<select value={key} onChange={(e)=>setKey(e.target.value)}>{KEYS.map(k=><option key={k}>{k}</option>)}</select></label><span>La banda sigue esta armonía en tiempo real.</span></div>
    <div className="card-grid harmony">{Object.keys(PROGRESSIONS).map((p,i)=>
      <button key={p} className={'library-card '+(progression===p?'active':'')} onClick={async()=>{await audioEngine.init();setProgression(p)}}>
        <small>PROGRESIÓN {String(i+1).padStart(2,'0')}</small><b>{p}</b><p>{['Pop / Anthem','Jazz / Soul','Classic / Ballad','Minor / Cinematic','Turnaround','Emotional Pop'][i]}</p>
      </button>
    )}</div>
  </>;
}

function RoomsDrawer(){
  const roomSound=useStudioStore((s)=>s.roomSound),setRoomSound=useStudioStore((s)=>s.setRoomSound);
  return <div className="card-grid rooms">{ROOM_SOUNDS.map((r,i)=>
    <button key={r.name} className={'library-card '+(roomSound===r.name?'active':'')} onClick={async()=>{await audioEngine.init();setRoomSound(r.name);audioEngine.setRoom(r.name)}}>
      <small>ACOUSTIC SPACE {String(i+1).padStart(2,'0')}</small><b>{r.name}</b><p>{r.desc}</p><div className="room-depth"><i style={{width:(28+i*13)+'%'}}/></div>
    </button>
  )}</div>;
}

function Drawer(){
  const drawer=useStudioStore((s)=>s.drawer),close=useStudioStore((s)=>s.closeDrawer);
  if(!drawer)return null;
  const titles={
    musicians:['SESSION PLAYERS','Convoca músicos de sesión','Los mejores músicos deben sentirse como parte del estudio, no como plugins.'],
    sounds:['DEEP LIBRARY','Instrumentos y sonidos','Explora por carácter musical; los controles técnicos aparecen después.'],
    harmony:['HARMONY LAB','Armonía y movimiento','Progresiones que la banda virtual puede interpretar y variar.'],
    rooms:['ACOUSTIC TWIN','Elige el espacio que escuchas','El room cambia la percepción de distancia, energía y profundidad.']
  };
  const t=titles[drawer];
  return <aside className="drawer open">
    <div className="drawer-head"><div><small>{t[0]}</small><h2>{t[1]}</h2><p>{t[2]}</p></div><button onClick={close}>×</button></div>
    <div className="drawer-body">{drawer==='musicians'?<MusiciansDrawer/>:drawer==='sounds'?<SoundsDrawer/>:drawer==='harmony'?<HarmonyDrawer/>:<RoomsDrawer/>}</div>
  </aside>;
}

function StudioMap(){
  const open=useStudioStore((s)=>s.mapOpen),setMapOpen=useStudioStore((s)=>s.setMapOpen),setRoom=useStudioStore((s)=>s.setRoom);
  if(!open)return null;
  return <div className="map-overlay" onClick={()=>setMapOpen(false)}>
    <div className="map-shell" onClick={(e)=>e.stopPropagation()}>
      <div className="map-head"><div><small>DEEP MUSIC PRODUCER</small><h2>Mapa del estudio</h2><p>Cada sala cambia el espacio, las herramientas y la intención.</p></div><button onClick={()=>setMapOpen(false)}>×</button></div>
      <div className="map-grid">{Object.entries(ROOMS).map(([id,r])=>
        <button key={id} onClick={()=>setRoom(id)}><span>{r.number}</span><div className="map-room-visual"><i/><i/><i/></div><b>{r.label}</b><small>{r.action}</small></button>
      )}</div>
    </div>
  </div>;
}

function Transport(){
  const playing=useStudioStore((s)=>s.playing),setPlaying=useStudioStore((s)=>s.setPlaying);
  const recording=useStudioStore((s)=>s.recording),setRecording=useStudioStore((s)=>s.setRecording);
  const metronome=useStudioStore((s)=>s.metronome),setMetronome=useStudioStore((s)=>s.setMetronome);
  const bpm=useStudioStore((s)=>s.bpm),setBpm=useStudioStore((s)=>s.setBpm);
  const openDrawer=useStudioStore((s)=>s.openDrawer);
  const [elapsed,setElapsed]=useState(0);
  const [nativeMessage,setNativeMessage]=useState('');
  const [projectsOpen,setProjectsOpen]=useState(false);
  const started=React.useRef(0),base=React.useRef(0);

  useEffect(()=>{
    let id;
    if(playing){started.current=performance.now();id=setInterval(()=>setElapsed(base.current+performance.now()-started.current),32)}
    else base.current=elapsed;
    return()=>clearInterval(id);
  },[playing]);

  const format=(ms)=>{
    const m=Math.floor(ms/60000),s=Math.floor(ms%60000/1000),x=Math.floor(ms%1000);
    return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+'.'+String(x).padStart(3,'0');
  };

  const stop=async()=>{
    if(isNativeShell()){
      try{
        if(recording)await stopNativeRecording();
        await stopNativePlayback().catch(()=>{});
        const snapshot=await nativeTransport('stop');
        setPlaying(snapshot.playing);
        setRecording(snapshot.recording);
      }catch(error){setNativeMessage(String(error));}
    }else{
      audioEngine.stop();
      setRecording(false);
    }
    base.current=0;setElapsed(0);
  };

  const togglePlay=async()=>{
    if(isNativeShell()){
      try{
        if(playing){
          await stopNativePlayback().catch(()=>{});
          const snapshot=await nativeTransport('pause');
          setPlaying(snapshot.playing);
          setRecording(snapshot.recording);
        }else{
          await playNativeLastRecording().catch(()=>null);
          const snapshot=await nativeTransport('play');
          setPlaying(snapshot.playing);
          setRecording(snapshot.recording);
        }
      }catch(error){setNativeMessage(String(error));}
      return;
    }
    playing?audioEngine.pause():audioEngine.play();
  };

  const toggleRec=async()=>{
    if(isNativeShell()){
      try{
        const status=await nativeAudioStatus();
        if(!status.running)await startNativeAudio(false);
        if(recording){
          const summary=await stopNativeRecording();
          setRecording(false);
          setPlaying(true);
          setNativeMessage('TAKE · '+summary.frames+' frames');
        }else{
          await startNativeRecording('take');
          setRecording(true);
          setPlaying(true);
          setNativeMessage('REC · RUST');
        }
      }catch(error){setNativeMessage(String(error));}
      return;
    }
    await audioEngine.init();setRecording(!recording);if(!playing)audioEngine.play();
  };

  const changeBpm=async(value)=>{
    const next=Math.max(40,Math.min(240,Number(value)||120));
    setBpm(next);
    if(isNativeShell()){
      try{await nativeTransport('bpm',{bpm:next});}catch(error){setNativeMessage(String(error));}
    }
  };

  const saveProject=async()=>{
    if(!isNativeShell()){setNativeMessage('Disponible en la app nativa');return;}
    try{
      const path=await saveNativeSession('Deep Session');
      setNativeMessage('GUARDADO · '+path.split(/[\\/]/).pop());
    }catch(error){setNativeMessage(String(error));}
  };

  const exportTake=async()=>{
    if(!isNativeShell()){setNativeMessage('Disponible en la app nativa');return;}
    try{
      const path=await exportNativeRecording('Deep Music Export');
      setNativeMessage('EXPORTADO · '+path.split(/[\\/]/).pop());
    }catch(error){setNativeMessage(String(error));}
  };

  return <footer className="transport">
    <div className="transport-left">
      <button className="track-button" onClick={()=>openDrawer('sounds')}>＋ Pista</button>
      {isNativeShell()&&<button className="track-button" onClick={()=>setProjectsOpen(true)}>Proyectos</button>}
      <button className="track-button" onClick={saveProject}>Guardar</button>
      <div className="counter"><b>{format(elapsed)}</b><small>{nativeMessage||(recording?'GRABANDO':playing?'PLAY':'LISTO')}</small></div>
    </div>
    <div className="transport-center"><button className="circle small" onClick={stop}>■</button><button className="circle play" onClick={togglePlay}>{playing?'❚❚':'▶'}</button><button className={'rec '+(recording?'active':'')} onClick={toggleRec}><i/> REC</button></div>
    <div className="transport-right"><label>BPM<input type="number" value={bpm} min="40" max="240" onChange={(e)=>changeBpm(e.target.value)}/></label><button className={'metro '+(metronome?'active':'')} onClick={async()=>{
      const next=!metronome;
      setMetronome(next);
      if(isNativeShell())await setNativeMetronome(next).catch((error)=>setNativeMessage(String(error)));
    }}>Metrónomo</button><button className="track-button" onClick={exportTake}>Exportar WAV</button><div className={'meter '+(playing?'live':'')}><i/></div></div>
    <ProjectBrowser open={projectsOpen} onClose={()=>setProjectsOpen(false)}/>
  </footer>;
}

function NativeKeysInput(){
  const room=useStudioStore((s)=>s.room);
  const pressed=React.useRef(new Set());
  const starting=React.useRef(null);
  const keyMap=React.useMemo(()=>new Map([
    ['z',60],['2',61],['x',62],['3',63],['c',64],['v',65],['5',66],
    ['b',67],['6',68],['n',69],['7',70],['m',71],[',',72]
  ]),[]);

  useEffect(()=>{
    if(!isNativeShell())return undefined;

    const ensureAudio=async()=>{
      const status=await nativeAudioStatus();
      if(status.running)return status;
      if(!starting.current){
        starting.current=startNativeAudio(false).finally(()=>{starting.current=null;});
      }
      return starting.current;
    };

    const isTyping=()=>['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable;

    const down=async(event)=>{
      if(isTyping()||event.repeat)return;
      const note=keyMap.get(event.key.toLowerCase());
      if(note===undefined||pressed.current.has(event.key.toLowerCase()))return;
      event.preventDefault();
      const key=event.key.toLowerCase();
      pressed.current.add(key);
      try{
        await ensureAudio();
        await nativeNoteOn(note,.84);
      }catch(error){
        pressed.current.delete(key);
        console.error('Deep Keys note on failed',error);
      }
    };

    const up=(event)=>{
      const key=event.key.toLowerCase();
      const note=keyMap.get(key);
      if(note===undefined||!pressed.current.has(key))return;
      pressed.current.delete(key);
      void nativeNoteOff(note);
    };

    const allOff=()=>{
      pressed.current.clear();
      void nativeAllNotesOff().catch(()=>{});
    };

    window.addEventListener('keydown',down);
    window.addEventListener('keyup',up);
    window.addEventListener('blur',allOff);
    return()=>{
      window.removeEventListener('keydown',down);
      window.removeEventListener('keyup',up);
      window.removeEventListener('blur',allOff);
      allOff();
    };
  },[keyMap]);

  if(room!=='production'||!isNativeShell())return null;
  return <div className="native-keys-hint"><b>DEEP KEYS</b><span>Z X C V B N M · 2 3 5 6 7</span><small>TOCA DESDE EL TECLADO</small></div>;
}

function NativeRoomSync(){
  const room=useStudioStore((s)=>s.room);
  useEffect(()=>{
    if(isNativeShell())setNativeRoom(room).catch(()=>{});
  },[room]);
  return null;
}

export default function Hud(){
  return <div className="hud">
    <NativeRoomSync/><NativeKeysInput/><TopBar/><RoomIntro/>
    <div className="movement-hint"><b>ARRASTRA</b> para mirar · <b>WASD</b> para moverte · <b>CLIC</b> para interactuar</div>
    <QuickActions/><ContextPanel/><Drawer/><StudioMap/><Transport/>
  </div>;
}
