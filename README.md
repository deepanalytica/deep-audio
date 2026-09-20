# Deep Audio

This repository now has two product lines while the new desktop direction is validated.

## Desktop studio

The active desktop product work lives in:

- desktop/
- docs/PRODUCT.md
- docs/ARCHITECTURE.md
- docs/ROADMAP.md
- docs/TEST_PLAN.md
- docs/DECISIONS.md

Goal: a musician-first home studio that minimises setup friction while preserving professional depth through progressive disclosure.

The first desktop vertical slice targets Windows + Fluid Audio SRI-2 and covers:

- audio-device selection;
- live instrument monitoring;
- useful bass/guitar starting tones;
- backing-track playback;
- metronome;
- 24-bit WAV recording;
- waveform feedback;
- workflow navigation from Ensayo to Master.

See desktop/README.md for build instructions.

## Existing Android utility

The original Android audio-player work remains under app/ and is intentionally preserved during desktop validation. It is not being deleted or silently repurposed.

## Development rule

Do not add features because a DAW is expected to have them.

Add them when they shorten the path from musical intent to a reliable result, or when the current architecture cannot support the next validated workflow.
