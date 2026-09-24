import React, { useEffect, useRef, useState } from 'react';
import { useStudioStore } from '../store.js';
import { KEYS, MUSICIANS, PERSPECTIVES, PROGRESSIONS, ROOMS, ROOM_SOUNDS, SOUNDS } from '../data.js';
import { audioEngine } from '../audio/engine.js';
import { ROOM_DESIGNS } from '../scene/rooms/roomDesigns.js';
import {
  AddTrackIcon, ArrowIcon, CloseIcon, DownloadIcon, EquipmentIcon, HarmonyIcon,
  LibraryIcon, MapIcon, PauseIcon, PlayIcon, PowerIcon, RecordIcon, RoomIcon,
  StopIcon, UsersIcon
} from './icons.jsx';

const SIGNAL_BARS=[9,15,22,11,28,34,18,42,27,19,37,51,29,44,17,31,55,39,24,48,35,57,26,45,33,20,41,53,30,47,24,38,50,28,43,18,34,46,23,39,29,49,21,36,52,31,44,26];
const QUICK_ACTIONS=[
  {id:'musicians',title:'Músicos',subtitle:'Convocar sesión',Icon:UsersIcon},
  {id:'sounds',title:'Sonidos',subtitle:'Instrumentos y presets',Icon:LibraryIcon},
  {id:'harmony',title:'Armonía',subtitle:'Acordes y progresiones',Icon:HarmonyIcon},
  {id:'rooms',title:'Acústica',subtitle:'Espacio inmersivo',Icon:RoomIcon}
];

const MASTERING_PROFILES={
  Natural:{tone:0,dynamicEq:28,compression:18,saturation:8,stereo:100,ceiling:-1},
  Streaming:{tone:8,dynamicEq:42,compression:36,saturation:12,stereo:104,ceiling:-1},
  Dinámico:{tone:4,dynamicEq:18,compression:10,saturation:5,stereo:108,ceiling:-1.2},
  Potente:{tone:10,dynamicEq:54,compression:58,saturation:24,stereo:112,ceiling:-.8},
  Personalizado:{tone:0,dynamicEq:28,compression:18,saturation:8,stereo:100,ceiling:-1}
};

