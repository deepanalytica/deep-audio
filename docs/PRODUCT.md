# Deep Audio Studio — Product Definition

## Problem

Musicians regularly lose momentum before playing or recording because conventional DAWs make them solve engineering problems first: device setup, routing, plugin choice, gain staging, effect chains, session templates and export configuration.

The product exists to remove that friction without removing professional depth.

## Product thesis

Deep Audio Studio is not a smaller DAW.

It is a musician-first desktop studio with progressive disclosure:

1. Start from intent.
2. Get a safe, useful sound immediately.
3. Record without routing work.
4. Reveal engineering controls only when the user asks for them.
5. Move through clear rooms: Ensayo → Grabación → Mezcla → Master.

## Primary user

A musician with a home-studio interface and one or more instruments who wants to practise, capture ideas and finish music but does not want every session to begin as an audio-engineering exercise.

The first reference user is a bassist/guitarist on Windows using a Fluid Audio SRI-2.

## Jobs to be done

When I have an idea, let me capture it before setup breaks the creative state.

When I need to learn a song, let me import it, loop it, use a click and play on top of it quickly.

When I want a useful instrument sound, give me excellent starting points in musical language and let me open advanced controls later.

When a song is ready to finish, guide me from balance to master using measurements and reversible recommendations.

## Product principles

- Instrument before interface.
- Defaults must be musically useful.
- Every automatic change must be reversible.
- AI never belongs in the real-time audio thread.
- Local-first for recording and sessions.
- No mandatory account for core recording.
- No cloud dependency for basic audio.
- Progressive disclosure instead of feature removal.
- Professional depth is allowed; professional friction is not.
- Never claim a mix/master is good because an AI said so; show measurable evidence and let the musician decide.

## MVP success criteria

The MVP succeeds when a new user can:

- select the interface;
- hear the instrument;
- choose a useful starting tone;
- import a song;
- play the song with a metronome;
- record a clean 24-bit take;
- find the recorded file;

without reading documentation.

Quantitative targets:

- Time to Sound after initial device setup: <10 seconds.
- Time to Record after initial device setup: <20 seconds.
- No audio-thread allocations in steady-state processing.
- No disk I/O directly in the audio callback.
- 30-minute recording integrity test with zero corrupted files.
- Stable operation at 48 kHz / 128 samples on the reference SRI-2 system.

## Explicit non-goals for v0.1

- Full MIDI production.
- Virtual instrument marketplace.
- Cloud collaboration.
- Stem separation.
- AI-generated music.
- VST hosting.
- Advanced comping.
- Elastic audio.
- Automatic mastering claims.
- Cross-platform parity.

These are not rejected forever. They are excluded until the core loop proves value.
