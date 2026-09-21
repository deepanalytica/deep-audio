use crate::BackendPreference;
use cpal::traits::{DeviceTrait,HostTrait,StreamTrait};
use deep_dsp::{AudioBlockMut,AudioProcessor,ProcessContext};
use rtrb::RingBuffer;
use thiserror::Error;

#[derive(Debug,Error)]
pub enum AudioIoError{
    #[error("requested backend unavailable")]BackendUnavailable,
    #[error("no default input device")]NoInputDevice,
    #[error("no default output device")]NoOutputDevice,
    #[error("sample rates differ: input={input}, output={output}")]SampleRateMismatch{input:u32,output:u32},
    #[error("first proof currently requires f32 device streams")]UnsupportedSampleFormat,
    #[error("stream config error: {0}")]Config(String),
    #[error("stream build error: {0}")]Build(String),
    #[error("stream start error: {0}")]Play(String),
}

#[derive(Debug,Clone)]
pub struct StreamInfo{pub sample_rate:u32,pub input_channels:u16,pub output_channels:u16,pub input_device:String,pub output_device:String}

pub struct CpalDuplex{_input:cpal::Stream,_output:cpal::Stream,info:StreamInfo}
impl CpalDuplex{
    pub fn info(&self)->&StreamInfo{&self.info}
    pub fn start<P>(mut processor:P,preference:BackendPreference)->Result<Self,AudioIoError> where P:AudioProcessor+'static{
        let host=match preference{
            BackendPreference::Default=>cpal::default_host(),
            BackendPreference::Asio=>{
                #[cfg(all(target_os="windows",feature="asio"))]
                {cpal::host_from_id(cpal::HostId::Asio).map_err(|_|AudioIoError::BackendUnavailable)?}
                #[cfg(not(all(target_os="windows",feature="asio")))]
                {return Err(AudioIoError::BackendUnavailable);}
            }
        };
        let input_device=host.default_input_device().ok_or(AudioIoError::NoInputDevice)?;
        let output_device=host.default_output_device().ok_or(AudioIoError::NoOutputDevice)?;
        let input_supported=input_device.default_input_config().map_err(|e|AudioIoError::Config(e.to_string()))?;
        let output_supported=output_device.default_output_config().map_err(|e|AudioIoError::Config(e.to_string()))?;
        if input_supported.sample_format()!=cpal::SampleFormat::F32||output_supported.sample_format()!=cpal::SampleFormat::F32{return Err(AudioIoError::UnsupportedSampleFormat);}
        let input_config:cpal::StreamConfig=input_supported.into();
        let output_config:cpal::StreamConfig=output_supported.into();
        if input_config.sample_rate.0!=output_config.sample_rate.0{return Err(AudioIoError::SampleRateMismatch{input:input_config.sample_rate.0,output:output_config.sample_rate.0});}
        let in_ch=usize::from(input_config.channels); let out_ch=usize::from(output_config.channels); let sample_rate=output_config.sample_rate.0;
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
        let output_stream=output_device.build_output_stream(
            &output_config,
            move|data:&mut[f32],_|{
                for sample in data.iter_mut(){*sample=consumer.pop().unwrap_or(0.0);}
                if let Some(mut block)=AudioBlockMut::new(data,out_ch){processor.process(&mut block,ctx);}
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