const EQUIPMENT_ACTIONS={
  drum_kit:{Pocket:{preset:['drummer','Neo Soul Dry'],players:['drummer'],note:'groove seco y articulado'},Abierto:{preset:['drummer','Arena Rock'],players:['drummer'],roomSound:'Studio Live',note:'kit abierto con más sala'},'Half-time':{preset:['drummer','Neo Soul Dry'],players:['drummer'],bpm:72,note:'tempo llevado a 72 BPM'},Room:{players:['drummer'],roomSound:'Large Hall',note:'batería enviada a una sala amplia'}},
  bass_stack:{Redondo:{preset:['bassist','Round Finger'],players:['bassist'],note:'bajo redondo activo'},Moderno:{preset:['bassist','Modern Pick'],players:['bassist'],note:'ataque moderno activo'},Drive:{preset:['bassist','Modern Pick'],players:['bassist'],mastering:{saturation:34},note:'bajo con saturación'},Directo:{players:['bassist'],roomSound:'Studio Dry',note:'señal directa y seca'}},
  guitar_combo:{Limpio:{preset:['guitarist','Clean Chorus'],players:['guitarist'],note:'guitarra limpia activa'},Crunch:{preset:['guitarist','British Crunch'],players:['guitarist'],mastering:{saturation:22},note:'crunch británico activo'},Ambient:{preset:['guitarist','Clean Chorus'],players:['guitarist'],roomSound:'Large Hall',note:'guitarra en ambiente amplio'},Bypass:{players:['guitarist'],roomSound:'Studio Dry',mastering:{saturation:0},note:'cadena limpia y seca'}},
  practice_keys:{Grand:{preset:['keys','Studio Grand'],players:['keys'],note:'piano de estudio activo'},Rhodes:{preset:['keys','Warm Rhodes'],players:['keys'],note:'Rhodes cálido activo'},Órgano:{preset:['keys','Warm Rhodes'],players:['keys'],mastering:{saturation:18},note:'teclas con color armónico'},Layer:{preset:['keys','Warm Rhodes'],players:['keys','synth'],note:'capa de teclas y sintetizador'}},
  vocal_mic:{Íntimo:{roomSound:'Studio Dry',mastering:{tone:-6,compression:24},note:'captura cercana y controlada'},Abierto:{roomSound:'Studio Live',mastering:{stereo:108},note:'captura abierta con sala natural'},Aire:{mastering:{tone:28,dynamicEq:36},note:'realce de aire aplicado'},Oscuro:{mastering:{tone:-30,dynamicEq:24},note:'tono oscuro aplicado'}},
  vocal_booth:{Seco:{roomSound:'Studio Dry',note:'cabina seca'},Natural:{roomSound:'Studio Live',note:'reflexión natural'},Amplio:{roomSound:'Large Hall',mastering:{stereo:118},note:'espacio amplio'},Talkback:{roomSound:'Studio Dry',volume:42,note:'nivel de talkback seguro'}},
  recording_front_end:{Voz:{mastering:{tone:12,dynamicEq:38,compression:24},note:'cadena de voz'},Batería:{mastering:{compression:42,saturation:10},note:'cadena de batería'},Guitarra:{mastering:{compression:30,saturation:26},note:'cadena de guitarra'},Línea:{roomSound:'Studio Dry',mastering:{tone:0,compression:12,saturation:0},note:'entrada de línea limpia'}},
  recording_drums:{Tight:{preset:['drummer','Neo Soul Dry'],players:['drummer'],roomSound:'Studio Dry',note:'toma tight'},Live:{preset:['drummer','Arena Rock'],players:['drummer'],roomSound:'Studio Live',note:'toma live'},Paralelo:{players:['drummer'],mastering:{compression:52,saturation:14},note:'compresión paralela'},Room:{players:['drummer'],roomSound:'Large Hall',note:'micrófonos de sala'}},
  studio_keyboard:{Grand:{preset:['keys','Studio Grand'],players:['keys'],note:'piano de estudio activo'},Eléctrico:{preset:['keys','Warm Rhodes'],players:['keys'],note:'piano eléctrico activo'},Analógico:{preset:['synth','Poly Analog'],players:['synth'],note:'voz analógica activa'},Layer:{players:['keys','synth'],note:'layer de teclas y synth'}},
  synth_rack_left:{'Pad cálido':{preset:['synth','Poly Analog'],players:['synth'],mastering:{tone:-8},note:'pad cálido activo'},Secuencia:{preset:['synth','FM Glass'],players:['synth'],bpm:116,note:'secuencia a 116 BPM'},Bajo:{preset:['bassist','Modern Pick'],players:['bassist'],note:'bajo sintetizado activo'},Init:{preset:['synth','Poly Analog'],players:['synth'],mastering:{tone:0,saturation:0},note:'sintetizador reiniciado'}},
  synth_rack_right:{Movimiento:{preset:['synth','Poly Analog'],players:['synth'],mastering:{stereo:124},note:'movimiento estéreo aplicado'},Textura:{preset:['synth','FM Glass'],players:['synth'],roomSound:'Large Hall',note:'textura espacial activa'},Lead:{preset:['synth','FM Glass'],players:['synth'],mastering:{tone:18},note:'lead brillante activo'},Init:{preset:['synth','Poly Analog'],players:['synth'],mastering:{tone:0,stereo:100},note:'sintetizador reiniciado'}},
  pad_controller:{Batería:{players:['drummer'],preset:['drummer','Neo Soul Dry'],note:'patrón de batería activo'},Percusión:{players:['drummer'],preset:['drummer','Arena Rock'],note:'patrón de percusión activo'},Chops:{players:['drummer','synth'],bpm:96,note:'chops a 96 BPM'},Escena:{players:['drummer','bassist','keys','synth'],note:'escena completa activada'}},
  mix_console:{Balance:{mastering:{stereo:100,compression:18},note:'balance neutro'},Profundidad:{roomSound:'Studio Live',mastering:{stereo:112},note:'profundidad de sala'},Glue:{mastering:{compression:46,saturation:10},note:'glue de bus aplicado'},Automatización:{mastering:{dynamicEq:52,tone:8},note:'movimiento tonal aplicado'}},
  mix_monitor_left:{'Referencia A':{volume:72,mastering:{stereo:100},note:'referencia A'},'Referencia B':{volume:58,mastering:{tone:-6},note:'referencia B'},Mono:{mastering:{stereo:0},note:'monitorización mono'},'Bajo nivel':{volume:28,note:'escucha a bajo nivel'}},
  mix_monitor_right:{'Referencia A':{volume:72,mastering:{stereo:100},note:'referencia A'},'Referencia B':{volume:58,mastering:{tone:6},note:'referencia B'},Mono:{mastering:{stereo:0},note:'monitorización mono'},'Bajo nivel':{volume:28,note:'escucha a bajo nivel'}},
  mix_dynamics_rack:{Transparente:{mastering:{compression:18,saturation:2},note:'dinámica transparente'},Punch:{mastering:{compression:34,dynamicEq:42},note:'más punch'},Glue:{mastering:{compression:48,saturation:12},note:'glue de bus'},Bypass:{mastering:{compression:0,saturation:0},note:'dinámica en bypass'}},
  mix_spatial_fx_rack:{Studio:{roomSound:'Studio Live',note:'ambiente de estudio'},Plate:{roomSound:'Club Room',mastering:{tone:10},note:'plate compacto'},Chamber:{roomSound:'Large Hall',note:'cámara amplia'},Echo:{roomSound:'Arena',mastering:{stereo:126},note:'cola espacial extensa'}}
};

