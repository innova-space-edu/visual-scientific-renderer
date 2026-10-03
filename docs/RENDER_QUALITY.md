# Deterministic image quality workflow

This update stays in PR #1 (`feat/scientific-renderer-v1`). No image-generation API, model key, image inference or AI denoiser is used by the browser workflow.

## Usable image pipeline

- Interactive preview: existing Three WebGPURenderer, including its WebGL2 fallback, procedural textures, ACES and an actual BloomNode pass. Bloom values update the existing pass.
- Final image: pinned `three-gpu-pathtracer` 0.0.24 with `three-mesh-bvh` 0.9.10. This separate WebGL2 renderer performs progressive Monte Carlo path tracing, multiple importance sampling, physical metal/roughness materials, transmission, refractive indices, direct lights and geometry shadows. BVH generation runs in a locally served worker. It does not require RTX hardware.
- A scene adapter preserves textures, geometry groups, transforms and material arrays. Node materials become conventional MeshPhysicalMaterial objects on a clone. The interactive scene remains unchanged.
- Select HD, Full HD, square or 4K output and 32–256 samples per pixel. More samples reduce stochastic noise; 4K is costly on small GPUs. Cancel at any time, adjust the camera or download a partial render after the first complete sample.
- Optional display/export smoothing uses the library's conventional bilateral GLSL denoiser (BSD-2-Clause shader), not a learned model. It may soften fine detail and can be disabled; accumulation data remains untouched.
- Export: PNG at the renderer's actual dimensions, copied from the drawing buffer before it can be cleared. The realtime export also renders at the selected output size and restores the viewport afterward.
- Import: self-contained GLB files up to 50 MiB, parsed locally. External resource URLs are rejected, and no model upload occurs. Compressed formats requiring external decoder binaries are not bundled in this version.

## Realism and scientific meaning

The materials laboratory contains a rough floor, metal, refractive glass, coated ceramic and studio lighting. It is the quality reference for optical effects.

The astronomy scenes are procedural educational representations. They are not photogrammetric surface reconstructions. Solar-system radii and distances are visibly scaled for readability; ephemeris mode uses local JPL approximations rather than SPICE precision. Plasma and cell scenes are illustrative rather than validated physical/biological simulations.

Points, lines, sprites, solar glow/prominence effects and atmosphere shells are explicitly omitted by the final mesh path tracer and disclosed in the interface. The realtime preview retains them. Participating-media scattering and physical plasma rendering remain future work. Atmospheric meshes are not silently treated as opaque planets.

The existing CPU tracer is a diffuse reference implementation; its material type alone does not provide the complete GPU physical shading model. HDR/EXR APIs remain available for numerical still-image pipelines.

## Correctness fixes

- Per-frame timing no longer uses the one-second FPS clock.
- Scene changes release owned geometry, shared textures, materials and bloom targets.
- Texture noise samples sphere coordinates and uses clamped latitude wrapping to reduce UV seams.
- The thin lens uses the camera's forward axis for focus and converts millimetres into metre-scale lens offsets.
- Monte Carlo summaries use incremental mean/variance/extrema and one quantile sort. Large arrays do not become function argument lists.
- The shared WGSL particle kernel includes gravity and the same radial acceleration and damping contract as CPU stepping. Zero-radius particles do not normalize a zero vector.
- Solver fields use explicit components or exact legacy vector names, with shape/value and finite-value validation. `electron_density`, `energy` and `B_magnitude` stay scalar.
- Blender jobs encode input data as UTF-8 hex, validate supported scenes and render distinct solar, Saturn/ring and solar-system geometry. Unsupported scenes fail explicitly. Python syntax and data-decoding tests run without Blender; actual Cycles execution requires the separate self-hosted worker and is not provided by Vercel's static preview.

## Cost boundary

Vercel serves static code and runtime assets. Image rendering consumes the user's local GPU/CPU, not image-provider credits. The Blender worker is optional, independently hosted and has its own compute cost. Do not connect it to a serverless function that attempts to launch Blender.
