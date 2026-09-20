# Roadmap

The roadmap is ordered by risk, not by visual excitement.

## Immersive Asset Pipeline

Status: first Blender vertical slice implemented and integrated; review/optimization remains.

Current slice:

- `MASTERING_ROOM_001` real-scale procedural benchmark;
- original mastering-console hero fallback with semantic sections;
- runtime `AssetModel` / registry / fallback contract;
- manifest with provenance and target GLB paths;
- smooth camera focus and contextual mastering HUD;
- demo metering labelled as non-live data;
- visual-twin / acoustic-twin boundary documented.
- Blender 5.2.1 LTS source, GLB export and visual review render;
- 99,184-triangle modular room with 17 materials and applied mesh transforms.

Next gate:

- repeat the Blender MCP smoke test whenever a new session attaches;
- profile the integrated monolithic room and decide whether split hero exports reduce load/draw-call cost;
- add image textures only where they materially outperform the current physically coherent procedural materials;
- compare future GLB revisions against the procedural fallback and eight camera references.

Do not start the remaining four Blender rooms before Mastering Room 001 passes the full GLB quality gate.

## M0 — Foundation

Status: implemented in the desktop foundation branch.

Deliver:

- desktop build;
- device selection;
- ASIO-capable JUCE build;
- live monitoring;
- input meter;
- backing-track playback;
- metronome;
- useful bass/guitar starting presets;
- dry 24-bit WAV recording;
- waveform display;
- room navigation.

Exit gate:

A real bass through the Fluid Audio SRI-2 can be heard, recorded and played against a backing track reliably.

## M1 — Practice Room

Build only after M0 hardware validation.

Deliver:

- loop A/B;
- seek/scrub;
- markers;
- count-in;
- tap tempo;
- independent backing/instrument volumes;
- tuner;
- playback speed with pitch preservation;
- pitch shift;
- recent songs;
- session autosave.

Exit gate:

A musician can learn and rehearse a song without opening another app.

## M2 — Real multi-track recording

Deliver:

- versioned session format;
- audio tracks;
- clips;
- drag/cut/split;
- fades/crossfades;
- punch in/out;
- take lanes;
- track gain/pan;
- solo/mute/arm;
- buses;
- non-destructive edits;
- latency compensation tests.

Decision gate:

At the beginning of M2, benchmark building the edit model ourselves versus adopting Tracktion Engine commercially. Choose based on implementation cost, licence economics and migration risk, not fashion.

## M3 — Mix Room

Deliver:

- mixer;
- parametric EQ;
- compressor;
- gate;
- saturation;
- reverb/delay sends;
- spectrum;
- peak/RMS meters;
- buses;
- automation;
- reference track;
- level-matched A/B;
- undoable guided recommendations.

Exit gate:

A complete small-band/session mix can be finished without third-party plugins.

## M4 — Master Room

Deliver:

- stereo render handoff from Mix;
- LUFS-I/LUFS-S;
- true peak;
- stereo correlation;
- dynamic-range views;
- mastering EQ;
- dynamic EQ;
- multiband compression;
- saturation;
- limiter;
- reference A/B;
- export profiles;
- bit-depth conversion and dithering only when needed.

Exit gate:

The user can create a technically valid final master and understand what changed.

## M5 — Extension ecosystem

Only after retention data proves the core product.

Candidates:

- VST3 hosting;
- stem separation;
- chord/tempo detection;
- transcription;
- cloud collaboration;
- optional AI engineer;
- macOS;
- plugin/preset marketplace.

## Product metrics

North stars:

- Time to Sound.
- Time to Record.

Supporting:

- sessions started per active musician;
- percentage of sessions that reach a saved take;
- crash-free sessions;
- audio dropout rate;
- median setup interventions per session;
- percent of users that never open advanced settings;
- repeat sessions after 7 and 30 days.
