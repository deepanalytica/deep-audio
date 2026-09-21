#![forbid(unsafe_code)]

//! Deep Music Producer DSP core. This crate has no UI, filesystem, network,
//! platform SDK or async-runtime dependencies.

use deep_metering::{MeterAccumulator, SharedMeter};
use deep_params::{LinearSmoother, ParameterBank, ParameterHandle, ParameterId, ParameterSpec};

pub mod ids {
    use deep_params::ParameterId;
    pub const GAIN_DB: ParameterId = ParameterId(1_001);
    pub const GLUE_THRESHOLD_DB: ParameterId = ParameterId(2_001);
    pub const GLUE_RATIO: ParameterId = ParameterId(2_002);
    pub const GLUE_ATTACK_MS: ParameterId = ParameterId(2_003);
    pub const GLUE_RELEASE_MS: ParameterId = ParameterId(2_004);
    pub const GLUE_MAKEUP_DB: ParameterId = ParameterId(2_005);
    pub const GLUE_MIX_PERCENT: ParameterId = ParameterId(2_006);
}

pub const GAIN_SPEC: ParameterSpec = ParameterSpec {
    id: ids::GAIN_DB, key: "deep_gain.gain_db", name: "Gain", unit: "dB",
    min: -60.0, max: 24.0, default: 0.0, smoothing_ms: 12.0,
};

pub const GLUE_SPECS: [ParameterSpec; 6] = [
    ParameterSpec { id:ids::GLUE_THRESHOLD_DB,key:"deep_glue.threshold_db",name:"Threshold",unit:"dB",min:-60.0,max:0.0,default:-18.0,smoothing_ms:15.0 },
    ParameterSpec { id:ids::GLUE_RATIO,key:"deep_glue.ratio",name:"Ratio",unit:":1",min:1.0,max:20.0,default:4.0,smoothing_ms:15.0 },
    ParameterSpec { id:ids::GLUE_ATTACK_MS,key:"deep_glue.attack_ms",name:"Attack",unit:"ms",min:0.1,max:100.0,default:10.0,smoothing_ms:0.0 },
    ParameterSpec { id:ids::GLUE_RELEASE_MS,key:"deep_glue.release_ms",name:"Release",unit:"ms",min:10.0,max:1500.0,default:120.0,smoothing_ms:0.0 },
    ParameterSpec { id:ids::GLUE_MAKEUP_DB,key:"deep_glue.makeup_db",name:"Makeup",unit:"dB",min:-12.0,max:24.0,default:0.0,smoothing_ms:15.0 },
    ParameterSpec { id:ids::GLUE_MIX_PERCENT,key:"deep_glue.mix_percent",name:"Mix",unit:"%",min:0.0,max:100.0,default:100.0,smoothing_ms:15.0 },
];

pub struct AudioBlockMut<'a> { samples:&'a mut [f32], channels:usize }
impl<'a> AudioBlockMut<'a> {
    pub fn new(samples:&'a mut [f32], channels:usize) -> Option<Self> {
        if channels==0 || samples.len()%channels!=0 { return None; }
        Some(Self{samples,channels})
    }
    #[inline] pub fn channels(&self)->usize{self.channels}
    #[inline] pub fn frames(&self)->usize{self.samples.len()/self.channels}
    #[inline] pub fn samples_mut(&mut self)->&mut[f32]{self.samples}
}

#[derive(Debug,Clone,Copy)]
pub struct ProcessContext{pub sample_rate:f32}

