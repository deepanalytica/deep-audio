#![forbid(unsafe_code)]

use deep_dsp::DeepGlueHandles;
use deep_metering::{MeterSnapshot,SharedMeter};
use deep_params::{ParameterBank,ParameterId,ParameterSnapshot};
use deep_record::{RecorderController,RecordingSpec,RecordingSummary};
use deep_session::{ClipState,ExportState,RoomId,Session,CURRENT_SCHEMA_VERSION};
use deep_transport::{SharedTransport,TransportSnapshot as RtTransportSnapshot};
use serde::Serialize;
use std::path::{Path,PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime,UNIX_EPOCH};

#[derive(Serialize)]
struct Health{
    product:&'static str,
    rust_core:bool,
    schema_version:u32,
}

#[derive(Serialize,Clone)]
struct AudioStatus{
    running:bool,
    backend:String,
    sample_rate:Option<u32>,
    input_channels:Option<u16>,
    output_channels:Option<u16>,
    input_device:Option<String>,
    output_device:Option<String>,
}

struct AudioService{
    stop:std::sync::mpsc::Sender<()>,
    recorder:RecorderController,
    info:deep_audio_io::native::StreamInfo,
    backend:String,
}

struct EngineState{
    params:ParameterBank,
    handles:DeepGlueHandles,
    meter:SharedMeter,
    transport:SharedTransport,
    audio:Mutex<Option<AudioService>>,
    session:Mutex<Session>,
    last_recording:Mutex<Option<RecordingSummary>>,
}

impl EngineState{
    fn new()->Self{
        let mut params=ParameterBank::new();
        let handles=DeepGlueHandles::register(&mut params);
        Self{
            params,
            handles,
            meter:SharedMeter::new(),
            transport:SharedTransport::default(),
            audio:Mutex::new(None),
            session:Mutex::new(Session::new("Deep Session")),
            last_recording:Mutex::new(None),
        }
    }
}

fn unix_now()->u64{
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d|d.as_secs()).unwrap_or(0)
}

fn home_dir()->PathBuf{
    std::env::var_os("USERPROFILE")
        .or_else(||std::env::var_os("HOME"))
        .map(PathBuf::from)
        .unwrap_or_else(std::env::temp_dir)
}

fn product_root()->PathBuf{
    home_dir().join("Music").join("Deep Music Producer")
}

fn sanitized_name(value:&str)->String{
    let mut out=String::with_capacity(value.len());
    for ch in value.chars(){
        if ch.is_ascii_alphanumeric()||matches!(ch,'-'|'_'|' '){out.push(ch);}else{out.push('_');}
    }
    let out=out.trim().trim_matches('.').to_string();
    if out.is_empty(){"Deep Session".into()}else{out}
}

fn session_transport_from_rt(snapshot:RtTransportSnapshot)->deep_session::TransportSnapshot{
    deep_session::TransportSnapshot{
        playing:snapshot.playing,
        recording:snapshot.recording,
        position_samples:snapshot.position_samples,
        bpm:snapshot.bpm,
    }
}

fn status_from_service(service:&AudioService)->AudioStatus{
    AudioStatus{
        running:true,
        backend:service.backend.clone(),
        sample_rate:Some(service.info.sample_rate),
        input_channels:Some(service.info.input_channels),
        output_channels:Some(service.info.output_channels),
        input_device:Some(service.info.input_device.clone()),
        output_device:Some(service.info.output_device.clone()),
    }
}

#[tauri::command]
fn health()->Health{Health{product:"Deep Music Producer",rust_core:true,schema_version:CURRENT_SCHEMA_VERSION}}

