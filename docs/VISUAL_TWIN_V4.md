# Visual Twin V4 — Cinematic Quality Gate

## Why this iteration exists

The Blender/GLB room set solved structure, semantics and runtime ownership, but it did not yet solve perceived quality. A room can be technically correct, interactive and real-scale while still looking like a prototype.

V4 therefore treats visual quality as a first-class product requirement.

The target is not "more 3D". The target is a credible premium studio experience whose first frame communicates material quality, depth, restraint and professional intent.

## Perceptual problems addressed

The previous implementation was weakened by:

- flat export materials with little microstructure;
- uniform roughness;
- insufficient material separation;
- game-like blue HUD styling competing with the room;
- too much bloom/noise relative to physical detail;
- wide camera perspective that exaggerated a game-engine look;
- UI occupying too much of the lower visual field;
- procedural sparkle effects that did not belong in a professional studio.

## V4 runtime material direction

`web/src/visual/materialDirector.js` upgrades committed GLB assets at runtime without changing their semantic nodes.

Current directed material families:

- oiled walnut;
- warm oak;
- smoked wood;
- acoustic fabric;
- warm acoustic fabric;
- brushed metal;
- anodized metal;
- rubber;
- studio glass;
- screens;
- LEDs;
- ceramic / control surfaces.

The material director adds procedural high-frequency information rather than external unlicensed textures:

- albedo grain;
- roughness variation;
- bump variation;
- textile weave;
- brushed-metal direction;
- controlled clearcoat;
- emissive treatment.

This is intentionally deterministic and local. It introduces no asset licensing dependency.

## Cinematography

`web/src/visual/StudioCinematography.jsx` owns the renderer-level look:

- ACES filmic tone mapping;
- room-specific exposure;
- sRGB output;
- soft shadow configuration;
- restrained practical light accents;
- reduced bloom;
- reduced synthetic noise;
- softer vignette;
- tighter architectural FOV.

The studio should read as an architectural/music visualization, not a generic game scene.

## HUD direction

The HUD is subordinate to the room.

V4 changes the dominant interface language from saturated blue telemetry to:

- graphite;
- warm ivory;
- restrained brass;
- low-opacity glass;
- smaller footprints;
- reduced glow;
- compact workflow navigation.

The large bottom control area is converted into a floating studio dock so a much larger portion of the room remains visible.

## Visual acceptance gate

A feature is not visually complete merely because:

- Vite builds;
- a GLB loads;
- click targets work;
- Blender validation passes.

A room should fail visual review if any of the following are true:

1. large surfaces read as flat colors;
2. metals, wood, fabric and rubber are hard to distinguish at a glance;
3. bevels disappear under lighting;
4. the HUD is more visually dominant than the room;
5. bloom or LEDs substitute for physical detail;
6. the camera feels like a debug/game viewport;
7. foreground, midground and background do not separate;
8. equipment silhouettes lack recognizable mechanical hierarchy;
9. there is no credible shadow grounding;
10. a screenshot would still be described as a blockout.

## Gaussian Splatting decision

3D Gaussian Splatting is part of the target architecture, but only when it provides a real visual source.

The production hybrid is:

    VISUAL ENVIRONMENT
    Gaussian splat / photoreal room capture
            +
    INTERACTIVE TWIN
    Blender GLB hero equipment + semantic hit targets
            +
    PROXY GEOMETRY
    navigation / collision / relighting support
            +
    ACOUSTIC TWIN
    IR / HRTF / distance / early reflections

Do not replace a coherent GLB room with an empty Splat component or synthetic placeholder.

The first accepted splat must have:

- known provenance;
- a documented capture or generation process;
- optimized delivery format;
- measured GPU/memory impact;
- a proxy mesh;
- camera registration against the interactive GLB layer;
- a quality comparison against the V4 mesh-only room.

## Next art-production milestone

The next Blender pass should not create more room variants.

It should deepen the existing benchmark room with:

- hero console silhouette refinement;
- more realistic monitor cabinetry and drivers;
- cable topology;
- rack faceplate hierarchy;
- fasteners and seams;
- trim profiles;
- acoustic-panel edge construction;
- realistic furniture;
- high-quality UVs for selected hero objects.

Only after the benchmark room passes the visual gate should the same asset language propagate to the remaining rooms.