async function applyEquipmentAction(selected,action){
  const change=EQUIPMENT_ACTIONS[selected.id]?.[action];
  if(!change)throw new Error('Este control todavía no tiene una ruta de audio válida.');
  await audioEngine.init();
  const state=useStudioStore.getState();
  const previousAction=state.equipmentSettings[selected.id];
  const previousPlayers=EQUIPMENT_ACTIONS[selected.id]?.[previousAction]?.players||[];
  if(change.preset)state.setPreset(...change.preset);
  if(change.players){
    const retained=state.activePlayers.filter((player)=>!previousPlayers.includes(player));
    state.setActivePlayers([...new Set([...retained,...change.players])]);
  }
  if(change.roomSound){state.setRoomSound(change.roomSound);audioEngine.setRoom(change.roomSound)}
  if(change.bpm)state.setBpm(change.bpm);
  if(change.volume!==undefined){state.setVolume(change.volume);audioEngine.setVolume(change.volume)}
  if(change.mastering){
    state.setMasteringProfile('Personalizado');
    Object.entries(change.mastering).forEach(([control,value])=>state.setMasteringControl(control,value));
    audioEngine.setMastering({...useStudioStore.getState().masteringControls,...change.mastering});
  }
  state.setEquipmentSetting(selected.id,action);
  if(!useStudioStore.getState().playing&&change.players?.length)await audioEngine.play();
  state.notify(`${action} aplicado: ${change.note}.`,'success');
}

function formatDuration(seconds=0){
  if(!Number.isFinite(seconds)||seconds<=0)return 'Duración por analizar';
  const minutes=Math.floor(seconds/60),rest=Math.floor(seconds%60);
  return `${minutes}:${String(rest).padStart(2,'0')}`;
}

