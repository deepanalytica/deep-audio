#![deny(unsafe_code)]

use clack_extensions::state::{PluginState,PluginStateImpl};
use clack_extensions::{audio_ports::*,params::*};
use clack_plugin::events::spaces::CoreEventSpace;
use clack_plugin::prelude::*;
use clack_plugin::stream::{InputStream,OutputStream};
use deep_dsp::{AudioProcessor,DeepGlue,DeepGlueHandles,GLUE_SPECS};
use deep_metering::SharedMeter;
use deep_params::{ParameterBank,ParameterHandle,ParameterId};
use std::ffi::CStr;
use std::fmt::Write as _;
use std::io::{Read,Write as _};

pub struct DeepGluePlugin;

impl Plugin for DeepGluePlugin{
    type AudioProcessor<'a>=DeepGlueAudioProcessor<'a>;
    type Shared<'a>=DeepGlueShared;
    type MainThread<'a>=DeepGlueMainThread<'a>;

    fn declare_extensions(builder:&mut PluginExtensions<Self>,_:Option<&DeepGlueShared>){
        builder.register::<PluginAudioPorts>().register::<PluginParams>().register::<PluginState>();
    }
}

impl DefaultPluginFactory for DeepGluePlugin{
    fn get_descriptor()->PluginDescriptor{
        use clack_plugin::plugin::features::*;
        PluginDescriptor::new("cl.deepanalytica.deep-glue","Deep Glue")
            .with_vendor("Deep Analytica")
            .with_description("Deep Music Producer stereo bus compressor")
            .with_features([AUDIO_EFFECT,STEREO,COMPRESSOR])
    }
    fn new_shared(_:HostSharedHandle<'_>)->Result<Self::Shared<'_>,PluginError>{Ok(DeepGlueShared::new())}
    fn new_main_thread<'a>(_:HostMainThreadHandle<'a>,shared:&'a Self::Shared<'a>)->Result<Self::MainThread<'a>,PluginError>{Ok(DeepGlueMainThread{shared})}
}

pub struct DeepGlueShared{bank:ParameterBank,handles:DeepGlueHandles,meter:SharedMeter}
impl DeepGlueShared{
    fn new()->Self{
        let mut bank=ParameterBank::new();let handles=DeepGlueHandles::register(&mut bank);
        Self{bank,handles,meter:SharedMeter::new()}
    }
    fn handle_for_clap(&self,id:ClapId)->Option<&ParameterHandle>{self.handles.by_id(ParameterId(id.get()))}
    fn handle_event(&self,event:&UnknownEvent){
        if let Some(CoreEventSpace::ParamValue(event))=event.as_core_event(){
            if let Some(param_id)=event.param_id(){
                if let Some(handle)=self.handle_for_clap(param_id){handle.set(event.value() as f32);}
            }
        }
    }
}
impl PluginShared<'_> for DeepGlueShared{}

pub struct DeepGlueMainThread<'a>{shared:&'a DeepGlueShared}
impl<'a> PluginMainThread<'a,DeepGlueShared> for DeepGlueMainThread<'a>{}

pub struct DeepGlueAudioProcessor<'a>{shared:&'a DeepGlueShared,processor:DeepGlue}
impl<'a> PluginAudioProcessor<'a,DeepGlueShared,DeepGlueMainThread<'a>> for DeepGlueAudioProcessor<'a>{
    fn activate(_:HostAudioProcessorHandle<'a>,_:&DeepGlueMainThread,shared:&'a DeepGlueShared,config:PluginAudioConfiguration)->Result<Self,PluginError>{
        let mut processor=DeepGlue::new(shared.handles.clone(),shared.meter.clone());
        processor.prepare(config.sample_rate as f32,config.max_frames_count as usize);
        Ok(Self{shared,processor})
    }
    fn process(&mut self,_:Process,mut audio:Audio,events:Events)->Result<ProcessStatus,PluginError>{
        for event in events.input{self.shared.handle_event(event);}
        let mut port=audio.port_pair(0).ok_or(PluginError::Message("Deep Glue requires one stereo port pair"))?;
        let mut channels=port.channels()?.into_f32().ok_or(PluginError::Message("Deep Glue expects f32 audio"))?;
        let mut buffers=[None,None];
        for(channel,target)in channels.iter_mut().take(2).zip(&mut buffers){
            *target=match channel{
                ChannelPair::InputOnly(_)|ChannelPair::OutputOnly(_)=>None,
                ChannelPair::InPlace(buffer)=>Some(buffer),
                ChannelPair::InputOutput(input,output)=>{output.copy_from_slice(input);Some(output)}
            };
        }
        let [Some(left),Some(right)]=buffers else{return Err(PluginError::Message("Deep Glue requires stereo channels"));};
        let frames=left.len().min(right.len());
        self.processor.begin_external_block();
        for index in 0..frames{self.processor.process_stereo_pair(&mut left[index],&mut right[index]);}
        self.processor.end_external_block();
        Ok(ProcessStatus::ContinueIfNotQuiet)
    }
}

