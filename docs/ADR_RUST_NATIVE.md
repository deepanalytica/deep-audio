# Rust Native Platform — Architecture Decision Records

## ADR-001 — Rust is the strategic systems language
Accepted.

DSP, graph, realtime infrastructure, session/state and new native platform code are Rust-first. Existing C++/JUCE code remains as historical/prototype material until replaced or a specific SDK justifies keeping an adapter.

## ADR-002 — Realtime callback forbids locks and allocations
Accepted.

No mutexes, filesystem, network, logging, JSON, async runtime or intentional heap allocation in the audio callback.

## ADR-003 — DSP has no UI dependencies
Accepted.

`deep-dsp` must compile and test without Tauri, React, Three.js, Blender or platform GUI libraries.

## ADR-004 — Stable numeric parameter IDs are public API
Accepted.

Published IDs are not renamed/reused. Human-readable names may change; numeric IDs persist for sessions, automation and plugins.

## ADR-005 — CLAP is canonical plugin format
Accepted.

The first plugin adapter is implemented with Clack. VST3 becomes a distribution wrapper/adapter after canonical CLAP behavior is validated.

## ADR-006 — Tauri + React/R3F is V1 immersive frontend
Accepted.

We preserve the existing visual work. The WebView transports control/state only, never PCM.

## ADR-007 — Bevy/wgpu is an evidence-based migration path
Accepted.

A native renderer is evaluated later through profiling rather than adopted pre-emptively.

## ADR-008 — Blender exports semantic control surfaces
Accepted.

3D assets carry semantic control/device metadata and stable parameter IDs. Runtime visual names are not the DSP API.

## ADR-009 — Third-party plugins are excluded from V1
Accepted.

Future external plugins are sandboxed out-of-process.

## ADR-010 — Unsafe Rust is isolated
Accepted.

Core crates use `#![forbid(unsafe_code)]`. FFI exceptions require a dedicated adapter crate and documented invariant.

## ADR-011 — Graphs are built off-thread and swapped at block boundaries
Accepted.

No node construction/destruction occurs in the realtime callback. Retired graph plans are reclaimed by the control thread.

## ADR-012 — One DSP implementation powers app and plugins
Accepted.

Deep Glue demonstrates the rule: the standalone path and CLAP adapter instantiate the same `deep-dsp::DeepGlue`.
