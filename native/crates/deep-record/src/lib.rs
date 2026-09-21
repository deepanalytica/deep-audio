#![forbid(unsafe_code)]

//! Realtime-safe recording tap plus a dedicated WAV writer thread.
//!
//! The audio callback only checks one atomic flag and pushes f32 samples into a
//! bounded SPSC ring. File I/O and WAV encoding happen on the writer thread.

use rtrb::{Consumer, Producer, RingBuffer};
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::mpsc;
use std::thread::{self, JoinHandle};
use std::time::Duration;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum RecordingError {
    #[error("recording service is unavailable")]
    ServiceUnavailable,
    #[error("recording operation timed out")]
    Timeout,
    #[error("recording failed: {0}")]
    Writer(String),
}

#[derive(Debug, Clone, Serialize)]
pub struct RecordingSummary {
    pub path: String,
    pub sample_rate: u32,
    pub channels: u16,
    pub frames: u64,
    pub dropped_samples: u64,
}

#[derive(Debug, Clone, Copy)]
pub struct RecordingSpec {
    pub sample_rate: u32,
    pub channels: u16,
}

enum Command {
    Start {
        path: PathBuf,
        spec: RecordingSpec,
        reply: mpsc::Sender<Result<String, String>>,
    },
    Stop {
        reply: mpsc::Sender<Result<RecordingSummary, String>>,
    },
    Shutdown,
}

pub struct RecordingTap {
    producer: Producer<f32>,
    active: Arc<AtomicBool>,
    dropped_samples: Arc<AtomicU64>,
}

impl RecordingTap {
    #[inline]
    pub fn capture(&mut self, samples: &[f32]) {
        if !self.active.load(Ordering::Acquire) {
            return;
        }

        for &sample in samples {
            if self.producer.push(sample).is_err() {
                self.dropped_samples.fetch_add(1, Ordering::Relaxed);
            }
        }
    }
}

pub struct RecorderController {
    command_tx: mpsc::Sender<Command>,
    active: Arc<AtomicBool>,
    dropped_samples: Arc<AtomicU64>,
    worker: Option<JoinHandle<()>>,
}

impl RecorderController {
    pub fn new(capacity_samples: usize) -> (Self, RecordingTap) {
        let capacity_samples = capacity_samples.max(4_096);
        let (producer, consumer) = RingBuffer::<f32>::new(capacity_samples);
        let (command_tx, command_rx) = mpsc::channel();
        let active = Arc::new(AtomicBool::new(false));
        let dropped_samples = Arc::new(AtomicU64::new(0));

        let worker_active = active.clone();
        let worker_dropped = dropped_samples.clone();
        let worker = thread::Builder::new()
            .name("deep-record-writer".into())
            .spawn(move || writer_loop(consumer, command_rx, worker_active, worker_dropped))
            .expect("recording writer thread must start");

        (
            Self {
                command_tx,
                active: active.clone(),
                dropped_samples: dropped_samples.clone(),
                worker: Some(worker),
            },
            RecordingTap {
                producer,
                active,
                dropped_samples,
            },
        )
    }

    pub fn start(
        &self,
        path: impl AsRef<Path>,
        spec: RecordingSpec,
    ) -> Result<String, RecordingError> {
        let (reply_tx, reply_rx) = mpsc::channel();
        self.command_tx
            .send(Command::Start {
                path: path.as_ref().to_path_buf(),
                spec,
                reply: reply_tx,
            })
            .map_err(|_| RecordingError::ServiceUnavailable)?;
        reply_rx
            .recv_timeout(Duration::from_secs(3))
            .map_err(|_| RecordingError::Timeout)?
            .map_err(RecordingError::Writer)
    }

    pub fn stop(&self) -> Result<RecordingSummary, RecordingError> {
        self.active.store(false, Ordering::Release);
        let (reply_tx, reply_rx) = mpsc::channel();
        self.command_tx
            .send(Command::Stop { reply: reply_tx })
            .map_err(|_| RecordingError::ServiceUnavailable)?;
        reply_rx
            .recv_timeout(Duration::from_secs(5))
            .map_err(|_| RecordingError::Timeout)?
            .map_err(RecordingError::Writer)
    }

    pub fn is_recording(&self) -> bool {
        self.active.load(Ordering::Acquire)
    }

    pub fn dropped_samples(&self) -> u64 {
        self.dropped_samples.load(Ordering::Relaxed)
    }

