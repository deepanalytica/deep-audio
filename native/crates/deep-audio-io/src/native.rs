use crate::BackendPreference;
use cpal::traits::{DeviceTrait,HostTrait,StreamTrait};
use deep_dsp::{AudioBlockMut,AudioProcessor,ProcessContext};
use deep_playback::PlaybackTap;
use deep_record::RecordingTap;
use deep_transport::SharedTransport;
use rtrb::RingBuffer;
use serde::Serialize;
use thiserror::Error;

#[derive(Debug,Error)]
pub enum AudioIoError{
    #[error("requested backend unavailable")]BackendUnavailable,
    #[error("no default input device")]NoInputDevice,
    #[error("no default output device")]NoOutputDevice,
    #[error("sample rates differ: input={input}, output={output}")]SampleRateMismatch{input:u32,output:u32},
    #[error("first native path currently requires f32 device streams")]UnsupportedSampleFormat,
    #[error("stream config error: {0}")]Config(String),
    #[error("stream build error: {0}")]Build(String),
    #[error("stream start error: {0}")]Play(String),
    #[error("device enumeration error: {0}")]Devices(String),
    #[error("audio device not found: {0}")]DeviceNotFound(String),
}

#[derive(Debug,Clone,Serialize)]
pub struct StreamInfo{
    pub sample_rate:u32,
    pub input_channels:u16,
    pub output_channels:u16,
    pub input_device:String,
    pub output_device:String,
}

#[derive(Debug,Clone,Serialize)]
pub struct AudioDeviceInfo{
    pub name:String,
    pub can_input:bool,
    pub can_output:bool,
    pub default_input:bool,
    pub default_output:bool,
}

fn resolve_host(preference:BackendPreference)->Result<cpal::Host,AudioIoError>{
    match preference{
        BackendPreference::Default=>Ok(cpal::default_host()),
        BackendPreference::Asio=>{
            #[cfg(all(target_os="windows",feature="asio"))]
            {cpal::host_from_id(cpal::HostId::Asio).map_err(|_|AudioIoError::BackendUnavailable)}
            #[cfg(not(all(target_os="windows",feature="asio")))]
            {Err(AudioIoError::BackendUnavailable)}
        }
    }
}

pub fn list_devices(preference:BackendPreference)->Result<Vec<AudioDeviceInfo>,AudioIoError>{
    use std::collections::BTreeMap;
    let host=resolve_host(preference)?;
    let default_input=host.default_input_device().and_then(|d|d.name().ok());
    let default_output=host.default_output_device().and_then(|d|d.name().ok());
    let mut map:BTreeMap<String,AudioDeviceInfo>=BTreeMap::new();

    for device in host.input_devices().map_err(|e|AudioIoError::Devices(e.to_string()))?{
        let name=device.name().unwrap_or_else(|_|"Unnamed input".into());
        let entry=map.entry(name.clone()).or_insert(AudioDeviceInfo{
            name:name.clone(),can_input:false,can_output:false,
            default_input:default_input.as_deref()==Some(name.as_str()),
            default_output:default_output.as_deref()==Some(name.as_str()),
        });
        entry.can_input=true;
    }
    for device in host.output_devices().map_err(|e|AudioIoError::Devices(e.to_string()))?{
        let name=device.name().unwrap_or_else(|_|"Unnamed output".into());
        let entry=map.entry(name.clone()).or_insert(AudioDeviceInfo{
            name:name.clone(),can_input:false,can_output:false,
            default_input:default_input.as_deref()==Some(name.as_str()),
            default_output:default_output.as_deref()==Some(name.as_str()),
        });
        entry.can_output=true;
    }
    Ok(map.into_values().collect())
}

pub struct CpalDuplex{_input:cpal::Stream,_output:cpal::Stream,info:StreamInfo}
impl CpalDuplex{
    pub fn info(&self)->&StreamInfo{&self.info}