impl PluginAudioPortsImpl for DeepGlueMainThread<'_>{
    fn count(&self,_:bool)->u32{1}
    fn get(&self,index:u32,_:bool,writer:&mut AudioPortInfoWriter){
        if index==0{writer.set(&AudioPortInfo{id:ClapId::new(0),name:b"main",channel_count:2,flags:AudioPortFlags::IS_MAIN,port_type:Some(AudioPortType::STEREO),in_place_pair:None});}
    }
}

fn spec_for_index(index:u32)->Option<&'static deep_params::ParameterSpec>{GLUE_SPECS.get(index as usize)}

impl PluginMainThreadParams for DeepGlueMainThread<'_>{
    fn count(&self)->u32{GLUE_SPECS.len() as u32}
    fn get_info(&self,index:u32,writer:&mut ParamInfoWriter){
        let Some(spec)=spec_for_index(index)else{return;};
        writer.set(&ParamInfo{
            id:ClapId::new(spec.id.0),flags:ParamInfoFlags::IS_AUTOMATABLE,cookie:Default::default(),
            name:spec.name.as_bytes(),module:b"",min_value:spec.min as f64,max_value:spec.max as f64,default_value:spec.default as f64,
        });
    }
    fn get_value(&self,param_id:ClapId)->Option<f64>{self.shared.handle_for_clap(param_id).map(|h|h.get() as f64)}
    fn value_to_text(&self,param_id:ClapId,value:f64,writer:&mut ParamDisplayWriter)->std::fmt::Result{
        let spec=GLUE_SPECS.iter().find(|s|s.id.0==param_id.get()).ok_or(std::fmt::Error)?;
        write!(writer,"{value:.2} {}",spec.unit)
    }
    fn text_to_value(&self,param_id:ClapId,text:&CStr)->Option<f64>{
        let spec=GLUE_SPECS.iter().find(|s|s.id.0==param_id.get())?;
        let text=text.to_str().ok()?.trim();let number=text.strip_suffix(spec.unit).unwrap_or(text).trim().parse::<f64>().ok()?;
        Some(number.clamp(spec.min as f64,spec.max as f64))
    }
    fn flush(&self,input:&InputEvents,_:&mut OutputEvents){for event in input{self.shared.handle_event(event);}}
}
impl PluginAudioProcessorParams for DeepGlueAudioProcessor<'_>{
    fn flush(&mut self,input:&InputEvents,_:&mut OutputEvents){for event in input{self.shared.handle_event(event);}}
}

impl PluginStateImpl for DeepGlueMainThread<'_>{
    fn save(&self,output:&mut OutputStream)->Result<(),PluginError>{
        for spec in GLUE_SPECS{
            let value=self.shared.bank.get(spec.id).map(|v|v.get()).unwrap_or(spec.default);
            output.write_all(&value.to_le_bytes())?;
        }
        Ok(())
    }
    fn load(&self,input:&mut InputStream)->Result<(),PluginError>{
        for spec in GLUE_SPECS{
            let mut bytes=[0_u8;4];input.read_exact(&mut bytes)?;
            self.shared.bank.set(spec.id,f32::from_le_bytes(bytes));
        }
        Ok(())
    }
}

clack_export_entry!(SinglePluginEntry<DeepGluePlugin>);
