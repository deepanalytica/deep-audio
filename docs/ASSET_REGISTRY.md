# Asset Registry

## Contract

`web/src/assets/assetRegistry.js` is the runtime source of truth for whether a production GLB is safe to request. `web/public/models/manifest.json` is the reviewable inventory for provenance, version, Blender source, output path, budgets and semantic node names.

An asset follows this runtime flow:

    registry available = true
        -> load the versioned GLB with useGLTF
        -> clone the scene for independent mounts
        -> keep interaction in the React wrapper

    registry available = false, load pending, or load error
        -> render the named procedural AssetFallback
        -> keep the same interaction metadata and camera focus

The registry flag prevents speculative network requests for exports that do not exist. A React error boundary catches a failed declared asset and restores its fallback instead of taking down the studio.

The five immersive room records are currently active: Practice, Recording, Production, Mix and Mastering. Their room GLBs own appearance only; `ImmersiveRoom` and `MasteringRoom` keep hit areas, focus poses and UI metadata in React.

## Adding an asset

1. Create original work or record the external source, author, licence, URL and modifications.
2. Add the Blender source under `assets/blender/`.
3. Follow `docs/ASSET_PIPELINE.md` and export into the matching `web/public/models/` category.
4. Validate glTF, scale, transforms, pivots, normals, UVs, textures and visual parity.
5. Add or update the manifest record with measured counts.
6. Register the runtime path with `available: false`.
7. Verify its procedural fallback and interaction contract.
8. Set `available: true` only after the GLB is committed and the production build passes.

## Semantic ownership

Node names such as `master_console_eq_section` or `main_monitor_left_woofer` are useful for inspection, animation and future material targeting. They do not contain product behaviour. React owns clicks, camera focus, state, audio and contextual controls so replacing visual geometry never rewrites musical workflows.

## Preload policy

There is no automatic preload in the current five-room set. Every room remains an optional visual replacement and its procedural fallback appears while loading or after a declared failure. Add preload only after profiling shows a meaningful reduction in visible latency without harming initial load or memory use.
