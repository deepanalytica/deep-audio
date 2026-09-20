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
The recorded source is dry while the player hears the selected tone chain.

Why:
A fast preset should improve the playing experience without permanently baking a decision into the source recording.

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
Ensayo, Grabación, Mezcla and Master share one project/session.

Why:
The mental model should follow the musician's work. Files should not need to be manually exported and re-imported between stages.
