# Deep Audio Studio — Interface System

## Product mode

Operate. The interface exists to help a musician reach sound, rehearsal and recording quickly; the 3D studio creates place and context, but the controls must remain legible and complete without depending on the scene.

## Visual thesis

An immersive control room: a warm, physical studio with a disciplined blue operating layer. The environment should feel cinematic; the interface should feel calm, precise and trustworthy.

## Information hierarchy

1. **Workflow:** Ensayo → Grabación → Producción → Mezcla → Master.
2. **Current intention:** one room title and one concise explanation.
3. **Session state:** signal, transport status and the current local track.
4. **Primary controls:** import, play, stop, record, tempo and metronome.
5. **Progressive depth:** musicians, sounds, harmony, acoustics and room equipment.

The same information architecture is retained on mobile. Controls reflow instead of disappearing.

## Interaction thesis

- Room changes move the camera and replace the environment as one authored transition.
- Signal motion appears only while playback is active; recording receives a distinct red state.
- Drawers protect focus, close with Escape and restore focus to their trigger.
- `prefers-reduced-motion` removes non-essential movement while preserving state changes.

## Visual language

- Background: deep blue-black (`#030912`).
- Operational accent: blue (`#1688ff`).
- Physical warmth: amber light supplied by the 3D studio, not competing UI accents.
- Success: green. Recording/error: red. These meanings do not change between rooms.
- Surfaces use a single border or a soft shadow; avoid decorative glass layers and stacked cards.
- Measurement and timer values use tabular numerals.

## Accessibility contract

- Every visual control has a persistent accessible name, including icon-only mobile controls.
- Stage navigation exposes the active room with `aria-current="step"`.
- Drawers and the studio map behave as keyboard-contained dialogs.
- All 3D hotspots have an equivalent **Equipo de sala** list for keyboard and assistive technology.
- Focus is visible, touch targets are at least 44 px for coarse pointers and contrast targets WCAG AA.

## Truth and trust

- Imported audio remains local to the browser.
- Microphone recording is explicit, permission-gated and downloadable locally.
- Simulated mastering numbers and conceptual presets are labelled as demonstrations.
- The interface never claims that a mix or master is objectively good.

## Performance contract

- The operational UI loads before the Three.js scene bundle.
- Mobile uses reduced shadow, environment and post-processing resolution.
- Device pixel ratio adapts under load.
- If the 3D layer fails, audio controls remain available with an actionable recovery state.
