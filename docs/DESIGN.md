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
- Every room offers three explicit camera perspectives: room overview, task/performance focus and equipment focus. Entering another room resets to its overview; selecting a hotspot may temporarily take camera focus.
- Signal motion appears only while playback is active; recording receives a distinct red state.
- Drawers protect focus, close with Escape and restore focus to their trigger.
- `prefers-reduced-motion` removes non-essential movement while preserving state changes.

Perspective labels follow the task in each room:

- Ensayo: Sala, Interpretación, Equipo.
- Grabación: Sala, Captura, Cadena.
- Producción: Sala, Teclado, Sintetizadores.
- Mezcla: Sala, Consola, Racks.
- Master: Sala, Escucha, Cadena.

## Operational dock

The bottom dock is the persistent operational surface. It stays compact over the room and provides import/remove, transport, seek, record, BPM, metronome, optional input monitoring and output volume without requiring a context panel.

At a 320 px viewport, BPM and the primary controls remain visible and usable. Secondary labels and metadata may condense, but the essential audio actions do not disappear.

The monitor control is deliberately separate from recording. Recording always captures the dry input; Monitor only changes what the musician hears. The interface recommends headphones whenever processed input monitoring is enabled to reduce feedback risk.

## Live equipment and mastering controls

- Equipment panels describe actions as audible adjustments and apply them to the current audio state in real time.
- The active action remains visible per piece of equipment, so returning to a panel preserves context.
- Mastering profiles are reversible starting points. Editing tone, contour, compression, saturation, stereo width or limiter ceiling moves the state to a custom profile and updates the audio immediately.
- Reference and measurement readouts may support comparison, but simulated values retain the `DEMO · DATOS SIMULADOS` label.

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
- Microphone recording is explicit, permission-gated, dry by design and downloadable locally.
- Processed input monitoring is optional and never changes the dry recording.
- Simulated mastering numbers are labelled as demonstrations.
- The interface never claims that a mix or master is objectively good.

## Performance contract

- The operational UI loads before the Three.js scene bundle.
- Mobile uses reduced shadow, environment and post-processing resolution.
- Device pixel ratio adapts under load.
- If the 3D layer fails, audio controls remain available with an actionable recovery state.
