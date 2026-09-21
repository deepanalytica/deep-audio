use crate::BackendPreference;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{FromSample, Sample, SampleFormat, SizedSample};
use deep_dsp::{AudioBlockMut, AudioProcessor, ProcessContext};
use deep_playback::PlaybackTap;
use deep_record::RecordingTap;
use deep_transport::{MetronomeRenderer, SharedTransport};
use rtrb::{Consumer, Producer, RingBuffer};
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AudioIoError {
    #[error("requested backend unavailable")]
    BackendUnavailable,
    #[error("no default input device")]
    NoInputDevice,
    #[error("no default output device")]
    NoOutputDevice,
    #[error("sample rates differ and no compatible input rate was found: input={input}, output={output}")]
    SampleRateMismatch { input: u32, output: u32 },
    #[error("unsupported device sample format: {0}")]
    UnsupportedSampleFormat(String),
    #[error("stream config error: {0}")]
    Config(String),
    #[error("stream build error: {0}")]
    Build(String),
    #[error("stream start error: {0}")]
    Play(String),
    #[error("device enumeration error: {0}")]
    Devices(String),
    #[error("audio device not found: {0}")]
    DeviceNotFound(String),
}

#[derive(Debug, Clone, Serialize)]
pub struct StreamInfo {
    pub sample_rate: u32,
    pub input_channels: u16,
    pub output_channels: u16,
    pub input_device: String,
    pub output_device: String,
    pub input_sample_format: String,
    pub output_sample_format: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct AudioDeviceInfo {
    pub name: String,
    pub can_input: bool,
    pub can_output: bool,
    pub default_input: bool,
    pub default_output: bool,
}

fn resolve_host(preference: BackendPreference) -> Result<cpal::Host, AudioIoError> {
    match preference {
        BackendPreference::Default => Ok(cpal::default_host()),
        BackendPreference::Asio => {
            #[cfg(all(target_os = "windows", feature = "asio"))]
            {
                cpal::host_from_id(cpal::HostId::Asio)
                    .map_err(|_| AudioIoError::BackendUnavailable)
            }
            #[cfg(not(all(target_os = "windows", feature = "asio")))]
            {
                Err(AudioIoError::BackendUnavailable)
            }
        }
    }
}

pub fn list_devices(preference: BackendPreference) -> Result<Vec<AudioDeviceInfo>, AudioIoError> {
    use std::collections::BTreeMap;

    let host = resolve_host(preference)?;
    let default_input = host.default_input_device().and_then(|device| device.name().ok());
    let default_output = host.default_output_device().and_then(|device| device.name().ok());
    let mut map: BTreeMap<String, AudioDeviceInfo> = BTreeMap::new();

    for device in host
        .input_devices()
        .map_err(|error| AudioIoError::Devices(error.to_string()))?
    {
        let name = device.name().unwrap_or_else(|_| "Unnamed input".into());
        let entry = map.entry(name.clone()).or_insert(AudioDeviceInfo {
            name: name.clone(),
            can_input: false,
            can_output: false,
            default_input: default_input.as_deref() == Some(name.as_str()),
            default_output: default_output.as_deref() == Some(name.as_str()),
        });
        entry.can_input = true;
    }

    for device in host
        .output_devices()
        .map_err(|error| AudioIoError::Devices(error.to_string()))?
    {
        let name = device.name().unwrap_or_else(|_| "Unnamed output".into());
        let entry = map.entry(name.clone()).or_insert(AudioDeviceInfo {
            name: name.clone(),
            can_input: false,
            can_output: false,
            default_input: default_input.as_deref() == Some(name.as_str()),
            default_output: default_output.as_deref() == Some(name.as_str()),
        });
        entry.can_output = true;
    }

    Ok(map.into_values().collect())
}

fn find_input(host: &cpal::Host, name: Option<&str>) -> Result<cpal::Device, AudioIoError> {
    if let Some(name) = name {
        return host
            .input_devices()
            .map_err(|error| AudioIoError::Devices(error.to_string()))?
            .find(|device| device.name().ok().as_deref() == Some(name))
            .ok_or_else(|| AudioIoError::DeviceNotFound(name.to_string()));
    }
    host.default_input_device().ok_or(AudioIoError::NoInputDevice)
}

fn find_output(host: &cpal::Host, name: Option<&str>) -> Result<cpal::Device, AudioIoError> {
    if let Some(name) = name {
        return host
            .output_devices()
            .map_err(|error| AudioIoError::Devices(error.to_string()))?
            .find(|device| device.name().ok().as_deref() == Some(name))
            .ok_or_else(|| AudioIoError::DeviceNotFound(name.to_string()));
    }
    host.default_output_device().ok_or(AudioIoError::NoOutputDevice)
}

fn input_config_for_rate(
    device: &cpal::Device,
    target_rate: u32,
) -> Result<cpal::SupportedStreamConfig, AudioIoError> {
    let default = device
        .default_input_config()
        .map_err(|error| AudioIoError::Config(error.to_string()))?;

    if default.sample_rate().0 == target_rate {
        return Ok(default);
    }

    let mut supported = device
        .supported_input_configs()
        .map_err(|error| AudioIoError::Config(error.to_string()))?;

    if let Some(range) = supported.find(|range| {
        range.min_sample_rate().0 <= target_rate && range.max_sample_rate().0 >= target_rate
    }) {
        return Ok(range.with_sample_rate(cpal::SampleRate(target_rate)));
    }

    Err(AudioIoError::SampleRateMismatch {
        input: default.sample_rate().0,
        output: target_rate,
    })
}

fn build_input<T>(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    mut producer: Producer<f32>,
    input_channels: usize,
    output_channels: usize,
) -> Result<cpal::Stream, AudioIoError>
where
    T: Sample + SizedSample,
    f32: FromSample<T>,
{
    device
        .build_input_stream(
            config,
            move |data: &[T], _| {
                for frame in data.chunks_exact(input_channels) {
                    for out_channel in 0..output_channels {
                        let source_channel = out_channel.min(input_channels.saturating_sub(1));
                        let value = f32::from_sample(frame[source_channel]);
                        let _ = producer.push(value);
                    }
                }
            },
            move |error| eprintln!("Deep Audio input stream error: {error}"),
            None,
        )
        .map_err(|error| AudioIoError::Build(error.to_string()))
}

#[allow(clippy::too_many_arguments)]
fn build_output<T, P>(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    mut consumer: Consumer<f32>,
    output_channels: usize,
    sample_rate: u32,
    mut processor: P,
    mut recorder: Option<RecordingTap>,
    mut playback: Option<PlaybackTap>,
    transport: Option<SharedTransport>,
) -> Result<cpal::Stream, AudioIoError>
where
    T: Sample + SizedSample + FromSample<f32>,
    P: AudioProcessor + 'static,
{
    processor.prepare(sample_rate as f32, 2_048);
    let context = ProcessContext {
        sample_rate: sample_rate as f32,
    };
    let mut metronome = MetronomeRenderer::new(sample_rate as f32);

    // One second of interleaved scratch space is allocated before the callback.
    // This avoids callback allocations even for unusually large host buffers.
    let scratch_samples = (sample_rate as usize * output_channels).max(8_192);
    let mut scratch = vec![0.0_f32; scratch_samples];
    let mut playback_was_active = false;

    device
        .build_output_stream(
            config,
            move |data: &mut [T], _| {
                if data.len() > scratch.len() {
                    for sample in data {
                        *sample = T::from_sample(0.0);
                    }
                    return;
                }

                let buffer = &mut scratch[..data.len()];
                for sample in buffer.iter_mut() {
                    *sample = consumer.pop().unwrap_or(0.0);
                }

                if let Some(mut block) = AudioBlockMut::new(buffer, output_channels) {
                    let frames = block.frames() as u64;
                    processor.process(&mut block, context);

                    let mut playback_ended = false;
                    if let Some(playback) = playback.as_mut() {
                        playback.mix_into(buffer);
                        let playback_active = playback.is_playing();
                        playback_ended = playback_was_active && !playback_active;
                        playback_was_active = playback_active;
                    }

                    // Record the musical signal before monitoring-only click injection.
                    if let Some(recorder) = recorder.as_mut() {
                        recorder.capture(buffer);
                    }

                    if let Some(transport) = transport.as_ref() {
                        metronome.process(buffer, output_channels, transport);
                        transport.advance(frames);
                        if playback_ended && !transport.snapshot().recording {
                            transport.pause();
                        }
                    }
                }

                for (target, source) in data.iter_mut().zip(buffer.iter().copied()) {
                    *target = T::from_sample(source);
                }
            },
            move |error| eprintln!("Deep Audio output stream error: {error}"),
            None,
        )
        .map_err(|error| AudioIoError::Build(error.to_string()))
}

pub struct CpalDuplex {
    _input: cpal::Stream,
    _output: cpal::Stream,
    info: StreamInfo,
}

impl CpalDuplex {
    pub fn info(&self) -> &StreamInfo {
        &self.info
    }

