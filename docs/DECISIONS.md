# Product and Engineering Decisions

## D001 — Windows first

Decision:
Build and validate Windows before macOS.

Why:
The reference musician and Fluid Audio SRI-2 setup are available now. Cross-platform parity would double the validation surface before the core loop is proven.

## D002 — JUCE only in the first slice

Decision:
Use JUCE 9.0.2 directly.

Why:
It already solves device I/O, formats, recording, DSP and desktop UI. Tracktion Engine is valuable later but unnecessary today.

Revisit:
Before M2 multi-track editing.

## D003 — Record dry, monitor processed

Decision:
The recorded source is always dry. Processed input monitoring is a separate, optional listening path that follows the selected room and tone/mastering chain. The product recommends headphones when that monitor is enabled.

Why:
A fast preset should improve the playing experience without permanently baking a decision into the source recording. Keeping monitoring independent also lets the musician silence the live return without changing recording behaviour and reduces accidental feedback risk.

## D004 — No AI in the audio callback

Decision:
All future AI or recommendation features operate asynchronously on structured measurements or renders.

Why:
Real-time audio must remain deterministic and bounded. Network/model latency cannot be permitted to threaten sound output.

## D005 — Local-first

Decision:
Core sessions and audio work without an account or internet connection.

Why:
Recording is a local real-time job. Cloud dependency increases latency, privacy risk and failure modes without helping the core promise.

## D006 — No plugin hosting in v0.1

Decision:
Ship useful built-in chains before VST3 hosting.

Why:
Plugin discovery, compatibility, UI embedding, crash isolation and support are a large product surface. They are not required to validate Time to Sound.

## D007 — Rooms are workflow states, not separate apps

Decision:
Ensayo, Grabación, Producción, Mezcla and Master share one project/session.

Why:
The mental model should follow the musician's work. Files should not need to be manually exported and re-imported between stages.

## D008 — MIDI and sample workflows follow the core audio loop

Decision:
Do not describe MIDI sequencing, sample browsing or sample-based production as implemented in the current studio. Treat them as a subsequent product phase.

Why:
The current implementation validates the primary local-audio loop: room navigation, live equipment actions, backing-track transport, dry recording with optional processed monitoring and reversible mastering controls. Expanding the production surface before that loop is proven would blur the product's actual capabilities.