function formatClock(ms=0){
  const minutes=Math.floor(ms/60000),seconds=Math.floor(ms%60000/1000),millis=Math.floor(ms%1000);
  return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(millis).padStart(3,'0')}`;
}

function useDialogFocus(open,onClose){
  const ref=useRef(null);
  useEffect(()=>{
    if(!open)return undefined;
    const dialog=ref.current;
    if(!dialog)return;
    const previous=document.activeElement;
    const focusable=()=>[...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')];
    window.requestAnimationFrame(()=>focusable()[0]?.focus());
    const onKeyDown=(event)=>{
      if(event.key==='Escape'){event.preventDefault();onClose();return}
      if(event.key!=='Tab')return;
      const items=focusable();
      if(!items.length)return;
      const first=items[0],last=items.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    };
    document.addEventListener('keydown',onKeyDown);
    return()=>{document.removeEventListener('keydown',onKeyDown);if(previous instanceof HTMLElement)previous.focus()};
  },[open,onClose]);
  return ref;
}

function Brand(){
  return <div className="brand" aria-label="Deep Music Producer">
    <span className="brand-bars" aria-hidden="true">{[10,22,32,21,12].map((height,index)=><i key={index} style={{height}}/>)}</span>
    <span><b>DEEP MUSIC</b><small>PRODUCER</small><em>TU ESTUDIO. SIN LÍMITES.</em></span>
  </div>;
}

function TopBar(){
  const audioReady=useStudioStore((state)=>state.audioReady);
  const notify=useStudioStore((state)=>state.notify);
  const setMapOpen=useStudioStore((state)=>state.setMapOpen);
  const room=useStudioStore((state)=>state.room),setRoom=useStudioStore((state)=>state.setRoom);
  const activateAudio=async()=>{
    try{await audioEngine.init();notify('Audio preparado. La sesión está lista.','success')}
    catch(error){notify(error.message||'No se pudo iniciar el audio.','error')}
  };
  return <header className="topbar">
    <Brand/>
    <nav className="workflow-nav" aria-label="Flujo de producción">{Object.entries(ROOMS).map(([id,current])=>
      <button type="button" key={id} className={room===id?'active':''} aria-current={room===id?'step':undefined} aria-label={`${current.number}. ${current.label}: ${current.action}`} onClick={()=>setRoom(id)}>
        <span aria-hidden="true">{current.number}</span><div><b>{current.label}</b><small>{current.action}</small></div>
      </button>
    )}</nav>
    <div className="top-tools">
      <button type="button" className="icon-button" aria-label="Abrir mapa del estudio" onClick={()=>setMapOpen(true)}><MapIcon/></button>
      <button type="button" className={`audio-state ${audioReady?'active':''}`} aria-pressed={audioReady} onClick={activateAudio}><PowerIcon/><span>{audioReady?'AUDIO LISTO':'ACTIVAR AUDIO'}</span></button>
    </div>
  </header>;
}

function RoomIntro(){
  const room=useStudioStore((state)=>state.room),current=ROOMS[room];
  return <section className="room-intro" aria-live="polite" aria-atomic="true">
    <h1>{current.title}</h1><p>{current.copy}</p>
  </section>;
}

function PerspectiveRail(){
  const room=useStudioStore((state)=>state.room);
  const perspective=useStudioStore((state)=>state.perspective);
  const setPerspective=useStudioStore((state)=>state.setPerspective);
  const views=PERSPECTIVES[room]||[];
  return <nav className="perspective-rail" aria-label="Perspectiva de cámara">
    <span>Perspectiva</span>
    {views.map((view)=><button type="button" key={view.id} className={perspective===view.id?'active':''} aria-pressed={perspective===view.id} title={view.hint} onClick={()=>setPerspective(view.id)}>{view.label}</button>)}
  </nav>;
}

function QuickActions(){
  const openDrawer=useStudioStore((state)=>state.openDrawer);
  const room=useStudioStore((state)=>state.room),current=ROOMS[room];
  const playing=useStudioStore((state)=>state.playing),recording=useStudioStore((state)=>state.recording);
  const track=useStudioStore((state)=>state.track);
  const roomStatus=recording?'GRABANDO':playing?'SESIÓN EN MARCHA':{practice:'BANDA PREPARADA',record:'SEÑAL ARMADA',production:'IDEA EN CURSO',mix:'MEZCLA ABIERTA',master:'MASTER LISTO'}[room];
  const signalLabel=track?.name||{practice:'Interpretación',record:'Entrada principal',production:'Bus creativo',mix:'Mezcla estéreo',master:'Salida final'}[room];
  return <aside className="stage-console" aria-label={`Controles de ${current.label}`}>
    <div className="stage-console-head">
      <div className="stage-identity"><span aria-hidden="true">{current.number}</span><div><b>{current.label}</b><small>{current.action}</small></div></div>
      <div className="stage-head-actions">
        <button type="button" className="stage-equipment" onClick={()=>openDrawer('equipment')}><EquipmentIcon/><span>Equipo de sala</span></button>
        <div className="session-status" role="status"><i aria-hidden="true"/>{roomStatus}</div>
      </div>
    </div>
    <div className="stage-console-body">
      <div className="signal-strip">
        <div className="signal-meta"><span title={signalLabel}>{signalLabel}</span><b>{room==='master'?'−9.2 LUFS':'00:00:00'}</b></div>
        <div className={`waveform ${playing?'live':''}`} aria-hidden="true">{SIGNAL_BARS.map((height,index)=><i key={index} style={{height:`${height}%`}}/>)}</div>
        <div className={`channel-meter ${playing?'live':''}`} aria-hidden="true"><i/><i/></div>
      </div>
      <div className="quick-actions">{QUICK_ACTIONS.map(({id,title,subtitle,Icon})=>
        <button type="button" key={id} aria-label={`${title}: ${subtitle}`} onClick={()=>openDrawer(id)}><span aria-hidden="true"><Icon/></span><div><b>{title}</b><small>{subtitle}</small></div><em aria-hidden="true"><ArrowIcon/></em></button>
      )}</div>
    </div>
  </aside>;
}

const MASTERING_CHAIN=['Tono','Contorno','Compresión','Saturación','Estéreo','Limitador','Referencia','Medición'];
const DEMO_MASTERING_METRICS=[
  ['Integrado','−13.8','LUFS'],['Corto plazo','−12.6','LUFS'],['True Peak','−1.0','dBTP'],
  ['Crest Factor','9.4','dB'],['Correlación','+0.82',''],['Rango dinámico','10.7','LU']
];

function MasteringContext({selected,close}){
  const profile=useStudioStore((state)=>state.masteringProfile);
  const setProfile=useStudioStore((state)=>state.setMasteringProfile);
  const controls=useStudioStore((state)=>state.masteringControls);
  const setControl=useStudioStore((state)=>state.setMasteringControl);
  const setControls=useStudioStore((state)=>state.setMasteringControls);
  const notify=useStudioStore((state)=>state.notify);
  const advanced=[['tone','Tono','−','+'],['dynamicEq','Contorno','Suave','Firme'],['compression','Compresión','0','100'],['saturation','Saturación','0','100'],['stereo','Estéreo','Mono','Wide'],['ceiling','Ceiling','−3','0']];
  const chooseProfile=async(name)=>{
    try{
      await audioEngine.init();const next=name==='Personalizado'?useStudioStore.getState().masteringControls:MASTERING_PROFILES[name];setProfile(name);setControls(next);audioEngine.setMastering(next);notify(`Perfil ${name} aplicado al audio.`,'success');
    }catch(error){notify(error.message||'No se pudo aplicar el perfil.','error')}
  };
  const changeControl=async(id,value)=>{
    setProfile('Personalizado');setControl(id,value);
    try{await audioEngine.init();audioEngine.setMastering({...useStudioStore.getState().masteringControls,[id]:value})}
    catch(error){notify(error.message||'No se pudo aplicar el ajuste.','error')}
  };
  return <aside className="context-panel mastering-context open" aria-labelledby="mastering-title">
    <div className="panel-head"><div><small>{selected.type}</small><h2 id="mastering-title">{selected.title}</h2></div><button type="button" aria-label="Volver al estudio" onClick={close}><CloseIcon/></button></div>
    <p>{selected.description}</p>
    <div className="master-section-label"><span>Punto de partida</span><small>REVERSIBLE</small></div>
    <div className="live-processing"><i/> Procesamiento conectado al motor de audio</div>
    <div className="master-profiles">{Object.keys(MASTERING_PROFILES).map((name)=><button type="button" key={name} aria-pressed={profile===name} className={profile===name?'active':''} onClick={()=>chooseProfile(name)}>{name}</button>)}</div>
    <div className="master-chain" aria-label="Cadena de mastering">{MASTERING_CHAIN.map((item,index)=><span key={item} className={index<6?'enabled':''}>{item}</span>)}</div>
    <div className="master-section-label"><span>Medición</span><small className="demo-badge">DEMO · DATOS SIMULADOS</small></div>
    <div className="master-meters">{DEMO_MASTERING_METRICS.map(([label,value,unit])=><div key={label}><span>{label}</span><b>{value}<small>{unit}</small></b></div>)}</div>
    <details className="advanced-controls">
      <summary>Controles avanzados <span>Ábrelos sólo cuando necesites precisión</span></summary>
      <div>{advanced.map(([id,label,minLabel,maxLabel])=>{
        const min=id==='tone'?-100:id==='ceiling'?-3:0;
        const max=id==='ceiling'?0:id==='stereo'?150:100;
        return <label key={id}><span><b>{label}</b><small>{minLabel} · {maxLabel}</small></span><input aria-label={`${label}: ${controls[id]}`} type="range" min={min} max={max} step={id==='ceiling'?.1:1} value={controls[id]} onChange={(event)=>changeControl(id,Number(event.target.value))}/></label>;
      })}</div>
    </details>
    <button type="button" className="return-studio" onClick={close}>Volver a la vista del estudio</button>
  </aside>;
}

function ContextPanel(){
  const selected=useStudioStore((state)=>state.selected),close=useStudioStore((state)=>state.closeSelected);
  const notify=useStudioStore((state)=>state.notify);
  const equipmentSettings=useStudioStore((state)=>state.equipmentSettings);
  const activeOption=selected?equipmentSettings[selected.id]:null;
  useEffect(()=>{
    if(!selected)return undefined;
    const onKey=(event)=>{if(event.key==='Escape')close()};
    document.addEventListener('keydown',onKey);
    return()=>document.removeEventListener('keydown',onKey);
  },[selected,close]);
  if(!selected)return null;
  if(selected.panel==='mastering')return <MasteringContext selected={selected} close={close}/>;
  return <aside className="context-panel open" aria-labelledby="context-title">
    <div className="panel-head"><div><small>{selected.type}</small><h2 id="context-title">{selected.title}</h2></div><button type="button" aria-label="Cerrar detalle" onClick={close}><CloseIcon/></button></div>
    <p>{selected.description}</p>
    <div className="live-processing"><i/> Control conectado · los cambios se escuchan en tiempo real</div>
    <div className="context-grid">{selected.actions?.map((action,index)=><button type="button" key={action} aria-pressed={activeOption===action} className={`context-option ${activeOption===action?'active':''}`} onClick={async()=>{try{await applyEquipmentAction(selected,action)}catch(error){notify(error.message||'No se pudo aplicar el control.','error')}}}>
      <small>AJUSTE {String(index+1).padStart(2,'0')}</small><b>{action}</b><span>{activeOption===action?'Selección de este equipo':'Aplicar al audio'}</span>
    </button>)}</div>
  </aside>;
}

function MusiciansDrawer(){
  const active=useStudioStore((state)=>state.activePlayers),toggle=useStudioStore((state)=>state.togglePlayer),playing=useStudioStore((state)=>state.playing);
  const notify=useStudioStore((state)=>state.notify);
  const onToggle=async(id)=>{
    try{await audioEngine.init();toggle(id);if(!playing)await audioEngine.play()}
    catch(error){notify(error.message||'No se pudo iniciar la sesión.','error')}
  };
  return <div className="card-grid musicians">{MUSICIANS.map((musician)=>
    <button type="button" key={musician.id} aria-pressed={active.includes(musician.id)} className={`library-card ${active.includes(musician.id)?'active':''}`} onClick={()=>onToggle(musician.id)}>
      <i className="live-dot"/><span className="avatar" aria-hidden="true">{musician.initials}</span><small>{musician.style}</small><b>{musician.name}</b><p>{musician.subtitle}</p>
    </button>
  )}</div>;
}

function SoundsDrawer(){
  const presets=useStudioStore((state)=>state.presets),setPreset=useStudioStore((state)=>state.setPreset),notify=useStudioStore((state)=>state.notify);
  const choose=async(sound)=>{
    try{await audioEngine.init();setPreset(sound.role,sound.name);notify(`${sound.name} está listo.`,'success')}
    catch(error){notify(error.message||'No se pudo preparar el sonido.','error')}
  };
  return <div className="card-grid sounds">{SOUNDS.map((sound)=>
    <button type="button" key={`${sound.role}-${sound.name}`} aria-pressed={presets[sound.role]===sound.name} className={`library-card ${presets[sound.role]===sound.name?'active':''}`} onClick={()=>choose(sound)}>
      <small>{sound.group}</small><b>{sound.name}</b><p>{sound.desc}</p><span className="mini-wave" aria-hidden="true">{[4,9,13,7,15,10,5,12,8].map((height,index)=><i key={index} style={{height}}/>)}</span>
    </button>
  )}</div>;
}

function HarmonyDrawer(){
  const key=useStudioStore((state)=>state.key),setKey=useStudioStore((state)=>state.setKey);
  const progression=useStudioStore((state)=>state.progression),setProgression=useStudioStore((state)=>state.setProgression);
  const notify=useStudioStore((state)=>state.notify);
  const progressionStyles=['Pop / Anthem','Jazz / Soul','Balada clásica','Menor / Cinemática','Turnaround','Pop emocional'];
  return <>
    <div className="drawer-toolbar"><label>Tonalidad<select value={key} onChange={(event)=>setKey(event.target.value)}>{KEYS.map((item)=><option key={item}>{item}</option>)}</select></label><span>La banda sigue esta armonía en tiempo real.</span></div>
    <div className="card-grid harmony">{Object.keys(PROGRESSIONS).map((item,index)=>
      <button type="button" key={item} aria-pressed={progression===item} className={`library-card ${progression===item?'active':''}`} onClick={async()=>{try{await audioEngine.init();setProgression(item);notify(`Progresión ${item} activa.`,'success')}catch(error){notify(error.message||'No se pudo cambiar la progresión.','error')}}}>
        <small>PROGRESIÓN {String(index+1).padStart(2,'0')}</small><b>{item}</b><p>{progressionStyles[index]}</p>
      </button>
    )}</div>
  </>;
}

function RoomsDrawer(){
  const roomSound=useStudioStore((state)=>state.roomSound),setRoomSound=useStudioStore((state)=>state.setRoomSound),notify=useStudioStore((state)=>state.notify);
  const choose=async(space)=>{
    try{await audioEngine.init();setRoomSound(space.name);audioEngine.setRoom(space.name);notify(`Acústica ${space.name} aplicada.`,'success')}
    catch(error){notify(error.message||'No se pudo cambiar la acústica.','error')}
  };
  return <div className="card-grid rooms">{ROOM_SOUNDS.map((space,index)=>
    <button type="button" key={space.name} aria-pressed={roomSound===space.name} className={`library-card ${roomSound===space.name?'active':''}`} onClick={()=>choose(space)}>
      <small>ESPACIO {String(index+1).padStart(2,'0')}</small><b>{space.name}</b><p>{space.desc}</p><div className="room-depth" aria-hidden="true"><i style={{width:`${28+index*13}%`}}/></div>
    </button>
  )}</div>;
}

function EquipmentDrawer(){
  const room=useStudioStore((state)=>state.room),selected=useStudioStore((state)=>state.selected),select=useStudioStore((state)=>state.select);
  const items=ROOM_DESIGNS[room]?.hitboxes||[];
  return <div className="card-grid equipment">{items.map((item,index)=>
    <button type="button" key={item.id} aria-pressed={selected?.id===item.id} className={`library-card ${selected?.id===item.id?'active':''}`} onClick={()=>select(item)}>
      <span className="equipment-index" aria-hidden="true">{String(index+1).padStart(2,'0')}</span><small>{item.type}</small><b>{item.title}</b><p>{item.description}</p>
    </button>
  )}</div>;
}

function Drawer(){
  const drawer=useStudioStore((state)=>state.drawer),close=useStudioStore((state)=>state.closeDrawer);
  const dialogRef=useDialogFocus(Boolean(drawer),close);
  if(!drawer)return null;
  const titles={
    musicians:['SESSION PLAYERS','Convoca músicos de sesión','Elige quién toca. Cada músico responde al tempo, la armonía y su preset.'],
    sounds:['DEEP LIBRARY','Instrumentos y sonidos','Explora por carácter musical; los controles técnicos aparecen después.'],
    harmony:['HARMONY LAB','Armonía y movimiento','Define la tonalidad y la progresión que seguirá la banda virtual.'],
    rooms:['ACOUSTIC TWIN','Elige el espacio que escuchas','La acústica cambia distancia, energía y profundidad sin ocultar la señal seca.'],
    equipment:['EQUIPO DE SALA','Explora el estudio','Acceso equivalente por teclado a los puntos interactivos de la sala 3D.']
  };
  const title=titles[drawer];
  return <div className="drawer-layer" onMouseDown={(event)=>{if(event.target===event.currentTarget)close()}}>
    <aside ref={dialogRef} className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div className="drawer-head"><div><small>{title[0]}</small><h2 id="drawer-title">{title[1]}</h2><p>{title[2]}</p></div><button type="button" aria-label="Cerrar panel" onClick={close}><CloseIcon/></button></div>
      <div className="drawer-body">{drawer==='musicians'?<MusiciansDrawer/>:drawer==='sounds'?<SoundsDrawer/>:drawer==='harmony'?<HarmonyDrawer/>:drawer==='rooms'?<RoomsDrawer/>:<EquipmentDrawer/>}</div>
    </aside>
  </div>;
}

function StudioMap(){
  const open=useStudioStore((state)=>state.mapOpen),setMapOpen=useStudioStore((state)=>state.setMapOpen),setRoom=useStudioStore((state)=>state.setRoom);
  const close=()=>setMapOpen(false);
  const dialogRef=useDialogFocus(open,close);
  if(!open)return null;
  return <div className="map-overlay" onMouseDown={(event)=>{if(event.target===event.currentTarget)close()}}>
    <div ref={dialogRef} className="map-shell" role="dialog" aria-modal="true" aria-labelledby="map-title">
      <div className="map-head"><div><small>DEEP MUSIC PRODUCER</small><h2 id="map-title">Mapa del estudio</h2><p>Cada sala cambia el espacio, las herramientas y la intención.</p></div><button type="button" aria-label="Cerrar mapa" onClick={close}><CloseIcon/></button></div>
      <div className="map-grid">{Object.entries(ROOMS).map(([id,current])=>
        <button type="button" key={id} onClick={()=>setRoom(id)}><span>{current.number}</span><div className="map-room-visual" aria-hidden="true"><i/><i/><i/></div><b>{current.label}</b><small>{current.action}</small></button>
      )}</div>
    </div>
  </div>;
}

function Transport(){
  const playing=useStudioStore((state)=>state.playing),recording=useStudioStore((state)=>state.recording),setRecording=useStudioStore((state)=>state.setRecording);
  const inputMonitor=useStudioStore((state)=>state.inputMonitor),setInputMonitor=useStudioStore((state)=>state.setInputMonitor);
  const metronome=useStudioStore((state)=>state.metronome),setMetronome=useStudioStore((state)=>state.setMetronome);
  const bpm=useStudioStore((state)=>state.bpm),setBpm=useStudioStore((state)=>state.setBpm);
  const volume=useStudioStore((state)=>state.volume),setVolume=useStudioStore((state)=>state.setVolume);
  const track=useStudioStore((state)=>state.track),lastRecording=useStudioStore((state)=>state.lastRecording),notify=useStudioStore((state)=>state.notify);
  const [elapsed,setElapsed]=useState(0),[importing,setImporting]=useState(false),[recordingBusy,setRecordingBusy]=useState(false);
  const started=useRef(0),base=useRef(0);

  useEffect(()=>{base.current=0;setElapsed(0)},[track?.name]);
  useEffect(()=>{
    if(!playing){base.current=elapsed;return undefined}
    started.current=performance.now();
    const id=window.setInterval(()=>{
      const trackPosition=audioEngine.getPositionMs();
      setElapsed(trackPosition??base.current+performance.now()-started.current);
    },50);
    return()=>window.clearInterval(id);
  },[playing]);

  const finishRecording=async()=>{
    const result=await audioEngine.stopRecording();
    setRecording(false);
    if(result)notify('Toma guardada localmente y lista para descargar.','success');
  };
  const stop=async()=>{
    try{if(recording)await finishRecording();audioEngine.stop();base.current=0;setElapsed(0)}
    catch(error){notify(error.message||'No se pudo cerrar la toma.','error')}
  };
  const togglePlay=async()=>{
    try{if(playing)audioEngine.pause();else await audioEngine.play()}
    catch(error){notify(error.message||'No se pudo iniciar la reproducción.','error')}
  };
  const toggleRec=async()=>{
    if(recordingBusy)return;
    setRecordingBusy(true);
    try{
      if(recording){await finishRecording();return}
      await audioEngine.init();await audioEngine.startRecording();setRecording(true);
      if(!playing)await audioEngine.play();
      notify('Grabando una toma seca y reversible. Activa Monitor para escuchar la cadena procesada.','info');
    }catch(error){setRecording(false);notify(error.message||'No se pudo acceder al micrófono.','error')}
    finally{setRecordingBusy(false)}
  };
  const importTrack=async(event)=>{
    const file=event.target.files?.[0];event.target.value='';
    if(!file)return;
    setImporting(true);
    try{const loaded=await audioEngine.loadTrack(file);notify(`${loaded.name} importada. El archivo permanece en este dispositivo.`,'success')}
    catch(error){notify(error.message||'No se pudo importar la pista.','error')}
    finally{setImporting(false)}
  };
  const seekTrack=(event)=>{const seconds=Number(event.target.value);audioEngine.seekTo(seconds);base.current=seconds*1000;setElapsed(seconds*1000)};
  const removeTrack=()=>{audioEngine.unloadTrack();base.current=0;setElapsed(0);notify('Pista retirada de la sesión. El archivo original no se modificó.','info')};
  const changeVolume=async(event)=>{
    const next=Number(event.target.value);setVolume(next);
    try{await audioEngine.init();audioEngine.setVolume(next)}catch(error){notify(error.message||'No se pudo cambiar la salida.','error')}
  };
  const toggleMonitor=async()=>{
    try{
      if(inputMonitor){audioEngine.stopInputMonitor();setInputMonitor(false);notify('Monitor de entrada silenciado.','info');return}
      await audioEngine.startInputMonitor();setInputMonitor(true);notify('Monitor procesado activo. Usa auriculares para evitar acople.','success');
    }catch(error){setInputMonitor(false);notify(error.message||'No se pudo abrir la entrada de audio.','error')}
  };
  const progress=track?.duration?Math.min(100,elapsed/(track.duration*1000)*100):0;
  return <footer className="transport" id="transport" aria-label="Transporte de audio">
    <div className="transport-left">
      <label className={`track-button ${importing?'loading':''}`}><AddTrackIcon/><span>{importing?'Leyendo…':'Importar audio'}</span><input className="native-file" aria-label="Importar audio local" type="file" accept="audio/*,.wav,.mp3,.m4a,.aac,.flac,.ogg" onChange={importTrack} disabled={importing}/></label>
      <div className="track-meta"><b title={track?.name}>{track?.name||'Sesión nueva'}</b><small>{track?`${formatDuration(track.duration)} · local`:'Añade una pista o toca con la banda'}</small></div>
      {track&&<button type="button" className="track-clear" onClick={removeTrack}>Quitar</button>}
      <div className="counter"><b>{formatClock(elapsed)}</b><small>{recording?'GRABANDO':playing?'REPRODUCIENDO':'LISTO'}</small></div>
      {lastRecording&&<a className="recording-download" href={lastRecording.url} download={lastRecording.name} aria-label={`Descargar ${lastRecording.name}`}><DownloadIcon/><span>Descargar toma</span></a>}
    </div>
    <div className="transport-center">
      <button type="button" className="circle small" aria-label="Detener y volver al inicio" onClick={stop}><StopIcon/></button>
      <button type="button" className="circle play" aria-label={playing?'Pausar':'Reproducir'} aria-pressed={playing} onClick={togglePlay}>{playing?<PauseIcon/>:<PlayIcon/>}</button>
      <button type="button" className={`rec ${recording?'active':''}`} aria-label={recording?'Detener grabación de micrófono':'Iniciar grabación de micrófono'} aria-pressed={recording} disabled={recordingBusy} onClick={toggleRec}><RecordIcon/><span>{recordingBusy?'PREPARANDO':recording?'DETENER':'GRABAR'}</span></button>
    </div>
    <div className="transport-right">
      <label className="bpm-control"><span>BPM</span><input aria-label="Tempo en pulsos por minuto" inputMode="numeric" type="number" value={bpm} min="40" max="240" onChange={(event)=>setBpm(Math.max(40,Math.min(240,Number(event.target.value)||120)))}/></label>
      <button type="button" className={`metro ${metronome?'active':''}`} aria-pressed={metronome} onClick={()=>setMetronome(!metronome)}>Metrónomo</button>
      <button type="button" className={`monitor ${inputMonitor?'active':''}`} aria-pressed={inputMonitor} onClick={toggleMonitor}>Monitor</button>
      <label className="volume-control"><span>Salida</span><input aria-label={`Volumen de salida: ${volume}%`} type="range" min="0" max="100" value={volume} onChange={changeVolume}/><b>{volume}</b></label>
      <div className={`meter ${playing?'live':''}`} aria-label={playing?'Nivel de salida activo':'Nivel de salida en reposo'}><i/></div>
    </div>
    <input className="track-progress" aria-label="Posición de reproducción" type="range" min="0" max={track?.duration||1} step="0.01" value={track?Math.min(track.duration,elapsed/1000):0} disabled={!track} onChange={seekTrack} style={{'--progress':`${progress}%`}}/>
  </footer>;
}

function Notice(){
  const notice=useStudioStore((state)=>state.notice),clear=useStudioStore((state)=>state.clearNotice);
  useEffect(()=>{
    if(!notice)return undefined;
    const timeout=window.setTimeout(clear,4600);
    return()=>window.clearTimeout(timeout);
  },[notice,clear]);
  if(!notice)return null;
  return <div className={`notice ${notice.tone}`} role={notice.tone==='error'?'alert':'status'}><span>{notice.message}</span><button type="button" aria-label="Cerrar aviso" onClick={clear}><CloseIcon/></button></div>;
}

export default function Hud(){
  return <div className="hud">
    <TopBar/><RoomIntro/><PerspectiveRail/>
    <QuickActions/><ContextPanel/><Drawer/><StudioMap/><Transport/><Notice/>
  </div>;
}
