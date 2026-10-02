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
