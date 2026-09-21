#![forbid(unsafe_code)]

//! Sample-domain transport state shared between control and realtime threads.

use serde::Serialize;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};

#[derive(Clone, Debug)]
pub struct SharedTransport {
    inner: Arc<TransportInner>,
}

#[derive(Debug)]
struct TransportInner {
    playing: AtomicBool,
    recording: AtomicBool,
    position_samples: AtomicU64,
    bpm_bits: AtomicU64,
    metronome: AtomicBool,
}

impl Default for SharedTransport {
    fn default() -> Self {
        Self::new(120.0)
    }
}

impl SharedTransport {
    pub fn new(bpm: f64) -> Self {
        Self {
            inner: Arc::new(TransportInner {
                playing: AtomicBool::new(false),
                recording: AtomicBool::new(false),
                position_samples: AtomicU64::new(0),
                bpm_bits: AtomicU64::new(bpm.clamp(20.0, 400.0).to_bits()),
                metronome: AtomicBool::new(false),
            }),
        }
    }

    #[inline]
    pub fn play(&self) {
        self.inner.playing.store(true, Ordering::Release);
    }

    #[inline]
    pub fn pause(&self) {
        self.inner.playing.store(false, Ordering::Release);
        self.inner.recording.store(false, Ordering::Release);
    }

    #[inline]
    pub fn stop(&self) {
        self.inner.playing.store(false, Ordering::Release);
        self.inner.recording.store(false, Ordering::Release);
        self.inner.position_samples.store(0, Ordering::Release);
    }

    #[inline]
    pub fn set_recording(&self, recording: bool) {
        self.inner.recording.store(recording, Ordering::Release);
        if recording {
            self.inner.playing.store(true, Ordering::Release);
        }
    }

    #[inline]
    pub fn set_bpm(&self, bpm: f64) {
        self.inner
            .bpm_bits
            .store(bpm.clamp(20.0, 400.0).to_bits(), Ordering::Release);
    }

    #[inline]
    pub fn set_metronome(&self, enabled: bool) {
        self.inner.metronome.store(enabled, Ordering::Release);
    }

    #[inline]
    pub fn metronome_enabled(&self) -> bool {
        self.inner.metronome.load(Ordering::Acquire)
    }

    #[inline]
    pub fn seek_samples(&self, position_samples: u64) {
        self.inner
            .position_samples
            .store(position_samples, Ordering::Release);
    }

    #[inline]
    pub fn advance(&self, frames: u64) {
        if self.inner.playing.load(Ordering::Acquire) {
            self.inner
                .position_samples
                .fetch_add(frames, Ordering::Relaxed);
        }
    }

    pub fn snapshot(&self) -> TransportSnapshot {
        TransportSnapshot {
            playing: self.inner.playing.load(Ordering::Acquire),
            recording: self.inner.recording.load(Ordering::Acquire),
            position_samples: self.inner.position_samples.load(Ordering::Acquire),
            bpm: f64::from_bits(self.inner.bpm_bits.load(Ordering::Acquire)),
            metronome: self.inner.metronome.load(Ordering::Acquire),
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize)]
pub struct TransportSnapshot {
    pub playing: bool,
    pub recording: bool,
    pub position_samples: u64,
    pub bpm: f64,
    pub metronome: bool,
}

pub struct MetronomeRenderer {
    sample_rate: f32,
    last_beat: u64,
    envelope: f32,
    phase: f32,
}

impl MetronomeRenderer {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            sample_rate: sample_rate.max(1.0),
            last_beat: u64::MAX,
            envelope: 0.0,
            phase: 0.0,
        }
    }

    #[inline]
    pub fn process(&mut self, output: &mut [f32], channels: usize, transport: &SharedTransport) {
        if channels == 0 || !transport.metronome_enabled() {
            self.envelope = 0.0;
            return;
        }

        let snapshot = transport.snapshot();
        if !snapshot.playing {
            self.envelope = 0.0;
            return;
        }

        let beat_frames = (self.sample_rate as f64 * 60.0 / snapshot.bpm.max(20.0)).max(1.0) as u64;
        let start = snapshot.position_samples;

        for (frame_index, frame) in output.chunks_exact_mut(channels).enumerate() {
            let position = start.saturating_add(frame_index as u64);
            let beat = position / beat_frames;
            if beat != self.last_beat {
                self.last_beat = beat;
                self.envelope = if beat % 4 == 0 { 0.34 } else { 0.22 };
                self.phase = 0.0;
            }

            if self.envelope > 0.0001 {
                let frequency = if beat % 4 == 0 { 1_760.0 } else { 1_320.0 };
                let click = self.phase.sin() * self.envelope;
                self.phase += std::f32::consts::TAU * frequency / self.sample_rate;
                self.envelope *= 0.992;
                for sample in frame {
                    *sample = (*sample + click).clamp(-1.0, 1.0);
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn advances_only_while_playing() {
        let transport = SharedTransport::default();
        transport.advance(128);
        assert_eq!(transport.snapshot().position_samples, 0);
        transport.play();
        transport.advance(128);
        assert_eq!(transport.snapshot().position_samples, 128);
        transport.pause();
        transport.advance(128);
        assert_eq!(transport.snapshot().position_samples, 128);
    }

    #[test]
    fn recording_implies_playing() {
        let transport = SharedTransport::default();
        transport.set_recording(true);
        let snapshot = transport.snapshot();
        assert!(snapshot.playing);
        assert!(snapshot.recording);
    }
}
