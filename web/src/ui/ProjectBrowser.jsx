import React, { useEffect, useState } from 'react';
import { listNativeSessions, loadNativeSession } from '../nativeBridge.js';
import { useStudioStore } from '../store.js';

const ROOM_MAP={practice:'practice',recording:'record',production:'production',mix:'mix',mastering:'master'};

export default function ProjectBrowser({open,onClose}){
  const [projects,setProjects]=useState([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const setRoom=useStudioStore((s)=>s.setRoom);
  const setBpm=useStudioStore((s)=>s.setBpm);
  const setPlaying=useStudioStore((s)=>s.setPlaying);
  const setRecording=useStudioStore((s)=>s.setRecording);

  const refresh=async()=>{
    setBusy(true);setError('');
    try{setProjects(await listNativeSessions());}
    catch(err){setError(String(err));}
    finally{setBusy(false);}
  };

  useEffect(()=>{if(open)void refresh();},[open]);

  const load=async(path)=>{
    setBusy(true);setError('');
    try{
      const session=await loadNativeSession(path);
      setRoom(ROOM_MAP[session.active_room]??'practice');
      setBpm(Math.round(session.transport?.bpm??120));
      setPlaying(false);setRecording(false);
      onClose();
    }catch(err){setError(String(err));}
    finally{setBusy(false);}
  };

  if(!open)return null;
  return <aside className="project-browser">
    <div className="project-browser-head">
      <div><small>DEEP SESSION FORMAT</small><h2>Proyectos</h2></div>
      <button onClick={onClose}>×</button>
    </div>
    <div className="project-list">
      {projects.length===0&&!busy&&<p className="project-empty">Todavía no hay sesiones guardadas.</p>}
      {projects.map((project)=>{
        const when=project.modified_unix?new Date(project.modified_unix*1000).toLocaleString():'';
        return <button key={project.path} onClick={()=>load(project.path)} disabled={busy}>
          <span>PROJECT</span><b>{project.name}</b><small>{when}</small><em>ABRIR ↗</em>
        </button>;
      })}
    </div>
    {error&&<p className="audio-error">{error}</p>}
    <div className="project-browser-actions"><button onClick={refresh} disabled={busy}>{busy?'ACTUALIZANDO…':'ACTUALIZAR'}</button></div>
  </aside>;
}
