export const NativeParam=Object.freeze({
  GLUE_THRESHOLD_DB:2001,
  GLUE_RATIO:2002,
  GLUE_ATTACK_MS:2003,
  GLUE_RELEASE_MS:2004,
  GLUE_MAKEUP_DB:2005,
  GLUE_MIX_PERCENT:2006
});

function tauriInvoke(){
  return globalThis?.__TAURI__?.core?.invoke ?? null;
}

export function isNativeShell(){return Boolean(tauriInvoke());}

async function invoke(command,args={}){
  const fn=tauriInvoke();
  if(!fn)throw new Error('native-shell-unavailable');
  return fn(command,args);
}

export async function nativeHealth(){
  if(!isNativeShell())return {connected:false,product:'Deep Music Producer Web',rust_core:false,schema_version:null};
  try{
    const result=await invoke('health');
    return {connected:true,...result};
  }catch(error){
    return {connected:false,error:String(error),rust_core:false};
  }
}

export async function nativeParameters(){return isNativeShell()?invoke('parameter_snapshot'):[];}
export async function setNativeParameter(id,value){return isNativeShell()?invoke('set_parameter',{id,value}):value;}
export async function nativeMeter(){return isNativeShell()?invoke('meter_snapshot'):{peak:0,rms:0,gain_reduction_db:0};}
export async function nativeAudioStatus(){return isNativeShell()?invoke('audio_status'):{running:false,backend:'web'};}
export async function nativeTransportSnapshot(){return isNativeShell()?invoke('transport_snapshot'):{playing:false,recording:false,position_samples:0,bpm:120};}
export async function nativeTransport(action,{bpm=null,positionSamples=null}={}){return invoke('transport_command',{action,bpm,positionSamples});}
export async function setNativeRoom(room){if(isNativeShell())await invoke('set_room',{room});}
export async function listNativeAudioDevices(preferAsio=false){return invoke('list_audio_devices',{preferAsio});}
export async function startNativeAudio(preferAsio=false,inputDevice=null,outputDevice=null){return invoke('start_audio',{preferAsio,inputDevice,outputDevice});}
export async function stopNativeAudio(){return invoke('stop_audio');}
export async function startNativeRecording(name=null){return invoke('start_recording',{name});}
export async function stopNativeRecording(){return invoke('stop_recording');}
export async function playNativeLastRecording(){return invoke('play_last_recording');}
export async function stopNativePlayback(){return invoke('stop_playback');}
export async function exportNativeRecording(name=null){return invoke('export_last_recording',{name});}
export async function nativeSession(){return invoke('session_snapshot');}
export async function saveNativeSession(name=null){return invoke('save_session',{name});}
export async function loadNativeSession(path){return invoke('load_session',{path});}
