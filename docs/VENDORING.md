# Local runtime vendoring

Production runtime should not depend on CDNs.

Use:
- `PYODIDE_SOURCE=/path/to/pyodide npm run vendor:runtime`
- `OPENCV_SOURCE=/path/to/opencv-runtime npm run vendor:runtime`
- `SPICE_SOURCE=/path/to/spice-wasm-runtime npm run vendor:runtime`

The resulting runtime is served from `/vendor/*`.

For strict autonomous deployments set `REQUIRE_ALL_LOCAL_RUNTIME=1` during the verification step. Binary runtimes must keep their upstream license and provenance metadata alongside the vendored files.
