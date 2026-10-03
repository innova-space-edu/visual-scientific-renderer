# Unified Visual Studio

This update remains on `feat/scientific-renderer-v1` / PR #1. Two workspaces share the same page: 2D composition works without a GPU; 3D is loaded on demand.

## Content and composition

1. Write a topic and prepare a local draft, import a saved project, or research public encyclopedia excerpts.
2. Edit title, subtitle, up to 12 sections, formulas and source URLs. Approve the content explicitly.
3. Compose horizontal/vertical/square/three-column material. Change layout and photographs without a model call.
4. Export SVG, PNG/JPG at original or 2× resolution, JSON, or use the browser's Save as PDF print option.

Content edits invalidate approval. The last rendered output remains an immutable snapshot until a new composition succeeds. Text wraps and document height grows; PDF printing scales this document onto the selected paper size, so extensive documents are better exported as SVG or split manually. Formats describe layout; actual height grows to fit content.

MathJax is bundled locally and emits vector glyphs, not HTML foreignObject. The six example drafts are editable teaching examples, not an arbitrary-topic knowledge model. Unknown topics get editable empty content fields. Diagram families currently include solids, sine, homothety, a schematic music-room plan and water molecule. Imported PNG/JPEG/WebP files remain local. A conventional renderer cannot synthesize every photograph from an unrestricted description; photo composition and physical 3D renders require existing assets or specified geometry.

## Research

`POST /api/research` searches three Spanish Wikipedia extracts using a fixed endpoint. It returns actual source URLs and never asserts that a source was independently verified. The user reviews the returned excerpts before approving. No credentials are required for source retrieval.

An optional text-only OpenAI-compatible backend uses **server-side** `CONTENT_API_URL`, `CONTENT_API_KEY`, `CONTENT_MODEL`. Without them, original excerpts are returned. This implementation does not call image models. Source attribution and teacher review remain necessary; encyclopedia extraction is not a general web research engine. Local Vite does not run Vercel serverless routes; research needs the preview deployment.

## Python and geometry

Python runs through the existing local Pyodide worker, with cancellation and a 60-second limit. Return JSON `[{"x":0,"y":0},...]` (2–2000 finite points) and click Use Python data to incorporate a plot. This first integration uses the standard runtime; scientific packages require the project's existing vendoring workflow.

3D prompts combine sphere/box/cone/cylinder/torus, with radius/height, or choose an analytic wave/pendulum. Custom height fields use `z=sin(x)*cos(y)` with a bounded expression parser; no eval or JavaScript execution. Surfaces reject singularities and values outside ±50. Pendulum is the small-angle approximation; wave is analytic, not a numerical PDE solver. Import GLB for other geometry. The browser must support WebGPU or WebGL2 for 3D. Switching back to 2D stops the physical render and pauses interactive scene processing.

## Validation

`npm run check`: TypeScript, 42 tests and production build. Added tests cover safe mathematical parsing, surface normals/singularities, escaped SVG content, formulas, growing layouts, asset validation and combined geometry. SVG outputs inspected using ordinary rasterization. Native GPU verification is separate from geometry tests.
