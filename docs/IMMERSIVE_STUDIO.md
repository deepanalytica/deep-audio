# Immersive Studio V2

Deep Music Producer is moving from a flat DAW-like preview to an **interactive studio as interface**.

## Experience contract

The user should feel that they enter a real creative space rather than opening a dashboard.

The web preview therefore uses:

- a full-screen Three.js studio instead of a large opaque central panel;
- camera look with pointer drag;
- WASD movement inside each room;
- clickable instruments, amps, microphones, racks, speakers and consoles;
- five distinct rooms: Ensayo, Grabación, Producción, Mezcla and Master;
- contextual HUD instead of permanent engineering panels;
- session-player summoning;
- an original Web Audio prototype for drums, bass, keys, synth and guitar;
- Harmony Lab with key and progression changes that the virtual band follows;
- acoustic-room presets implemented with generated convolution impulses;
- transport, BPM and metronome.

## Important product boundary

The browser build is an interactive experience and product prototype. It does not claim to replace the native audio engine.

Professional functionality stays in the Windows desktop application:

- ASIO;
- deterministic low-latency monitoring;
- 24-bit recording;
- future multisample libraries;
- native DSP;
- future VST3 hosting.

The Web Audio musicians are deliberately synthesized from first principles and contain no third-party sample library. They prove the interaction model, not final sonic fidelity.

## Interaction model

- Drag: look around.
- WASD: move.
- Mouse wheel: move closer/farther.
- Click a studio object: open its contextual controls.
- Músicos: summon/remove session players.
- Sonidos: choose instrument presets.
- Harmony Lab: set key/progression.
- Room: change the acoustic simulation.

## Design rule

Do not add a large opaque panel in the middle of the studio again.

The room is the primary interface. HUD, drawers and technical controls are subordinate to the spatial experience.
