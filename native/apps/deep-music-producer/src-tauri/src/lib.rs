#![forbid(unsafe_code)]

use deep_dsp::{DeepGlueHandles};
use deep_metering::{MeterSnapshot,SharedMeter};
use deep_params::{ParameterBank,ParameterId,ParameterSnapshot};
use serde::Serialize;
use std::sync::Mutex;

#[derive(Serialize)]
struct Health{
    product:&'static str,
    rust_core:bool,
    schema_version:u32,
}

#[derive(Serialize)]
struct AudioStatus{
    running:bool,
    backend:String,
    sample_rate:Option<u32>,
    input_channels:Option<u16>,
    output_channels:Option<u16>,
    input_device:Option<String>,
    output_device:Option<String>,
}

struct EngineState{
    params:ParameterBank,
    handles:DeepGlueHandles,
    meter:SharedMeter,
    audio_stop:Mutex<Option<std::sync::mpsc::Sender<()>>>,
}

impl EngineState{
    fn new()->Self{
        let mut params=ParameterBank::new();
        let handles=DeepGlueHandles::register(&mut params);
        Self{params,handles,meter:SharedMeter::new(),audio_stop:Mutex::new(None)}
    }
}

#[tauri::command]
fn health()->Health{Health{product:"Deep Music Producer",rust_core:true,schema_version:1}}

#[tauri::command]
fn parameter_snapshot(state:tauri::State<'_,EngineState>)->Vec<ParameterSnapshot>{state.params.snapshots()}

#[tauri::command]
fn set_parameter(state:tauri::State<'_,EngineState>,id:u32,value:f32)->Result<f32,String>{
    let parameter_id=ParameterId(id);
    if !state.params.set(parameter_id,value){return Err(format!("unknown parameter id {id}"));}
    Ok(state.params.get(parameter_id).expect("parameter exists").get())
}

#[tauri::command]
fn meter_snapshot(state:tauri::State<'_,EngineState>)->MeterSnapshot{state.meter.snapshot()}

#[tauri::command]
fn audio_status(state:tauri::State<'_,EngineState>)->AudioStatus{
    let running=state.audio_stop.lock().map(|slot|slot.is_some()).unwrap_or(false);
    AudioStatus{running,backend:"native".into(),sample_rate:None,input_channels:None,output_channels:None,input_device:None,output_device:None}
}

#[cfg(feature="native-audio")]
#[tauri::command]
fn start_audio(state:tauri::State<'_,EngineState>,prefer_asio:bool)->Result<AudioStatus,String>{
    use deep_audio_io::{BackendPreference,native::CpalDuplex};
    use deep_dsp::DeepGlue;
    use std::time::Duration;

    let mut slot=state.audio_stop.lock().map_err(|_|"audio service lock poisoned".to_string())?;
    if slot.is_some(){return Ok(AudioStatus{running:true,backend:"already-running".into(),sample_rate:None,input_channels:None,output_channels:None,input_device:None,output_device:None});}

    let handles=state.handles.clone();
    let meter=state.meter.clone();
    let(ready_tx,ready_rx)=std::sync::mpsc::channel::<Result<deep_audio_io::native::StreamInfo,String>>();
    let(stop_tx,stop_rx)=std::sync::mpsc::channel::<()>();

    std::thread::Builder::new().name("deep-audio-service".into()).spawn(move||{
        let processor=DeepGlue::new(handles,meter);
        let preference=if prefer_asio{BackendPreference::Asio}else{BackendPreference::Default};
        match CpalDuplex::start(processor,preference){
            Ok(stream)=>{
                let _=ready_tx.send(Ok(stream.info().clone()));
                let _=stop_rx.recv();
                drop(stream);
            }
            Err(error)=>{let _=ready_tx.send(Err(error.to_string()));}
        }
    }).map_err(|error|error.to_string())?;

    match ready_rx.recv_timeout(Duration::from_secs(4)){
        Ok(Ok(info))=>{
            *slot=Some(stop_tx);
            Ok(AudioStatus{
                running:true,
                backend:if prefer_asio{"asio".into()}else{"default".into()},
                sample_rate:Some(info.sample_rate),
                input_channels:Some(info.input_channels),
                output_channels:Some(info.output_channels),
                input_device:Some(info.input_device),
                output_device:Some(info.output_device),
            })
        }
        Ok(Err(error))=>Err(error),
        Err(error)=>Err(format!("audio service startup timeout: {error}")),
    }
}

#[cfg(not(feature="native-audio"))]
#[tauri::command]
fn start_audio(_:tauri::State<'_,EngineState>,_:bool)->Result<AudioStatus,String>{
    Err("native audio is disabled in this build; enable feature native-audio".into())
}

#[tauri::command]
fn stop_audio(state:tauri::State<'_,EngineState>)->Result<(),String>{
    let mut slot=state.audio_stop.lock().map_err(|_|"audio service lock poisoned".to_string())?;
    if let Some(stop)=slot.take(){let _=stop.send(());}
    Ok(())
}

pub fn run(){
    tauri::Builder::default()
        .manage(EngineState::new())
        .invoke_handler(tauri::generate_handler![
            health,
            parameter_snapshot,
            set_parameter,
            meter_snapshot,
            audio_status,
            start_audio,
            stop_audio
        ])
        .run(tauri::generate_context!())
        .expect("Deep Music Producer native runtime failed");
}
