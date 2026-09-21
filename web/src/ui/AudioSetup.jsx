import React, { useEffect, useMemo, useState } from 'react';
import {
  isNativeShell,
  listNativeAudioDevices,
  nativeAudioStatus,
  startNativeAudio,
  stopNativeAudio
} from '../nativeBridge.js';

export default function AudioSetup({open,onClose,onStatus}){
  const [preferAsio,setPreferAsio]=useState(false);
  const [devices,setDevices]=useState([]);
  const [input,setInput]=useState('');
  const [output,setOutput]=useState('');
  const [status,setStatus]=useState(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');

  const inputs=useMemo(()=>devices.filter((device)=>device.can_input),[devices]);
  const outputs=useMemo(()=>devices.filter((device)=>device.can_output),[devices]);

  const refresh=async()=>{
    if(!isNativeShell())return;
    setBusy(true);setError('');
    try{
      const [nextDevices,nextStatus]=await Promise.all([
        listNativeAudioDevices(preferAsio),
        nativeAudioStatus()
      ]);
      setDevices(nextDevices);
      setStatus(nextStatus);
      const defaultIn=nextDevices.find((device)=>device.default_input&&device.can_input)?.name??nextDevices.find((device)=>device.can_input)?.name??'';
      const defaultOut=nextDevices.find((device)=>device.default_output&&device.can_output)?.name??nextDevices.find((device)=>device.can_output)?.name??'';
      setInput((current)=>current&&nextDevices.some((d)=>d.name===current&&d.can_input)?current:defaultIn);
      setOutput((current)=>current&&nextDevices.some((d)=>d.name===current&&d.can_output)?current:defaultOut);
    }catch(err){
      setDevices([]);setError(String(err));
    }finally{setBusy(false);}
  };

  useEffect(()=>{if(open)void refresh();},[open,preferAsio]);

  const connect=async()=>{
    setBusy(true);setError('');
    try{
      const current=await nativeAudioStatus();
      if(current.running)await stopNativeAudio();
      const next=await startNativeAudio(preferAsio,input||null,output||null);
      setStatus(next);
      onStatus?.(next);
    }catch(err){setError(String(err));}
    finally{setBusy(false);}
  };

  if(!open)return null;
  return <aside className="audio-setup">
    <div className="audio-setup-head">
      <div><small>NATIVE AUDIO ENGINE</small><h2>Audio I/O</h2></div>
      <button onClick={onClose} aria-label="Cerrar">×</button>
    </div>
    <div className="audio-backend">
      <button className={!preferAsio?'active':''} onClick={()=>setPreferAsio(false)}>WASAPI</button>
      <button className={preferAsio?'active':''} onClick={()=>setPreferAsio(true)}>ASIO</button>
    </div>
    <label>Entrada<select value={input} onChange={(event)=>setInput(event.target.value)} disabled={busy}>
      {inputs.map((device)=><option key={'in-'+device.name} value={device.name}>{device.name}{device.default_input?' · default':''}</option>)}
    </select></label>
    <label>Salida<select value={output} onChange={(event)=>setOutput(event.target.value)} disabled={busy}>
      {outputs.map((device)=><option key={'out-'+device.name} value={device.name}>{device.name}{device.default_output?' · default':''}</option>)}
    </select></label>
    <div className="audio-setup-status">
      <i className={status?.running?'live':''}/>
      <div><b>{status?.running?'ENGINE ONLINE':'ENGINE OFFLINE'}</b><small>{status?.sample_rate?status.sample_rate+' Hz · '+status.output_channels+' ch':'Selecciona tu interfaz'}</small></div>
    </div>
    {error&&<p className="audio-error">{error}</p>}
    <div className="audio-setup-actions">
      <button onClick={refresh} disabled={busy}>Actualizar</button>
      <button className="primary" onClick={connect} disabled={busy||!input||!output}>{busy?'CONECTANDO…':'CONECTAR'}</button>
    </div>
  </aside>;
}
