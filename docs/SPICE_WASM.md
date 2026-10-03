# Local CSPICE WebAssembly

The browser precision layer can be built locally from a CSPICE WebAssembly static library.

1. Obtain CSPICE from an authorized/upstream source and preserve its license/provenance.
2. Build the toolkit for Emscripten so that `libcspice_wasm.a` is available.
3. Set `CSPICE_ROOT` (or `CSPICE_LIB` and `CSPICE_INCLUDE`).
4. Run `bash scripts/build-spice-wasm.sh`.

Outputs are written to `public/vendor/spice/spice.js` and `public/vendor/spice/spice.wasm`.

The application then uses these files locally. JPL Horizons is a verification/update fallback; common educational rendering can use the bundled approximate ephemeris without network access.
