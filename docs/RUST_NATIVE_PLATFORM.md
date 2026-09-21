# Deep Music Producer — Rust Native Platform Plan

Status: active implementation branch `rust-native-platform`.

## Product thesis

Deep Music Producer is not a web DAW with a decorative 3D scene. It is a native audio platform whose primary interaction metaphor is a studio.

The musician should think:

```text
enter room -> touch instrument/hardware -> hear result
```

not:

```text
track -> insert slot -> technical dialog -> plugin
```

The same DSP powers the immersive studio and standalone plugin products.

## Architecture

```text
                           DEEP MUSIC PLATFORM
                                  |
                         +--------+--------+
                         |    RUST CORE    |
                         +--------+--------+
                                  |
         +------------------------+-----------------------+
         |                        |                       |
         v                        v                       v
   deep-audio-io              deep-dsp              deep-session
  WASAPI / ASIO          effects/instruments       projects/presets
         |                        |
         +-----------+------------+
                     |
                deep-graph
                     |
       +-------------+----------------+
       |                              |
       v                              v
Deep Music Producer              Deep Plugins
 Tauri + R3F                     CLAP canonical
 Blender GLB                     VST3 wrapper later
```

## Non-negotiable realtime rules

The audio callback is a protected domain.

Allowed:
- preallocated buffers
- arithmetic/DSP
- atomics
- bounded lock-free queues
- deterministic graph traversal

Forbidden:
- Mutex/RwLock
- filesystem
- network
- logging
- JSON
- String formatting
- heap allocation
- async/await
- WebView/Tauri calls
- destruction of allocation-heavy graph objects

Graph replacement happens at a block boundary. Old graph plans are returned to the control thread for destruction.

## Memory-safety strategy

Rust is the default systems language.

`#![forbid(unsafe_code)]` is expected in DSP, graph, parameters, metering, sessions and business logic.

Unsafe code is allowed only in isolated FFI/platform adapters when a third-party SDK makes it unavoidable. Every unsafe block must document its safety invariant.

## Parameter contract

Public parameter IDs are permanent API.

Current allocation:
- 1000–1999: utility/core
- 2000–2999: Deep Glue
- 3000–3999: Deep EQ
- 4000–4999: Deep Amp
- 5000–5999: Deep Room
- 6000–6999: Deep Tape
- 7000–7999: Deep Master
- 8000–8999: Deep Keys

The UI never owns DSP state. It writes parameter values into Rust-owned handles.

## Native UI architecture

V1 uses the existing React + R3F visual twin inside Tauri 2.

```text
Blender GLB
   |
Three.js / R3F
   |
nativeBridge.js
   |
Tauri invoke
   |
Rust parameter bank
   |
DSP
```

PCM audio never crosses the WebView bridge.

UI traffic is limited to:
- parameter changes
- transport commands
- project/session commands
- device status
- 30–60 Hz meter snapshots
- semantic scene state

## 3D interaction contract

Blender control objects should carry semantic names/custom data.

Example:

```text
DEVICE_DEEP_GLUE_01
|- BODY
|- CTRL_THRESHOLD
|- CTRL_RATIO
|- CTRL_ATTACK
|- CTRL_RELEASE
|- CTRL_MAKEUP
|- CTRL_MIX
```

Runtime metadata:

```json
{
  "device": "deep_glue",
  "parameter_id": 2001,
  "interactive": true
}
```

The web/native layer resolves this metadata to a stable Rust parameter id. No DSP code depends on Blender object names.

## Plugin strategy

Canonical format: CLAP.

Why:
- clean modern host/plugin ABI
- Rust-safe adapter path through Clack
- one canonical plugin implementation
- Deep Music Producer can later become a CLAP host

First plugin: Deep Glue.

The branch already contains a CLAP adapter using the same `deep-dsp::DeepGlue` implementation as the standalone architecture proof.

VST3 is a distribution target, not the canonical internal architecture. The intended path is CLAP-first plus clap-wrapper or a thin audited adapter after the CLAP product is stable.

## Audio I/O strategy

V1 desktop target: Windows.

Priority:
1. WASAPI proof with CPAL
2. ASIO opt-in proof with CPAL
3. device enumeration/selection
4. explicit buffer-size controls
5. sample-format coverage
6. sample-rate negotiation/resampling where required
7. hot-plug/recovery
8. latency calibration

Current architecture proof deliberately rejects non-f32 default streams and mismatched default sample rates instead of silently doing unsafe or low-quality conversion.