pub trait AudioProcessor:Send{
    fn prepare(&mut self,sample_rate:f32,max_block_frames:usize);
    fn reset(&mut self);
    fn process(&mut self,block:&mut AudioBlockMut<'_>,context:ProcessContext);
}

#[inline] pub fn db_to_gain(db:f32)->f32{10.0_f32.powf(db/20.0)}
#[inline] pub fn gain_to_db(gain:f32)->f32{20.0*gain.max(1.0e-12).log10()}

pub struct DeepGain{gain_db:ParameterHandle,smoother:LinearSmoother,sample_rate:f32}
impl DeepGain{
    pub fn register(bank:&mut ParameterBank)->Self{Self::new(bank.register(GAIN_SPEC))}
    pub fn new(gain_db:ParameterHandle)->Self{
        let initial=db_to_gain(gain_db.get());
        Self{gain_db,smoother:LinearSmoother::new(initial),sample_rate:48_000.0}
    }
}
impl AudioProcessor for DeepGain{
    fn prepare(&mut self,sample_rate:f32,_:usize){self.sample_rate=sample_rate;self.reset();}
    fn reset(&mut self){self.smoother.reset(db_to_gain(self.gain_db.get()));}
    fn process(&mut self,block:&mut AudioBlockMut<'_>,_:ProcessContext){
        self.smoother.set_target(db_to_gain(self.gain_db.get()),self.sample_rate,GAIN_SPEC.smoothing_ms);
        for sample in block.samples_mut(){*sample*=self.smoother.next_value();}
    }
}

#[derive(Clone)]
pub struct DeepGlueHandles{
    pub threshold_db:ParameterHandle,
    pub ratio:ParameterHandle,
    pub attack_ms:ParameterHandle,
    pub release_ms:ParameterHandle,
    pub makeup_db:ParameterHandle,
    pub mix_percent:ParameterHandle,
}
impl DeepGlueHandles{
    pub fn register(bank:&mut ParameterBank)->Self{
        Self{
            threshold_db:bank.register(GLUE_SPECS[0]),
            ratio:bank.register(GLUE_SPECS[1]),
            attack_ms:bank.register(GLUE_SPECS[2]),
            release_ms:bank.register(GLUE_SPECS[3]),
            makeup_db:bank.register(GLUE_SPECS[4]),
            mix_percent:bank.register(GLUE_SPECS[5]),
        }
    }
    pub fn by_id(&self,id:ParameterId)->Option<&ParameterHandle>{
        match id{
            ids::GLUE_THRESHOLD_DB=>Some(&self.threshold_db),
            ids::GLUE_RATIO=>Some(&self.ratio),
            ids::GLUE_ATTACK_MS=>Some(&self.attack_ms),
            ids::GLUE_RELEASE_MS=>Some(&self.release_ms),
            ids::GLUE_MAKEUP_DB=>Some(&self.makeup_db),
            ids::GLUE_MIX_PERCENT=>Some(&self.mix_percent),
            _=>None,
        }
    }
}

pub struct DeepGlue{
    handles:DeepGlueHandles,
    meter:SharedMeter,
    meter_accumulator:MeterAccumulator,
    sample_rate:f32,
    envelope:f32,
    threshold:LinearSmoother,
    ratio:LinearSmoother,
    makeup:LinearSmoother,
    mix:LinearSmoother,
}
impl DeepGlue{
    pub fn new(handles:DeepGlueHandles,meter:SharedMeter)->Self{
        Self{
            threshold:LinearSmoother::new(handles.threshold_db.get()),
            ratio:LinearSmoother::new(handles.ratio.get()),
            makeup:LinearSmoother::new(handles.makeup_db.get()),
            mix:LinearSmoother::new(handles.mix_percent.get()/100.0),
            handles,meter,meter_accumulator:MeterAccumulator::default(),
            sample_rate:48_000.0,envelope:0.0,
        }
    }
    #[inline] fn coeff(&self,ms:f32)->f32{
        let seconds=ms.max(0.01)/1000.0;
        (-1.0/(seconds*self.sample_rate.max(1.0))).exp()
    }
    #[inline] fn detector(&mut self,value:f32)->f32{
        let a=self.coeff(self.handles.attack_ms.get());
        let r=self.coeff(self.handles.release_ms.get());
        let c=if value>self.envelope{a}else{r};
        self.envelope=c*self.envelope+(1.0-c)*value;
        self.envelope
    }
    #[inline] fn gain_reduction_db(&mut self,detector:f32)->f32{
        let level_db=gain_to_db(self.detector(detector));
        let threshold=self.threshold.next_value();
        let ratio=self.ratio.next_value().max(1.0);
        let over=level_db-threshold;
        if over>0.0 {-(over-over/ratio)} else {0.0}
    }
    fn begin_block(&mut self){
        self.threshold.set_target(self.handles.threshold_db.get(),self.sample_rate,GLUE_SPECS[0].smoothing_ms);
        self.ratio.set_target(self.handles.ratio.get(),self.sample_rate,GLUE_SPECS[1].smoothing_ms);
        self.makeup.set_target(self.handles.makeup_db.get(),self.sample_rate,GLUE_SPECS[4].smoothing_ms);
        self.mix.set_target(self.handles.mix_percent.get()/100.0,self.sample_rate,GLUE_SPECS[5].smoothing_ms);
        self.meter_accumulator.begin_block();
    }
    fn end_block(&self){self.meter_accumulator.finish(&self.meter);}
    pub fn meter(&self)->SharedMeter{self.meter.clone()}

    /// Public stereo primitive used by CLAP and the standalone graph.
    #[inline]
    pub fn process_stereo_pair(&mut self,left:&mut f32,right:&mut f32){
        let dry_l=*left; let dry_r=*right;
        let gr=self.gain_reduction_db(dry_l.abs().max(dry_r.abs()));
        let wet_gain=db_to_gain(gr+self.makeup.next_value());
        let mix=self.mix.next_value().clamp(0.0,1.0);
        *left=dry_l+(dry_l*wet_gain-dry_l)*mix;
        *right=dry_r+(dry_r*wet_gain-dry_r)*mix;
        self.meter_accumulator.observe(*left,gr);
        self.meter_accumulator.observe(*right,gr);
    }

    /// CLAP adapter calls this around a host block.
    pub fn begin_external_block(&mut self){self.begin_block();}
    pub fn end_external_block(&self){self.end_block();}
}
impl AudioProcessor for DeepGlue{
    fn prepare(&mut self,sample_rate:f32,_:usize){self.sample_rate=sample_rate;self.reset();}
    fn reset(&mut self){
        self.envelope=0.0;
        self.threshold.reset(self.handles.threshold_db.get());
        self.ratio.reset(self.handles.ratio.get());
        self.makeup.reset(self.handles.makeup_db.get());
        self.mix.reset(self.handles.mix_percent.get()/100.0);
    }
    fn process(&mut self,block:&mut AudioBlockMut<'_>,_:ProcessContext){
        self.begin_block();
        let channels=block.channels();
        if channels==1{
            for sample in block.samples_mut(){
                let dry=*sample;
                let gr=self.gain_reduction_db(dry.abs());
                let wet_gain=db_to_gain(gr+self.makeup.next_value());
                let mix=self.mix.next_value().clamp(0.0,1.0);
                *sample=dry+(dry*wet_gain-dry)*mix;
                self.meter_accumulator.observe(*sample,gr);
            }
        }else{
            for frame in block.samples_mut().chunks_exact_mut(channels){
                let (first,tail)=frame.split_at_mut(1);
                let left=&mut first[0];
                let right=&mut tail[0];
                self.process_stereo_pair(left,right);
            }
        }
        self.end_block();
    }
}

