# Deep Music Producer — 3D Asset Pipeline

## Goal

The studio must never depend on a painted background for its core experience. The room, furniture, instruments and hardware are real-time 3D assets that can be inspected, animated and clicked.

The current V3 uses detailed procedural geometry and materials as a robust fallback. Production assets can replace any procedural component without changing product logic.

## Canonical format

- Authoring: Blender.
- Runtime interchange: glTF 2.0 / GLB.
- Texture delivery: KTX2 / Basis Universal when assets justify it.
- Geometry compression: Meshopt or Draco after visual validation.
- Coordinate system: Y up; forward is -Z.
- Units: meters.
- Origins: useful interaction pivot, normally floor-center or mechanical hinge.
- Naming: `category_asset_variant_vNN`.
- Maximum material count per ordinary prop: 4.
- Prefer one atlas per prop family where practical.

## PBR texture set

Use only maps that materially improve the object:

- baseColor;
- normal;
- roughness;
- metallic;
- ambient occlusion;
- emissive for LEDs/screens.

Avoid baking lighting into baseColor. Lighting belongs to the room.

## LOD budgets

### Hero equipment
Consoles, drum kits, pianos, main monitors:
- LOD0: 80k–180k triangles.
- LOD1: 35k–80k.
- LOD2: 12k–30k.

### Ordinary props
Amps, racks, guitars, microphones:
- LOD0: 25k–70k.
- LOD1: 10k–30k.
- LOD2: 4k–12k.

### Background props
- 2k–15k triangles.
- merge static geometry where it improves draw-call count.

These are budgets, not targets. Silhouette and material quality matter more than unnecessary topology.

## Texture budgets

- Hero asset: up to 2K per major map on desktop web.
- Ordinary prop: 1K–2K.
- Background prop: 512–1K.
- UI screens: vector/HTML whenever possible instead of texture.

## Required Blender export checks

1. Apply transforms.
2. Remove hidden geometry.
3. Recalculate normals.
4. Validate UVs and texel density.
5. Pack only runtime-required textures.
6. Confirm origin/pivot.
7. Test at real-world scale.
8. Export GLB.
9. Run through glTF validator.
10. Open in the V3 asset sandbox before inclusion.

## Runtime registry

Every production asset will live under:

`web/public/models/<category>/<asset>.glb`

The scene component owns semantic behavior. The model is only the visual representation. This keeps click actions, presets and audio routing independent from Blender geometry.

Example:

`objects/Guitar.jsx` remains the interaction contract.
Later, its procedural mesh can be replaced by `<AssetModel src="/models/guitars/session-bass.glb" />`.

## Art direction

Deep Music Producer is not a photorealistic museum.

Target:
- premium recording-studio realism;
- restrained cinematic lighting;
- readable silhouettes;
- warm wood / dark metal / acoustic fabric;
- selective practical LEDs;
- believable wear, but never dirty or cluttered;
- foreground / midground / background depth in every camera composition.

Avoid:
- game-store asset soup;
- exaggerated cyberpunk neon;
- shiny plastic everywhere;
- excessive bloom;
- fake UI labels baked into textures;
- copying identifiable proprietary hardware trade dress one-to-one.

## Acoustic rooms

Visual room geometry and acoustic simulation are related but separate. A beautiful room does not justify a fake acoustic claim. Production room presets must be based on measured or deliberately designed impulse responses with source provenance and documented intent.

## Quality gate

No 3D asset enters main if it fails any of:

- wrong scale;
- poor silhouette;
- visibly stretched UVs;
- excessive draw calls;
- clipped camera interactions;
- unclear clickable affordance;
- license/provenance unknown;
- adds visual noise without improving the musical experience.
