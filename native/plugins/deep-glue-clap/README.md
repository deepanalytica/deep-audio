# Deep Glue CLAP

The first Deep Music Producer plugin adapter.

It uses the same `deep-dsp::DeepGlue` processor as the standalone application. The plugin layer owns only CLAP ports, parameter events, state serialization and host integration.

The dependency on Clack is pinned in `native/Cargo.toml` to a known upstream revision.

Build:

```bash
cd native
cargo build -p deep-glue-clap --release
```

The produced dynamic library is the CLAP binary payload. Packaging/extension naming is handled by the release pipeline.
