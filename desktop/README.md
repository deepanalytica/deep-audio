# Deep Audio Studio — Desktop MVP

Desktop-first home studio for musicians who want to connect an instrument and start playing or recording without configuring a traditional DAW first.

## What this branch proves

The first vertical slice intentionally stays small:

- Windows desktop app.
- JUCE 9.0.2.
- Audio device selection, including ASIO when available.
- Live input monitoring.
- Four useful tone starting points: Dry, Studio Bass, Tight Bass, Warm Guitar.
- Backing-track import and playback.
- Metronome from 40–240 BPM.
- 24-bit WAV recording to the user's Music/Deep Audio/Recordings folder.
- Input level feedback.
- Waveform views for backing track and recorded take.
- Product navigation for Ensayo, Grabación, Mezcla and Master.

This is not pretending to be a finished DAW. It is the smallest end-to-end product slice that lets us validate the core promise: open the app, connect the instrument, sound good, record.

## Build on Windows

Requirements:

- Visual Studio 2022 or newer with Desktop development with C++.
- CMake 3.22+.
- Git.
- A compatible audio driver. For Fluid Audio SRI-2, install the manufacturer's Windows driver and choose its ASIO device in the Audio panel.

From the repository root:

    cmake -S desktop -B desktop/build
    cmake --build desktop/build --config Release

Executable location depends on the generator, commonly:

    desktop/build/DeepAudioStudio_artefacts/Release/Deep Audio Studio.exe

## Reference hardware

Primary MVP test path:

- Fluid Audio SRI-2
- Electric bass
- Windows 11
- 48 kHz
- 24-bit recording
- Start at 128 samples; verify 64 and 256 samples as part of the test matrix.

## Product rule

Time to Sound matters more than feature count.

Target after the first-run device choice:

- App open → audible instrument: under 10 seconds.
- App open → valid recording started: under 20 seconds.

## Dependency decision

The MVP uses JUCE directly and does not use Tracktion Engine yet.

Reason: the current slice only needs device I/O, playback, DSP, recording and UI. Adding a second audio framework now would increase dependency and licensing surface before we have validated the product loop.

If non-destructive multi-track editing becomes expensive to maintain ourselves, Tracktion Engine can be evaluated behind the session-engine boundary later.

## Licensing

JUCE 9 is dual-licensed under AGPLv3/commercial terms. Enabling JUCE_ASIO also brings the ASIO SDK terms into consideration. Before distributing a closed-source commercial binary, select and document the appropriate licences.

No licence decision is hidden in the architecture.
