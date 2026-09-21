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

export async function nativeParameters(){
  if(!isNativeShell())return [];
  return invoke('parameter_snapshot');
}

export async function setNativeParameter(id,value){
  if(!isNativeShell())return value;
  return invoke('set_parameter',{id,value});
}

export async function nativeMeter(){
  if(!isNativeShell())return {peak:0,rms:0,gain_reduction_db:0};
  return invoke('meter_snapshot');
}

export async function nativeAudioStatus(){
  if(!isNativeShell())return {running:false,backend:'web'};
  return invoke('audio_status');
}

export async function startNativeAudio(preferAsio=false){
  return invoke('start_audio',{preferAsio});
}

export async function stopNativeAudio(){return invoke('stop_audio');}
