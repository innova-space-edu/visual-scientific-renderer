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

## Prompt-only Visual Studio

The web app now turns one natural-language request into a finished image: intent → research → selected design/physics skills → structured editorial content → independent adherence check → SVG/Canvas output. Templates, audience and orientation are inferred. Users download PNG, JPG, SVG or PDF without editing or approving intermediate content.

Cramer is calculated locally. The standard Solar System overview uses attributed NASA facts and vector illustrations. Other topics require a server text provider; optional Gemini image artwork complements exact SVG text. Scientific simulation and 3D modules remain library capabilities.

Read [the automatic workflow and Vercel configuration](docs/VISUAL_STUDIO.md), [upstream skill provenance](docs/SKILLS.md), and [scientific rendering limits](docs/RENDER_QUALITY.md).

Dependencies are locked. Use `npm ci` and `npm run check` before publishing. Working-branch deployments are disabled in `vercel.json`; merging the validated PR triggers the single final production deploy.
