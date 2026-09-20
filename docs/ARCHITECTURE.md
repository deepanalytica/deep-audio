# Architecture

## Goal

Keep the real-time path boring, deterministic and testable.

The application has three conceptual layers:

    UI / Rooms
        |
        v
    Session and commands
        |
        v
    Real-time audio engine

Future analysis or AI sits beside the engine, never inside its callback.

## Current audio path

    Input 1 (dry)
        |-----------------------> Recorder FIFO -> background disk writer -> WAV 24-bit
        |
        v
    Tone chain
        HPF -> Compressor -> Output Gain
        |
        v
    Monitor bus ------------------------------.
                                                   \
    Backing track -> read-ahead transport ----------> Output 1/2
                                                   /
    Metronome -------------------------------------'

Recording is dry on purpose. The player hears a useful processed monitor while the captured source remains flexible for later mixing.

## Thread model

### Audio callback

Allowed:

- clear/copy/add audio buffers;
- DSP prepared before playback;
- atomics;
- write into the recorder's preallocated FIFO;
- backing transport read-ahead consumption;
- metronome generation.

Avoid:

- filesystem operations;
- network requests;
- LLM calls;
- UI changes;
- memory growth;
- plugin scanning;
- database access.

### Message thread

Responsible for:

- UI;
- file chooser;
- device setup;
- starting/stopping transport;
- changing presets;
- session commands.

### Background threads

Recorder thread:
- drains audio FIFO to WAV.

Read-ahead thread:
- buffers backing-track data.

Future analysis worker:
- computes loudness, spectra, dynamics and recommendations from snapshots or rendered audio.

## Why JUCE only for v0.1

JUCE already supplies the exact primitives required for the first proof:

- AudioDeviceManager
- ASIO/WASAPI device support
- AudioTransportSource
- file decoders
- WAV writer
- DSP primitives
- desktop UI

Tracktion Engine remains a candidate for the later edit/session layer if multi-track editing complexity justifies the dependency. It is not required for this proof.

## Session-engine boundary

Do not let UI code become the DAW.

As features grow, commands should converge on a small session API:

- addTrack()
- importClip()
- armTrack()
- startRecord()
- stopRecord()
- setTrackGain()
- setTrackPan()
- setPluginParameter()
- renderMix()

The current AudioEngine is deliberately small, but its public methods already keep device/audio state out of the UI.

## Future AI engineer

The future assistant consumes measurements and session metadata, not raw control of the real-time callback.

    Render / snapshot
        -> deterministic analysers
        -> structured measurements
        -> recommendation engine
        -> human review
        -> bounded command
        -> session engine

Each recommendation should carry:

- observation;
- measurement;
- proposed change;
- expected effect;
- confidence/uncertainty;
- A/B path;
- undo command.

## Persistence

v0.1 only writes recordings.

v0.2 should introduce a small versioned session document. Prefer JSON plus referenced audio files before adding a database. SQLite is unnecessary until project indexing/search actually requires it.

## Security and privacy

Core audio remains local.

No recorded audio should leave the machine implicitly.

Any future cloud or model feature must be opt-in and clearly state what data is transmitted.
