# Deep Music Producer — Rust Native Platform

Rust owns realtime audio, DSP, state, routing, parameters and plugins. React/R3F remains the immersive visual shell for the first native product. Tauri is a control/state bridge only: PCM audio never crosses the WebView bridge. CLAP is the canonical plugin target. Blender GLB remains the source of truth for the visual studio and semantic control surfaces.

## Run

```bash
cd native
cargo test
cargo run -p deep-audio-lab
```

Windows WASAPI proof:

```powershell
cargo run -p deep-audio-lab --features native-audio -- --live
```

ASIO is opt-in because the Steinberg ASIO SDK must be configured locally:

```powershell
cargo run -p deep-audio-lab --features asio -- --live --asio
```

## Realtime law

The audio callback must never perform filesystem access, network access, logging, locks, JSON work or heap allocation.
