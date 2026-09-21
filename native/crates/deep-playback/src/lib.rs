#![forbid(unsafe_code)]

//! Realtime-safe WAV playback bridge.
//!
//! Disk decoding happens on a worker thread. The audio callback only drains a
//! bounded SPSC ring and mixes matching-generation samples.

use rtrb::{Consumer, Producer, PushError, RingBuffer};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::mpsc;
use std::thread::{self, JoinHandle};
use std::time::Duration;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum PlaybackError {
    #[error("playback service is unavailable")]
    ServiceUnavailable,
    #[error("playback operation timed out")]
    Timeout,
    #[error("playback failed: {0}")]
    Reader(String),
}

#[derive(Debug, Clone, Copy)]
pub struct PlaybackSpec {
    pub sample_rate: u32,
    pub channels: u16,
}

#[derive(Debug, Clone, Copy)]
struct PlaybackSample {
    generation: u64,
    value: f32,
}

enum Command {
    Play {
        path: PathBuf,
        spec: PlaybackSpec,
        reply: mpsc::Sender<Result<String, String>>,
    },
    Stop,
    Shutdown,
}

pub struct PlaybackTap {
    consumer: Consumer<PlaybackSample>,
    active: Arc<AtomicBool>,
    generation: Arc<AtomicU64>,
}

impl PlaybackTap {
    #[inline]
    pub fn mix_into(&mut self, output: &mut [f32]) {
        let generation = self.generation.load(Ordering::Acquire);
        let active = self.active.load(Ordering::Acquire);

        for target in output {
            let Ok(sample) = self.consumer.pop() else {
                break;
            };
            if active && sample.generation == generation {
                *target = (*target + sample.value).clamp(-1.0, 1.0);
            }
        }
    }
}

pub struct PlaybackController {
    command_tx: mpsc::Sender<Command>,
    active: Arc<AtomicBool>,
    worker: Option<JoinHandle<()>>,
}

impl PlaybackController {
    pub fn new(capacity_samples: usize) -> (Self, PlaybackTap) {
        let (producer, consumer) = RingBuffer::new(capacity_samples.max(4_096));
        let (command_tx, command_rx) = mpsc::channel();
        let active = Arc::new(AtomicBool::new(false));
        let generation = Arc::new(AtomicU64::new(0));

        let worker_active = active.clone();
        let worker_generation = generation.clone();
        let worker = thread::Builder::new()
            .name("deep-playback-reader".into())
            .spawn(move || playback_loop(producer, command_rx, worker_active, worker_generation))
            .expect("playback worker thread must start");

        (
            Self {
                command_tx,
                active: active.clone(),
                worker: Some(worker),
            },
            PlaybackTap {
                consumer,
                active,
                generation,
            },
        )
    }

    pub fn play(
        &self,
        path: impl AsRef<Path>,
        spec: PlaybackSpec,
    ) -> Result<String, PlaybackError> {
        let (reply_tx, reply_rx) = mpsc::channel();
        self.command_tx
            .send(Command::Play {
                path: path.as_ref().to_path_buf(),
                spec,
                reply: reply_tx,
            })
            .map_err(|_| PlaybackError::ServiceUnavailable)?;
        reply_rx
            .recv_timeout(Duration::from_secs(3))
            .map_err(|_| PlaybackError::Timeout)?
            .map_err(PlaybackError::Reader)
    }

    pub fn stop(&self) {
        self.active.store(false, Ordering::Release);
        let _ = self.command_tx.send(Command::Stop);
    }

    pub fn is_playing(&self) -> bool {
        self.active.load(Ordering::Acquire)
    }

    pub fn shutdown(&mut self) {
        self.active.store(false, Ordering::Release);
        let _ = self.command_tx.send(Command::Shutdown);
        if let Some(worker) = self.worker.take() {
            let _ = worker.join();
        }
    }
}

impl Drop for PlaybackController {
    fn drop(&mut self) {
        self.shutdown();
    }
}

fn playback_loop(
    mut producer: Producer<PlaybackSample>,
    command_rx: mpsc::Receiver<Command>,
    active: Arc<AtomicBool>,
    generation: Arc<AtomicU64>,
) {
    let mut reader: Option<hound::WavReader<std::io::BufReader<std::fs::File>>> = None;
    let mut pending: Option<PlaybackSample> = None;
    let mut current_generation = 0_u64;

    loop {
        while let Ok(command) = command_rx.try_recv() {
            match command {
                Command::Play { path, spec, reply } => {
                    active.store(false, Ordering::Release);
                    reader = None;
                    pending = None;
                    current_generation = generation.fetch_add(1, Ordering::AcqRel) + 1;

                    let result = (|| {
                        let next = hound::WavReader::open(&path).map_err(|error| error.to_string())?;
                        let wav = next.spec();
                        if wav.sample_rate != spec.sample_rate {
                            return Err(format!(
                                "sample-rate mismatch: file={} engine={}",
                                wav.sample_rate, spec.sample_rate
                            ));
                        }
                        if wav.channels != spec.channels {
                            return Err(format!(
                                "channel mismatch: file={} engine={}",
                                wav.channels, spec.channels
                            ));
                        }
                        if wav.sample_format != hound::SampleFormat::Float || wav.bits_per_sample != 32 {
                            return Err("playback currently expects 32-bit float WAV".into());
                        }
                        reader = Some(next);
                        active.store(true, Ordering::Release);
                        Ok(path.to_string_lossy().into_owned())
                    })();
                    let _ = reply.send(result);
                }
                Command::Stop => {
                    active.store(false, Ordering::Release);
                    reader = None;
                    pending = None;
                    generation.fetch_add(1, Ordering::AcqRel);
                }
                Command::Shutdown => {
                    active.store(false, Ordering::Release);
                    return;
                }
            }
        }

        let Some(current_reader) = reader.as_mut() else {
            thread::sleep(Duration::from_millis(2));
            continue;
        };

        let mut pushed = 0usize;
        while pushed < 4096 {
            let sample = if let Some(sample) = pending.take() {
                sample
            } else {
                match current_reader.samples::<f32>().next() {
                    Some(Ok(value)) => PlaybackSample {
                        generation: current_generation,
                        value,
                    },
                    Some(Err(error)) => {
                        eprintln!("Deep Audio playback decode error: {error}");
                        active.store(false, Ordering::Release);
                        reader = None;
                        break;
                    }
                    None => {
                        active.store(false, Ordering::Release);
                        reader = None;
                        break;
                    }
                }
            };

            match producer.push(sample) {
                Ok(()) => pushed += 1,
                Err(PushError::Full(sample)) => {
                    pending = Some(sample);
                    break;
                }
            }
        }

        if pushed == 0 {
            thread::sleep(Duration::from_millis(1));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn controller_starts_inactive() {
        let (controller, _tap) = PlaybackController::new(64);
        assert!(!controller.is_playing());
    }
}
