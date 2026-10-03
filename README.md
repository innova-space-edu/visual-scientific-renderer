# Visual Scientific Renderer

Scientific, procedural and local-first rendering for Innova Space Visual Engine. The core does **not** use generative AI to create pixels.

## v0.1 scope

1. Three WebGPU + TSL-capable renderer with WebGL2 fallback.
2. Procedural seeded fBm materials.
3. Advanced solar-system scene with procedural planets, Saturn rings and solar corona.
4. Particle engine with deterministic CPU fallback and WGSL WebGPU compute kernel.
5. ACES tone mapping, exposure and procedural glow/postFX controls.
6. Pyodide in a Web Worker.
7. Seeded Monte Carlo engine with quantiles.
8. JPL Horizons client.
9. SPICE adapter/kernel registry.
10. Blender headless Pro job contract + Cycles script generator.

Also included: ScientificBrain plasma/field adapter for physics solver outputs.

```bash
npm install
npm run check
npm run dev
```

## Quality preview / final images

The review UI now includes a materials laboratory, orbit/pan/zoom controls, progressive GPU path tracing, local GLB import and actual-resolution PNG export up to 4K. Rendering uses geometry, conventional materials and mathematical sampling; no generative image service is involved.

Read [the quality workflow and scientific limits](docs/RENDER_QUALITY.md) before interpreting the educational scenes as physical datasets. Blender/Cycles is a separate optional worker, not a Vercel runtime dependency.

Dependencies are locked. Use `npm ci` and `npm run check`. Commit the complete validated change once to the existing PR, then create one final preview deployment.