## Performance budgets

Initial hard targets at 48 kHz:

Audio:
- zero locks in callback
- zero intentional allocations in callback
- zero NaN/Inf propagation
- stable operation at 64/128/256-frame buffers on supported hardware
- callback DSP budget < 50% of deadline at P99.9
- xruns attributable to engine: zero in an 8-hour soak test

Visual:
- target 60 fps
- audio remains uninterrupted even if UI drops below target
- meter bridge max 60 updates/s
- scene interactions send parameter deltas, not audio-rate streams

Startup:
- audio engine usable before non-critical room assets finish loading
- only current room is critical
- other rooms load during idle

## Product modules

### Core
- deep-rt
- deep-params
- deep-metering
- deep-dsp
- deep-graph
- deep-audio-io
- deep-session

### Products
1. Deep Gain — internal smoke-test device
2. Deep Glue — first commercial effect
3. Deep EQ
4. Deep Amp
5. Deep Room
6. Deep Tape
7. Deep Master
8. Deep Keys

### Application rooms
1. Ensayo
2. Grabación
3. Producción
4. Mezcla
5. Masterización

Each room is a workflow and physical metaphor, not a different audio engine.

## Implementation phases

### Phase A — architecture proof
Already implemented on this branch:
- Rust workspace
- stable parameter system
- parameter smoothing
- atomic metering
- bounded SPSC realtime queue
- graph plan abstraction
- lock-free graph handoff pattern
- versioned session model
- Deep Gain
- Deep Glue DSP
- CPAL duplex proof
- WASAPI feature path
- ASIO feature path
- Deep Glue CLAP adapter
- Tauri 2 native shell
- React/R3F -> Rust parameter bridge
- first 3D rack knobs bound to Deep Glue parameters

Exit gate:
real guitar/bass input -> Deep Glue -> output while moving the 3D controls.

### Phase B — production audio device layer
Implement:
- device list
- chosen input/output
- sample format conversion
- buffer selection
- sample-rate strategy
- reconnect
- latency measurement
- channel routing
- persistent device config

Exit gate:
30 min, 2 h and 8 h stable soak at multiple buffer sizes.

### Phase C — session engine
Implement:
- transport clock
- recording
- clip/take model
- disk writer on dedicated thread
- playback
- simple track graph
- undoable session commands
- project save/load migration

Exit gate:
record, stop, play, save, reopen with sample-accurate position preservation.

### Phase D — Deep plugin platform
Implement:
- CLAP packaging
- validator in CI
- common preset format
- parameter migration rules
- product UI shell
- Deep EQ / Amp / Room DSP
- VST3 packaging through wrapper after CLAP validation

Exit gate:
same preset/DSP behavior in plugin and standalone.

### Phase E — immersive product integration
Implement:
- semantic GLB registry
- every physical control resolves to ParameterId
- focus/hover/touch interaction system
- first-person seated cameras
- contextual UI
- native device panel
- live meters in consoles
- room acoustic routing

Exit gate:
the musician can complete a basic record -> produce -> mix -> master flow without understanding plugin slots.

### Phase F — third-party hosting
Not V1.

When implemented, third-party plugins run out-of-process behind a sandbox/service boundary. A crashing plugin must not terminate Deep Music Producer.

## Testing

Every DSP product needs:
- impulse
- sine
- sweep
- noise
- silence
- extreme parameter fuzz
- denormal/subnormal checks
- NaN/Inf checks
- deterministic golden tests where appropriate

Realtime instrumentation:
- callback deadline
- processing time
- P95/P99/P99.9
- xrun count
- queue overflow
- input starvation
- output starvation

UI tests:
- knob -> ParameterId -> Rust value
- project save -> restore control position
- loss of native shell gracefully falls back to web demo behavior

## Bevy/wgpu decision

Do not migrate the studio renderer simply because it is more native.

Create `experiments/bevy-studio` only after the native proof works. Compare:
- memory
- startup
- frame time
- GPU time
- loading
- interaction latency
- implementation cost

Migrate only if measurements justify it.

## Definition of V1

V1 is not a full replacement for Cubase/Ableton/Logic.

V1 succeeds when a musician can:
1. connect interface
2. enter a room
3. choose/play an instrument or external input
4. record takes
5. apply Deep devices by interacting with physical studio objects
6. move to mix/master rooms
7. export a finished stereo file

The studio is the interface. Rust is the audio platform underneath it.