    pub fn shutdown(&mut self) {
        self.active.store(false, Ordering::Release);
        let _ = self.command_tx.send(Command::Shutdown);
        if let Some(worker) = self.worker.take() {
            let _ = worker.join();
        }
    }
}

impl Drop for RecorderController {
    fn drop(&mut self) {
        self.shutdown();
    }
}

fn writer_loop(
    mut consumer: Consumer<f32>,
    command_rx: mpsc::Receiver<Command>,
    active: Arc<AtomicBool>,
    dropped_samples: Arc<AtomicU64>,
) {
    let mut writer: Option<hound::WavWriter<std::io::BufWriter<std::fs::File>>> = None;
    let mut current_path: Option<PathBuf> = None;
    let mut current_spec = RecordingSpec {
        sample_rate: 48_000,
        channels: 2,
    };
    let mut written_samples = 0_u64;

    loop {
        match command_rx.recv_timeout(Duration::from_millis(4)) {
            Ok(Command::Start { path, spec, reply }) => {
                active.store(false, Ordering::Release);
                drain_discard(&mut consumer);

                if let Some(previous) = writer.take() {
                    let _ = previous.finalize();
                }

                let result = (|| {
                    if let Some(parent) = path.parent() {
                        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
                    }

                    let wav_spec = hound::WavSpec {
                        channels: spec.channels,
                        sample_rate: spec.sample_rate,
                        bits_per_sample: 32,
                        sample_format: hound::SampleFormat::Float,
                    };
                    let new_writer =
                        hound::WavWriter::create(&path, wav_spec).map_err(|error| error.to_string())?;
                    writer = Some(new_writer);
                    current_path = Some(path.clone());
                    current_spec = spec;
                    written_samples = 0;
                    dropped_samples.store(0, Ordering::Release);
                    active.store(true, Ordering::Release);
                    Ok(path.to_string_lossy().into_owned())
                })();

                let _ = reply.send(result);
            }
            Ok(Command::Stop { reply }) => {
                active.store(false, Ordering::Release);
                let write_result = drain_to_writer(&mut consumer, writer.as_mut(), &mut written_samples);

                let result = match (write_result, writer.take(), current_path.take()) {
                    (Err(error), _, _) => Err(error),
                    (Ok(()), Some(writer), Some(path)) => {
                        if let Err(error) = writer.finalize() {
                            Err(error.to_string())
                        } else {
                            let channels = u64::from(current_spec.channels.max(1));
                            Ok(RecordingSummary {
                                path: path.to_string_lossy().into_owned(),
                                sample_rate: current_spec.sample_rate,
                                channels: current_spec.channels,
                                frames: written_samples / channels,
                                dropped_samples: dropped_samples.load(Ordering::Acquire),
                            })
                        }
                    }
                    _ => Err("no active recording".into()),
                };
                let _ = reply.send(result);
            }
            Ok(Command::Shutdown) => {
                active.store(false, Ordering::Release);
                let _ = drain_to_writer(&mut consumer, writer.as_mut(), &mut written_samples);
                if let Some(writer) = writer.take() {
                    let _ = writer.finalize();
                }
                break;
            }
            Err(mpsc::RecvTimeoutError::Timeout) => {
                if writer.is_some() {
                    let _ = drain_to_writer(&mut consumer, writer.as_mut(), &mut written_samples);
                } else {
                    drain_discard(&mut consumer);
                }
            }
            Err(mpsc::RecvTimeoutError::Disconnected) => break,
        }
    }
}

fn drain_to_writer(
    consumer: &mut Consumer<f32>,
    mut writer: Option<&mut hound::WavWriter<std::io::BufWriter<std::fs::File>>>,
    written_samples: &mut u64,
) -> Result<(), String> {
    while let Ok(sample) = consumer.pop() {
        if let Some(target) = writer.as_deref_mut() {
            target.write_sample(sample.clamp(-1.0, 1.0)).map_err(|error| error.to_string())?;
            *written_samples += 1;
        }
    }
    Ok(())
}

fn drain_discard(consumer: &mut Consumer<f32>) {
    while consumer.pop().is_ok() {}
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn inactive_tap_drops_nothing() {
        let (controller, mut tap) = RecorderController::new(16);
        tap.capture(&[0.1; 32]);
        assert_eq!(controller.dropped_samples(), 0);
    }
}
