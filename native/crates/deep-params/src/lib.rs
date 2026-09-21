#![forbid(unsafe_code)]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::{AtomicU32, Ordering};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ParameterId(pub u32);

#[derive(Debug, Clone, Copy)]
pub struct ParameterSpec {
    pub id: ParameterId,
    pub key: &'static str,
    pub name: &'static str,
    pub unit: &'static str,
    pub min: f32,
    pub max: f32,
    pub default: f32,
    pub smoothing_ms: f32,
}
impl ParameterSpec {
    #[inline] pub fn clamp(self, value: f32) -> f32 { value.clamp(self.min, self.max) }
}

#[derive(Debug)]
pub struct AtomicF32 { bits: AtomicU32 }
impl AtomicF32 {
    pub fn new(value: f32) -> Self { Self { bits: AtomicU32::new(value.to_bits()) } }
    #[inline] pub fn load(&self) -> f32 { f32::from_bits(self.bits.load(Ordering::Relaxed)) }
    #[inline] pub fn store(&self, value: f32) { self.bits.store(value.to_bits(), Ordering::Relaxed); }
}

#[derive(Clone, Debug)]
pub struct ParameterHandle { spec: ParameterSpec, value: Arc<AtomicF32> }
impl ParameterHandle {
    pub fn new(spec: ParameterSpec) -> Self {
        Self { spec, value: Arc::new(AtomicF32::new(spec.default)) }
    }
    #[inline] pub fn id(&self) -> ParameterId { self.spec.id }
    #[inline] pub fn spec(&self) -> ParameterSpec { self.spec }
    #[inline] pub fn get(&self) -> f32 { self.value.load() }
    #[inline] pub fn set(&self, value: f32) { self.value.store(self.spec.clamp(value)); }
}

#[derive(Clone, Default)]
pub struct ParameterBank { entries: HashMap<ParameterId, ParameterHandle> }
impl ParameterBank {
    pub fn new() -> Self { Self::default() }
    pub fn register(&mut self, spec: ParameterSpec) -> ParameterHandle {
        assert!(!self.entries.contains_key(&spec.id), "duplicate parameter id {}", spec.id.0);
        let handle = ParameterHandle::new(spec);
        self.entries.insert(spec.id, handle.clone());
        handle
    }
    pub fn get(&self, id: ParameterId) -> Option<ParameterHandle> { self.entries.get(&id).cloned() }
    pub fn set(&self, id: ParameterId, value: f32) -> bool {
        let Some(handle) = self.entries.get(&id) else { return false; };
        handle.set(value); true
    }
    pub fn snapshots(&self) -> Vec<ParameterSnapshot> {
        let mut values: Vec<_> = self.entries.values().map(|h| ParameterSnapshot {
            id: h.id().0, key: h.spec().key, name: h.spec().name, unit: h.spec().unit,
            min: h.spec().min, max: h.spec().max, default: h.spec().default, value: h.get(),
        }).collect();
        values.sort_by_key(|entry| entry.id);
        values
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct ParameterSnapshot {
    pub id: u32,
    pub key: &'static str,
    pub name: &'static str,
    pub unit: &'static str,
    pub min: f32,
    pub max: f32,
    pub default: f32,
    pub value: f32,
}

#[derive(Debug, Clone, Copy)]
pub struct LinearSmoother { current: f32, target: f32, step: f32, remaining: u32 }
impl LinearSmoother {
    pub fn new(initial: f32) -> Self { Self { current: initial, target: initial, step: 0.0, remaining: 0 } }
    pub fn reset(&mut self, value: f32) { self.current=value; self.target=value; self.step=0.0; self.remaining=0; }
    pub fn set_target(&mut self, target: f32, sample_rate: f32, smoothing_ms: f32) {
        if (target-self.target).abs() <= f32::EPSILON { return; }
        self.target=target;
        let samples=((sample_rate*smoothing_ms.max(0.0))/1000.0).round() as u32;
        if samples <= 1 { self.reset(target); } else { self.remaining=samples; self.step=(target-self.current)/samples as f32; }
    }
    #[inline] pub fn next_value(&mut self) -> f32 {
        if self.remaining>0 {
            self.current+=self.step; self.remaining-=1;
            if self.remaining==0 { self.current=self.target; }
        }
        self.current
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    const SPEC: ParameterSpec = ParameterSpec { id: ParameterId(42), key:"test", name:"Test", unit:"", min:0.0,max:1.0,default:0.5,smoothing_ms:10.0 };
    #[test] fn clamps() { let h=ParameterHandle::new(SPEC); h.set(3.0); assert_eq!(h.get(),1.0); }
    #[test] fn smooths() { let mut s=LinearSmoother::new(0.0); s.set_target(1.0,1000.0,10.0); for _ in 0..10 { s.next_value(); } assert!((s.next_value()-1.0).abs()<1e-6); }
}
