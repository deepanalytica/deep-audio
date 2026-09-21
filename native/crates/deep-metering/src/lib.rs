#![forbid(unsafe_code)]

use deep_params::AtomicF32;
use serde::Serialize;
use std::sync::Arc;

#[derive(Clone, Debug)]
pub struct SharedMeter {
    peak: Arc<AtomicF32>,
    rms: Arc<AtomicF32>,
    gain_reduction_db: Arc<AtomicF32>,
}
impl Default for SharedMeter { fn default() -> Self { Self::new() } }
impl SharedMeter {
    pub fn new() -> Self {
        Self { peak:Arc::new(AtomicF32::new(0.0)), rms:Arc::new(AtomicF32::new(0.0)), gain_reduction_db:Arc::new(AtomicF32::new(0.0)) }
    }
    pub fn publish(&self, peak:f32, rms:f32, gr:f32) { self.peak.store(peak); self.rms.store(rms); self.gain_reduction_db.store(gr); }
    pub fn snapshot(&self) -> MeterSnapshot { MeterSnapshot { peak:self.peak.load(), rms:self.rms.load(), gain_reduction_db:self.gain_reduction_db.load() } }
}
#[derive(Debug, Clone, Copy, Serialize)]
pub struct MeterSnapshot { pub peak:f32, pub rms:f32, pub gain_reduction_db:f32 }

#[derive(Debug, Default)]
pub struct MeterAccumulator { peak:f32, sum_sq:f64, sample_count:u64, min_gr:f32 }
impl MeterAccumulator {
    pub fn begin_block(&mut self) { self.peak=0.0; self.sum_sq=0.0; self.sample_count=0; self.min_gr=0.0; }
    #[inline] pub fn observe(&mut self, sample:f32, gr:f32) {
        self.peak=self.peak.max(sample.abs()); self.sum_sq+=(sample as f64)*(sample as f64); self.sample_count+=1; self.min_gr=self.min_gr.min(gr);
    }
    pub fn finish(&self, target:&SharedMeter) {
        let rms=if self.sample_count==0 {0.0} else {(self.sum_sq/self.sample_count as f64).sqrt() as f32};
        target.publish(self.peak,rms,self.min_gr);
    }
}
