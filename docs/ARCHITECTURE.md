# Visual Scientific Renderer architecture

The renderer is non-generative: pixels come from geometry, procedural mathematics, physical simulation, scientific data and conventional rendering.

## Pipeline

Visual request -> domain resolver -> scene/field data -> procedural materials + geometry -> WebGPU/Three renderer -> particles/compute -> postFX -> raster or interactive output.

## Execution tiers

- Draft: vectors / lightweight geometry.
- Realtime: Three WebGPU, TSL-capable materials, particles and browser compute.
- Pro: Blender headless job rendered with Cycles/Eevee.

## Scientific compute

Pyodide runs in a Web Worker. Monte Carlo preserves deterministic seeds. JPL Horizons and SPICE are data/ephemeris adapters, not image generators.

## Physics Skills integration

The existing `scientificbrain-physics-skills` repository is useful directly. Its data contract requires tensors plus provenance (units, run identity, solver revision, geometry, dimensionality and time), and its Monte Carlo/UQ guidance separates MCC, DSMC, uncertainty propagation and Geant4 transport. The renderer follows those boundaries through `src/physics/field-adapter.ts`.

FLASH, WarpX, PIConGPU, EDIPIC-2D and other validated solver outputs can therefore become density volumes, E/B vector fields or particles without coupling the renderer to one solver.

## Google Colab / plasma

Colab can remain an external execution worker. A notebook exports arrays plus a provenance manifest; the renderer imports those arrays. Heavy plasma computation stays outside the browser while visualization remains local-first.