    pub fn start<P>(processor: P, preference: BackendPreference) -> Result<Self, AudioIoError>
    where
        P: AudioProcessor + 'static,
    {
        Self::start_with_runtime(processor, preference, None, None, None)
    }

    pub fn start_with_runtime<P>(
        processor: P,
        preference: BackendPreference,
        recorder: Option<RecordingTap>,
        playback: Option<PlaybackTap>,
        transport: Option<SharedTransport>,
    ) -> Result<Self, AudioIoError>
    where
        P: AudioProcessor + 'static,
    {
        Self::start_with_devices(
            processor,
            preference,
            recorder,
            playback,
            transport,
            None,
            None,
        )
    }

    #[allow(clippy::too_many_arguments)]
    pub fn start_with_devices<P>(
        processor: P,
        preference: BackendPreference,
        recorder: Option<RecordingTap>,
        playback: Option<PlaybackTap>,
        transport: Option<SharedTransport>,
        input_name: Option<&str>,
        output_name: Option<&str>,
    ) -> Result<Self, AudioIoError>
    where
        P: AudioProcessor + 'static,
    {
        let host = resolve_host(preference)?;
        let input_device = find_input(&host, input_name)?;
        let output_device = find_output(&host, output_name)?;

        let output_supported = output_device
            .default_output_config()
            .map_err(|error| AudioIoError::Config(error.to_string()))?;
        let sample_rate = output_supported.sample_rate().0;
        let input_supported = input_config_for_rate(&input_device, sample_rate)?;

        let input_sample_format = input_supported.sample_format();
        let output_sample_format = output_supported.sample_format();
        let input_config: cpal::StreamConfig = input_supported.into();
        let output_config: cpal::StreamConfig = output_supported.into();
        let input_channels = usize::from(input_config.channels);
        let output_channels = usize::from(output_config.channels);

        let capacity = ((sample_rate as usize * output_channels) / 4).max(4_096);
        let (producer, consumer) = RingBuffer::<f32>::new(capacity);

        let input_stream = match input_sample_format {
            SampleFormat::F32 => build_input::<f32>(
                &input_device,
                &input_config,
                producer,
                input_channels,
                output_channels,
            ),
            SampleFormat::I16 => build_input::<i16>(
                &input_device,
                &input_config,
                producer,
                input_channels,
                output_channels,
            ),
            SampleFormat::U16 => build_input::<u16>(
                &input_device,
                &input_config,
                producer,
                input_channels,
                output_channels,
            ),
            other => Err(AudioIoError::UnsupportedSampleFormat(format!(
                "input {other:?}"
            ))),
        }?;

        let output_stream = match output_sample_format {
            SampleFormat::F32 => build_output::<f32, P>(
                &output_device,
                &output_config,
                consumer,
                output_channels,
                sample_rate,
                processor,
                recorder,
                playback,
                transport,
            ),
            SampleFormat::I16 => build_output::<i16, P>(
                &output_device,
                &output_config,
                consumer,
                output_channels,
                sample_rate,
                processor,
                recorder,
                playback,
                transport,
            ),
            SampleFormat::U16 => build_output::<u16, P>(
                &output_device,
                &output_config,
                consumer,
                output_channels,
                sample_rate,
                processor,
                recorder,
                playback,
                transport,
            ),
            other => Err(AudioIoError::UnsupportedSampleFormat(format!(
                "output {other:?}"
            ))),
        }?;

        input_stream
            .play()
            .map_err(|error| AudioIoError::Play(error.to_string()))?;
        output_stream
            .play()
            .map_err(|error| AudioIoError::Play(error.to_string()))?;

        let info = StreamInfo {
            sample_rate,
            input_channels: input_config.channels,
            output_channels: output_config.channels,
            input_device: input_device.name().unwrap_or_else(|_| "Input".into()),
            output_device: output_device.name().unwrap_or_else(|_| "Output".into()),
            input_sample_format: format!("{input_sample_format:?}"),
            output_sample_format: format!("{output_sample_format:?}"),
        };

        Ok(Self {
            _input: input_stream,
            _output: output_stream,
            info,
        })
    }
}