#[cfg(test)]
mod tests{
    use super::*;
    #[test] fn gain_is_finite(){
        let mut bank=ParameterBank::new(); let mut gain=DeepGain::register(&mut bank);
        gain.prepare(48_000.0,256); bank.set(ids::GAIN_DB,-6.0);
        let mut samples=[1.0_f32;512]; let mut block=AudioBlockMut::new(&mut samples,2).unwrap();
        gain.process(&mut block,ProcessContext{sample_rate:48_000.0});
        assert!(samples.iter().all(|s|s.is_finite())); assert!(samples[511]<0.6);
    }
    #[test] fn glue_compresses_without_nan(){
        let mut bank=ParameterBank::new(); let handles=DeepGlueHandles::register(&mut bank);
        let meter=SharedMeter::new(); let mut glue=DeepGlue::new(handles,meter.clone());
        glue.prepare(48_000.0,256); bank.set(ids::GLUE_THRESHOLD_DB,-24.0); bank.set(ids::GLUE_RATIO,10.0);
        let mut samples=[0.9_f32;1024]; let mut block=AudioBlockMut::new(&mut samples,2).unwrap();
        glue.process(&mut block,ProcessContext{sample_rate:48_000.0});
        assert!(samples.iter().all(|s|s.is_finite())); assert!(meter.snapshot().gain_reduction_db<=0.0);
    }
}