    pub fn start<P>(processor:P,preference:BackendPreference)->Result<Self,AudioIoError>
    where P:AudioProcessor+'static{
        Self::start_with_runtime(processor,preference,None,None,None)
    }

    pub fn start_with_runtime<P>(
        processor:P,
        preference:BackendPreference,
        recorder:Option<RecordingTap>,
        playback:Option<PlaybackTap>,
        transport:Option<SharedTransport>,
    )->Result<Self,AudioIoError>
    where P:AudioProcessor+'static{
        Self::start_with_devices(processor,preference,recorder,playback,transport,None,None)
    }

    pub fn start_with_devices<P>(
        mut processor:P,
        preference:BackendPreference,
        mut recorder:Option<RecordingTap>,
        mut playback:Option<PlaybackTap>,
        transport:Option<SharedTransport>,
        input_name:Option<&str>,
        output_name:Option<&str>,
    )->Result<Self,AudioIoError>
    where P:AudioProcessor+'static{
        let host=resolve_host(preference)?;

        let input_device=if let Some(name)=input_name{
            host.input_devices()
                .map_err(|e|AudioIoError::Devices(e.to_string()))?
                .find(|device|device.name().ok().as_deref()==Some(name))
                .ok_or_else(||AudioIoError::DeviceNotFound(name.to_string()))?
        }else{
            host.default_input_device().ok_or(AudioIoError::NoInputDevice)?
        };

        let output_device=if let Some(name)=output_name{
            host.output_devices()
                .map_err(|e|AudioIoError::Devices(e.to_string()))?
                .find(|device|device.name().ok().as_deref()==Some(name))
                .ok_or_else(||AudioIoError::DeviceNotFound(name.to_string()))?
        }else{
            host.default_output_device().ok_or(AudioIoError::NoOutputDevice)?
        };
        let input_supported=input_device.default_input_config().map_err(|e|AudioIoError::Config(e.to_string()))?;
        let output_supported=output_device.default_output_config().map_err(|e|AudioIoError::Config(e.to_string()))?;
        if input_supported.sample_format()!=cpal::SampleFormat::F32||output_supported.sample_format()!=cpal::SampleFormat::F32{return Err(AudioIoError::UnsupportedSampleFormat);}
        let input_config:cpal::StreamConfig=input_supported.into();
        let output_config:cpal::StreamConfig=output_supported.into();
        if input_config.sample_rate.0!=output_config.sample_rate.0{return Err(AudioIoError::SampleRateMismatch{input:input_config.sample_rate.0,output:output_config.sample_rate.0});}
        let in_ch=usize::from(input_config.channels);
        let out_ch=usize::from(output_config.channels);
        let sample_rate=output_config.sample_rate.0;
        let capacity=((sample_rate as usize*out_ch)/4).max(4096);
        let(mut producer,mut consumer)=RingBuffer::<f32>::new(capacity);

        let input_stream=input_device.build_input_stream(
            &input_config,
            move|data:&[f32],_|{
                for frame in data.chunks_exact(in_ch){
                    for out in 0..out_ch{
                        let source=out.min(in_ch.saturating_sub(1));
                        let _=producer.push(frame[source]);
                    }
                }
            },
            move|err|{eprintln!("Deep Audio input stream error: {err}");},
            None
        ).map_err(|e|AudioIoError::Build(e.to_string()))?;

        processor.prepare(sample_rate as f32,2048);
        let ctx=ProcessContext{sample_rate:sample_rate as f32};
        let transport_for_callback=transport.clone();

        let output_stream=output_device.build_output_stream(
            &output_config,
            move|data:&mut[f32],_|{
                for sample in data.iter_mut(){*sample=consumer.pop().unwrap_or(0.0);}
                if let Some(mut block)=AudioBlockMut::new(data,out_ch){
                    let frames=block.frames() as u64;
                    processor.process(&mut block,ctx);
                    if let Some(playback)=playback.as_mut(){playback.mix_into(data);}
                    if let Some(recorder)=recorder.as_mut(){recorder.capture(data);}
                    if let Some(transport)=transport_for_callback.as_ref(){transport.advance(frames);}
                }
            },
            move|err|{eprintln!("Deep Audio output stream error: {err}");},
            None
        ).map_err(|e|AudioIoError::Build(e.to_string()))?;

        input_stream.play().map_err(|e|AudioIoError::Play(e.to_string()))?;
        output_stream.play().map_err(|e|AudioIoError::Play(e.to_string()))?;

        let info=StreamInfo{
            sample_rate,input_channels:input_config.channels,output_channels:output_config.channels,
            input_device:input_device.name().unwrap_or_else(|_|"Input".into()),
            output_device:output_device.name().unwrap_or_else(|_|"Output".into()),
        };
        Ok(Self{_input:input_stream,_output:output_stream,info})
    }
}
