use deep_dsp::{AudioBlockMut,AudioProcessor,DeepGlue,DeepGlueHandles,ProcessContext};
use deep_metering::SharedMeter;
use deep_params::ParameterBank;

fn build_glue()->(ParameterBank,DeepGlue,SharedMeter){
    let mut bank=ParameterBank::new();let handles=DeepGlueHandles::register(&mut bank);let meter=SharedMeter::new();
    let glue=DeepGlue::new(handles,meter.clone());(bank,glue,meter)
}
fn offline_proof(){
    let(bank,mut glue,meter)=build_glue();
    bank.set(deep_dsp::ids::GLUE_THRESHOLD_DB,-24.0);bank.set(deep_dsp::ids::GLUE_RATIO,6.0);bank.set(deep_dsp::ids::GLUE_MAKEUP_DB,2.0);
    let sr=48_000.0;let frames=48_000;let mut audio=vec![0.0_f32;frames*2];
    for frame in 0..frames{
        let t=frame as f32/sr;let carrier=(t*220.0*std::f32::consts::TAU).sin();let amp=if frame%6000<300{0.8}else{0.25};let sample=carrier*amp;
        audio[frame*2]=sample;audio[frame*2+1]=sample;
    }
    glue.prepare(sr,512);
    for chunk in audio.chunks_mut(1024){let mut block=AudioBlockMut::new(chunk,2).unwrap();glue.process(&mut block,ProcessContext{sample_rate:sr});}
    let m=meter.snapshot();println!("Deep Audio proof OK | peak={:.3} rms={:.3} GR={:.2} dB",m.peak,m.rms,m.gain_reduction_db);
}
#[cfg(feature="native-audio")]
fn live_proof(asio:bool){
    use deep_audio_io::{BackendPreference,native::CpalDuplex};
    let(_bank,glue,_meter)=build_glue();let pref=if asio{BackendPreference::Asio}else{BackendPreference::Default};
    match CpalDuplex::start(glue,pref){
        Ok(stream)=>{println!("Live engine running: {:?}",stream.info());println!("Press ENTER to stop.");let mut s=String::new();let _=std::io::stdin().read_line(&mut s);}
        Err(error)=>{eprintln!("Could not start audio: {error}");std::process::exit(2);}
    }
}
fn main(){
    let args:Vec<String>=std::env::args().skip(1).collect();let live=args.iter().any(|a|a=="--live");let asio=args.iter().any(|a|a=="--asio");
    if live{
        #[cfg(feature="native-audio")]{live_proof(asio);return;}
        #[cfg(not(feature="native-audio"))]{eprintln!("Rebuild with --features native-audio or asio.");std::process::exit(2);}
    }
    let _=asio;offline_proof();
}
