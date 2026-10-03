# Autonomous/local runtime plan

The renderer prefers local execution. External services are optional data/update sources.

## Browser-local
- Three WebGPU / WebGL2
- TSL node materials
- local OpenCV.js/WASM
- local Pyodide distribution
- NumPy/SciPy/SymPy/Astropy
- deterministic Monte Carlo
- WebGPU particle compute
- volume ray marching
- SPICE WASM + locally cached kernels

Expected vendor paths:
- /vendor/pyodide/
- /vendor/opencv/opencv.js
- /vendor/spice/spice.js

These binaries are intentionally not committed yet; they must be vendored with license/provenance records before production.

## Always-on worker
Blender/Cycles and heavy scientific solvers should run in a persistent worker when browser limits are exceeded. The worker may live on owned hardware or an always-on VM. It does not have to be a third-party render API.

## ScientificBrain
Physics solver outputs keep provenance and are imported as scalar/vector fields or particles. Colab remains a laboratory option, not a production dependency.
