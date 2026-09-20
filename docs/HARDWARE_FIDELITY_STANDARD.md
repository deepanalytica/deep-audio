# Deep Music Producer — Hardware & Instrument Fidelity Standard

## Purpose

Deep Music Producer treats instruments and studio equipment as product surfaces, not scenery.

A musician should be able to read an object at a glance and believe its scale, construction and control hierarchy before interacting with it.

The standard applies to Blender assets, procedural fallbacks and runtime jewelry layers.

## Core rule

No hero instrument or piece of studio hardware is approved as a generic volume with controls painted on top.

The object must communicate:

- believable physical dimensions;
- credible mechanical construction;
- usable control hierarchy;
- distinct materials;
- appropriate gaps, seams and fasteners;
- real-world ergonomics;
- semantic interactive regions.

## Reusable component system

Canonical runtime components live in:

`web/src/scene/hardware/StudioHardware.jsx`

Required reusable families:

- rotary knob;
- encoder;
- fader;
- toggle;
- push button;
- LED;
- VU meter;
- OLED/LCD display;
- rack faceplate;
- screw / fastener;
- piano keybed;
- speaker driver;
- microphone grille;
- amplifier control strip;
- drum pedal / small hardware.

Blender should eventually mirror the same component vocabulary.

## Scale rules

All authoring is in meters.

Before approval, compare the asset against a 1.75 m reference human and at least one adjacent known-size studio object.

### Reference dimensions

These are design ranges, not instructions to copy a specific commercial product.

- 19-inch rack faceplate width: approximately 0.483 m.
- 1U rack height: approximately 0.04445 m.
- common long-throw fader travel: approximately 0.10 m.
- compact fader travel: approximately 0.06 m.
- common large studio knob diameter: roughly 0.028–0.050 m.
- standard piano octave width: approximately 0.165 m.
- full 88-key keyboard width is usually around 1.2–1.45 m depending on enclosure.
- large-diaphragm microphone body: roughly 0.045–0.065 m diameter and 0.17–0.24 m body length.
- nearfield monitor height: roughly 0.30–0.50 m.
- midfield/main monitor can be substantially larger; verify against the room and listening distance.

Use measured references for final hero assets.

## Control hierarchy

A control surface must not look like random knobs.

Every faceplate should communicate hierarchy:

1. primary control;
2. secondary controls;
3. mode / bypass;
4. signal / status;
5. metering;
6. labels / grouping.

Size, spacing, material and illumination should reflect that hierarchy.

## Knobs

Hero knobs require:

- cap/body separation;
- visible indicator;
- grip or edge treatment when appropriate;
- clearance from adjacent controls;
- believable shaft depth;
- tick marks when the function benefits from them;
- material separation from the faceplate.

Avoid rows of identical cylinders.

## Faders

Faders require:

- slot;
- travel range;
- cap;
- centre/reference marks when appropriate;
- enough physical clearance for a hand;
- consistent orientation;
- a value/state that can later map to real DSP.

## LEDs

LEDs must be functional visual signals.

Allowed roles:

- power;
- signal;
- gain reduction;
- clip;
- mode;
- bypass;
- reference state.

Avoid decorative random blinking.

## Displays

Small displays should contain meaningful information such as:

- patch / preset;
- LUFS;
- true peak;
- gain reduction;
- frequency;
- ratio;
- time;
- routing;
- room mode.

Runtime displays should use CanvasTexture, SVG or equivalent dynamic surfaces rather than permanently baking state into the GLB.

## Rack hardware

Use 19-inch proportions where the object is explicitly rack-compatible.

A rack unit needs:

- mounting ears or credible enclosure framing;
- screws;
- faceplate thickness;
- ventilation;
- spacing between units;
- cable / rear-depth implication;
- controls aligned to a coherent grid.

## Piano / keyboard

A credible keyboard requires:

- correct white/black key pattern;
- realistic relative black-key length;
- consistent key width;
- visible key gaps;
- chassis lip;
- control area separate from keybed;
- pitch/mod controls when appropriate;
- displays and encoders proportional to human fingers.

Do not use evenly alternating black keys.

## Drum kit

A drum kit must be assembled as an instrument, not a collection of cylinders.

Minimum conventional set layout:

- kick;
- snare;
- rack tom(s);
- floor tom;
- hi-hat;
- ride;
- crash(es);
- stands;
- pedals;
- throne.

Verify:

- snare height;
- tom angles;
- cymbal stand reach;
- kick pedal access;
- drummer reach envelope;
- cymbal collision;
- plausible spacing.

Genre-specific kits may diverge deliberately.

## Guitar / bass

Hero stringed instruments require:

- scale length appropriate to instrument type;
- body / neck / headstock proportion;
- bridge;
- pickups or acoustic soundhole;
- knobs / switches;
- strings;
- tuning hardware;
- believable thickness;
- cable jack / strap points where relevant.

## Amplifiers

Amp and cabinet design requires:

- enclosure;
- grille;
- speaker placement;
- control strip;
- knobs/switches;
- handles / feet where appropriate;
- ventilation;
- seams;
- power/status state.

## Microphones

Hero microphone requirements:

- body;
- grille;
- capsule-zone implication;
- mount / shock mount where relevant;
- connector;
- stand geometry;
- cable path;
- appropriate physical scale.

## Speakers / monitors

Require:

- cabinet;
- baffle;
- woofer surround;
- cone;
- dust cap;
- tweeter / waveguide;
- status LED;
- ports / vents if appropriate;
- stand / decoupling support.

Drivers must not look like flat circles.

## Materials

At minimum distinguish:

- painted metal;
- brushed/anodized metal;
- plastic;
- rubber;
- glass;
- acoustic fabric;
- wood;
- ivory/key material;
- emissive display/LED surfaces.

Do not use one roughness value for an entire object.

## Geometry quality

Hero assets require:

- bevels that survive actual camera distance;
- correct panel thickness;
- seams and recesses;
- no intersecting controls;
- no floating controls;
- mechanically plausible mounting;
- clean silhouettes.

## Interactive semantics

Interactive nodes must use stable semantic names.

Examples:

- console_eq_gain_01
- console_threshold
- console_reference_level
- synth_filter_cutoff
- keyboard_mod_wheel
- amp_gain
- amp_master
- drum_snare
- drum_hihat
- mic_pad_switch

Runtime logic owns state; the mesh owns visual representation.

## Visual QA

Reject the asset if:

- a musician immediately notices wrong proportions;
- control spacing would be unusable by a human;
- the key pattern is wrong;
- drum components are implausibly positioned;
- all controls look identical;
- LEDs are decorative rather than semantic;
- the object has no material separation;
- the silhouette reads as a primitive;
- close camera focus reveals obvious placeholder geometry.

## Benchmark strategy

Do not spread medium quality across every room.

First make Master / Mix pass this standard at hero-camera distance.

Then propagate the proven component language to Production, Recording and Rehearsal.
