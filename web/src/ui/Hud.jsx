import React, { useEffect, useState } from 'react';
import { useStudioStore } from '../store.js';
import { KEYS, MUSICIANS, PROGRESSIONS, ROOMS, ROOM_SOUNDS, SOUNDS } from '../data.js';
import { audioEngine } from '../audio/engine.js';

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
  return <header className="topbar">
    <Brand/>
    <nav className="workflow-nav" aria-label="Flujo de producción">{Object.entries(ROOMS).map(([id,r])=>
      <button key={id} className={room===id?'active':''} onClick={()=>setRoom(id)}>
        <span>{r.number}</span><div><b>{r.label}</b><small>{r.action}</small></div>
      </button>
    )}</nav>
    <div className="top-tools">
      <button className="icon-button" aria-label="Mapa del estudio" onClick={()=>setMapOpen(true)}>⌘</button>
      <button className={'audio-state '+(audioReady?'active':'')} onClick={()=>audioEngine.init()}><i/>{audioReady?'AUDIO ON':'ACTIVAR AUDIO'}</button>
    </div>
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
  const roomStatus={practice:'BANDA PREPARADA',record:'SEÑAL ARMADA',production:'IDEA EN CURSO',mix:'MEZCLA ABIERTA',master:'MASTER LISTO'}[room];
  const signalLabel={practice:'Interpretación',record:'Entrada principal',production:'Bus creativo',mix:'Mezcla estéreo',master:'Salida final'}[room];
  const bars=[9,15,22,11,28,34,18,42,27,19,37,51,29,44,17,31,55,39,24,48,35,57,26,45,33,20,41,53,30,47,24,38,50,28,43,18,34,46,23,39,29,49,21,36,52,31,44,26];
  return <aside className="stage-console">
    <div className="stage-console-head">
      <div className="stage-identity"><span>{r.number}</span><div><b>{r.label}</b><small>{r.eyebrow.replace(/^SALA \d+ · /,'')}</small></div></div>
      <div className="session-status"><i/>{roomStatus}</div>
    </div>
    <div className="stage-console-body">
      <div className="signal-strip">
        <div className="signal-meta"><span>{signalLabel}</span><b>{room==='master'?'−9.2 LUFS':'00:00:00'}</b></div>
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
  const setProfile=useStudioStore((s)=>s.setMasteringProfile);
  const controls=useStudioStore((s)=>s.masteringControls);
  const setControl=useStudioStore((s)=>s.setMasteringControl);
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
    <div className="master-profiles">{MASTERING_PROFILES.map((name)=><button key={name} className={profile===name?'active':''} onClick={()=>setProfile(name)}>{name}</button>)}</div>
    <div className="master-chain" aria-label="Mastering signal chain">{MASTERING_CHAIN.map((item,index)=><span key={item} className={index<6?'enabled':''}>{item}</span>)}</div>
    <div className="master-section-label"><span>Metering</span><small className="demo-badge">DEMO · NO LIVE ANALYSER</small></div>
    <div className="master-meters">{DEMO_MASTERING_METRICS.map(([label,value,unit])=><div key={label}><span>{label}</span><b>{value}<small>{unit}</small></b></div>)}</div>
    <details className="advanced-controls">
      <summary>Advanced controls <span>Open only when precision matters</span></summary>
      <div>{advanced.map(([id,label,minLabel,maxLabel])=>{
        const min=id==='tone'?-100:id==='ceiling'?-3:0;
        const max=id==='ceiling'?0:id==='stereo'?150:100;
        const step=id==='ceiling'?.1:1;
        return <label key={id}><span><b>{label}</b><small>{minLabel} · {maxLabel}</small></span><input type="range" min={min} max={max} step={step} value={controls[id]} onChange={(event)=>setControl(id,Number(event.target.value))}/></label>;
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
  const playing=useStudioStore((s)=>s.playing),recording=useStudioStore((s)=>s.recording),setRecording=useStudioStore((s)=>s.setRecording);
  const metronome=useStudioStore((s)=>s.metronome),setMetronome=useStudioStore((s)=>s.setMetronome);
  const bpm=useStudioStore((s)=>s.bpm),setBpm=useStudioStore((s)=>s.setBpm);
  const openDrawer=useStudioStore((s)=>s.openDrawer);
  const [elapsed,setElapsed]=useState(0);
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
  const stop=()=>{audioEngine.stop();base.current=0;setElapsed(0);setRecording(false)};
  const togglePlay=()=>playing?audioEngine.pause():audioEngine.play();
  const toggleRec=async()=>{await audioEngine.init();setRecording(!recording);if(!playing)audioEngine.play()};

  return <footer className="transport">
    <div className="transport-left"><button className="track-button" onClick={()=>openDrawer('sounds')}>＋ Pista</button><div className="counter"><b>{format(elapsed)}</b><small>{recording?'GRABANDO':playing?'PLAY':'LISTO'}</small></div></div>
    <div className="transport-center"><button className="circle small" onClick={stop}>■</button><button className="circle play" onClick={togglePlay}>{playing?'❚❚':'▶'}</button><button className={'rec '+(recording?'active':'')} onClick={toggleRec}><i/> REC</button></div>
    <div className="transport-right"><label>BPM<input type="number" value={bpm} min="40" max="240" onChange={(e)=>setBpm(Math.max(40,Math.min(240,Number(e.target.value)||120)))}/></label><button className={'metro '+(metronome?'active':'')} onClick={()=>setMetronome(!metronome)}>Metrónomo</button><div className={'meter '+(playing?'live':'')}><i/></div></div>
  </footer>;
}

export default function Hud(){
  return <div className="hud">
    <TopBar/><RoomIntro/>
    <div className="movement-hint"><b>ARRASTRA</b> para mirar · <b>WASD</b> para moverte · <b>CLIC</b> para interactuar</div>
    <QuickActions/><ContextPanel/><Drawer/><StudioMap/><Transport/>
  </div>;
}