#[tauri::command]
fn parameter_snapshot(state:tauri::State<'_,EngineState>)->Vec<ParameterSnapshot>{state.params.snapshots()}

#[tauri::command]
fn set_parameter(state:tauri::State<'_,EngineState>,id:u32,value:f32)->Result<f32,String>{
    let parameter_id=ParameterId(id);
    if !state.params.set(parameter_id,value){return Err(format!("unknown parameter id {id}"));}
    let applied=state.params.get(parameter_id).expect("parameter exists").get();
    if let Ok(mut session)=state.session.lock(){session.set_parameter("deep_glue",parameter_id,applied);}
    Ok(applied)
}

#[tauri::command]
fn meter_snapshot(state:tauri::State<'_,EngineState>)->MeterSnapshot{state.meter.snapshot()}

#[tauri::command]
fn transport_snapshot(state:tauri::State<'_,EngineState>)->RtTransportSnapshot{state.transport.snapshot()}

#[tauri::command]
fn transport_command(
    state:tauri::State<'_,EngineState>,
    action:String,
    bpm:Option<f64>,
    position_samples:Option<u64>,
)->Result<RtTransportSnapshot,String>{
    if let Some(bpm)=bpm{state.transport.set_bpm(bpm);}
    if let Some(position)=position_samples{state.transport.seek_samples(position);}
    match action.as_str(){
        "play"=>state.transport.play(),
        "pause"=>state.transport.pause(),
        "stop"=>state.transport.stop(),
        "seek"=>{},
        "bpm"=>{},
        other=>return Err(format!("unknown transport action {other}")),
    }
    let snapshot=state.transport.snapshot();
    if let Ok(mut session)=state.session.lock(){session.transport=session_transport_from_rt(snapshot);}
    Ok(snapshot)
}

#[tauri::command]
fn set_room(state:tauri::State<'_,EngineState>,room:String)->Result<(),String>{
    let room=RoomId::parse(&room).ok_or_else(||format!("unknown room {room}"))?;
    let mut session=state.session.lock().map_err(|_|"session lock poisoned".to_string())?;
    session.active_room=room;
    Ok(())
}

#[tauri::command]
fn session_snapshot(state:tauri::State<'_,EngineState>)->Result<Session,String>{
    let mut session=state.session.lock().map_err(|_|"session lock poisoned".to_string())?;
    session.transport=session_transport_from_rt(state.transport.snapshot());
    Ok(session.clone())
}

#[tauri::command]
fn save_session(state:tauri::State<'_,EngineState>,name:Option<String>)->Result<String,String>{
    let mut session=state.session.lock().map_err(|_|"session lock poisoned".to_string())?;
    if let Some(name)=name{session.name=sanitized_name(&name);}
    session.schema_version=CURRENT_SCHEMA_VERSION;
    session.transport=session_transport_from_rt(state.transport.snapshot());
    let dir=product_root().join("Projects");
    std::fs::create_dir_all(&dir).map_err(|e|e.to_string())?;
    let path=dir.join(format!("{}.deepmusic.json",sanitized_name(&session.name)));
    let json=serde_json::to_string_pretty(&*session).map_err(|e|e.to_string())?;
    std::fs::write(&path,json).map_err(|e|e.to_string())?;
    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
fn load_session(state:tauri::State<'_,EngineState>,path:String)->Result<Session,String>{
    let raw=std::fs::read_to_string(&path).map_err(|e|e.to_string())?;
    let mut loaded:Session=serde_json::from_str(&raw).map_err(|e|e.to_string())?;
    loaded.schema_version=CURRENT_SCHEMA_VERSION;
    for device in &loaded.devices{
        for parameter in &device.parameters{
            let _=state.params.set(parameter.id,parameter.value);
        }
    }
    state.transport.set_bpm(loaded.transport.bpm);
    state.transport.seek_samples(loaded.transport.position_samples);
    if loaded.transport.playing{state.transport.play();}else{state.transport.pause();}
    state.transport.set_recording(false);
    let mut session=state.session.lock().map_err(|_|"session lock poisoned".to_string())?;
    *session=loaded.clone();
    Ok(loaded)
}

#[tauri::command]
fn audio_status(state:tauri::State<'_,EngineState>)->AudioStatus{
    state.audio.lock().ok().and_then(|slot|slot.as_ref().map(status_from_service)).unwrap_or(AudioStatus{
        running:false,backend:"native".into(),sample_rate:None,input_channels:None,output_channels:None,input_device:None,output_device:None
    })
}

#[cfg(feature="native-audio")]
#[tauri::command]
fn list_audio_devices(prefer_asio:bool)->Result<Vec<deep_audio_io::native::AudioDeviceInfo>,String>{
    use deep_audio_io::{BackendPreference,native::list_devices};
    let preference=if prefer_asio{BackendPreference::Asio}else{BackendPreference::Default};
    list_devices(preference).map_err(|e|e.to_string())
}

#[cfg(not(feature="native-audio"))]
#[tauri::command]
fn list_audio_devices(_:bool)->Result<Vec<String>,String>{
    Err("native audio is disabled in this build".into())
}

#[cfg(feature="native-audio")]
#[tauri::command]
fn start_audio(state:tauri::State<'_,EngineState>,prefer_asio:bool)->Result<AudioStatus,String>{
    use deep_audio_io::{BackendPreference,native::CpalDuplex};
    use deep_dsp::DeepGlue;
    use std::time::Duration;

    let mut slot=state.audio.lock().map_err(|_|"audio service lock poisoned".to_string())?;
    if let Some(service)=slot.as_ref(){return Ok(status_from_service(service));}

    let handles=state.handles.clone();
    let meter=state.meter.clone();
    let transport=state.transport.clone();
    let recorder_capacity=48_000usize*2*8;
    let(recorder,tap)=RecorderController::new(recorder_capacity);
    let(ready_tx,ready_rx)=std::sync::mpsc::channel::<Result<deep_audio_io::native::StreamInfo,String>>();
    let(stop_tx,stop_rx)=std::sync::mpsc::channel::<()>();
    let preference=if prefer_asio{BackendPreference::Asio}else{BackendPreference::Default};

    std::thread::Builder::new().name("deep-audio-service".into()).spawn(move||{
        let processor=DeepGlue::new(handles,meter);
        match CpalDuplex::start_with_runtime(processor,preference,Some(tap),Some(transport)){
            Ok(stream)=>{
                let _=ready_tx.send(Ok(stream.info().clone()));
                let _=stop_rx.recv();
                drop(stream);
            }
            Err(error)=>{let _=ready_tx.send(Err(error.to_string()));}
        }
    }).map_err(|error|error.to_string())?;

    match ready_rx.recv_timeout(Duration::from_secs(5)){
        Ok(Ok(info))=>{
            let backend=if prefer_asio{"asio".into()}else{"default".into()};
            let service=AudioService{stop:stop_tx,recorder,info,backend};
            let status=status_from_service(&service);
            *slot=Some(service);
            Ok(status)
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
    let mut slot=state.audio.lock().map_err(|_|"audio service lock poisoned".to_string())?;
    if let Some(mut service)=slot.take(){
        if service.recorder.is_recording(){
            let _=service.recorder.stop();
        }
        service.recorder.shutdown();
        let _=service.stop.send(());
    }
    state.transport.stop();
    Ok(())
}

#[tauri::command]
fn start_recording(state:tauri::State<'_,EngineState>,name:Option<String>)->Result<String,String>{
    let slot=state.audio.lock().map_err(|_|"audio service lock poisoned".to_string())?;
    let service=slot.as_ref().ok_or_else(||"start native audio before recording".to_string())?;
    if service.recorder.is_recording(){return Err("recording already active".into());}
    let base=sanitized_name(name.as_deref().unwrap_or("take"));
    let path=product_root().join("Recordings").join(format!("{base}-{}.wav",unix_now()));
    let spec=RecordingSpec{sample_rate:service.info.sample_rate,channels:service.info.output_channels.max(1)};
    let started=service.recorder.start(&path,spec).map_err(|e|e.to_string())?;
    state.transport.set_recording(true);
    if let Ok(mut session)=state.session.lock(){session.transport=session_transport_from_rt(state.transport.snapshot());}
    Ok(started)
}

#[tauri::command]
fn stop_recording(state:tauri::State<'_,EngineState>)->Result<RecordingSummary,String>{
    let slot=state.audio.lock().map_err(|_|"audio service lock poisoned".to_string())?;
    let service=slot.as_ref().ok_or_else(||"audio engine is not running".to_string())?;
    let start_sample=state.transport.snapshot().position_samples;
    let summary=service.recorder.stop().map_err(|e|e.to_string())?;
    state.transport.set_recording(false);

    {
        let mut session=state.session.lock().map_err(|_|"session lock poisoned".to_string())?;
        let clip_start=start_sample.saturating_sub(summary.frames);
        session.append_recording(ClipState{
            id:format!("clip-{}",unix_now()),
            path:summary.path.clone(),
            start_sample:clip_start,
            length_samples:summary.frames,
            sample_rate:summary.sample_rate,
            channels:summary.channels,
        });
        session.transport=session_transport_from_rt(state.transport.snapshot());
    }
    if let Ok(mut last)=state.last_recording.lock(){*last=Some(summary.clone());}
    Ok(summary)
}

#[tauri::command]
fn export_last_recording(state:tauri::State<'_,EngineState>,name:Option<String>)->Result<String,String>{
    let summary=state.last_recording.lock().map_err(|_|"recording state lock poisoned".to_string())?
        .clone().ok_or_else(||"no completed recording to export".to_string())?;
    let source=Path::new(&summary.path);
    if !source.exists(){return Err("last recording file no longer exists".into());}
    let export_name=sanitized_name(name.as_deref().unwrap_or("Deep Music Export"));
    let dir=product_root().join("Exports");
    std::fs::create_dir_all(&dir).map_err(|e|e.to_string())?;
    let destination=dir.join(format!("{export_name}-{}.wav",unix_now()));
    std::fs::copy(source,&destination).map_err(|e|e.to_string())?;
    if let Ok(mut session)=state.session.lock(){
        session.exports.push(ExportState{
            path:destination.to_string_lossy().into_owned(),
            created_unix:unix_now(),
            format:"wav-f32".into(),
        });
    }
    Ok(destination.to_string_lossy().into_owned())
}

pub fn run(){
    tauri::Builder::default()
        .manage(EngineState::new())
        .invoke_handler(tauri::generate_handler![
            health,
            parameter_snapshot,
            set_parameter,
            meter_snapshot,
            transport_snapshot,
            transport_command,
            set_room,
            session_snapshot,
            save_session,
            load_session,
            audio_status,
            list_audio_devices,
            start_audio,
            stop_audio,
            start_recording,
            stop_recording,
            export_last_recording
        ])
        .run(tauri::generate_context!())
        .expect("Deep Music Producer native runtime failed");
}
