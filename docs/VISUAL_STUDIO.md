# Unified Visual Studio

Implemented in `feat/scientific-renderer-v1` / PR #1. The 2D workspace now separates **AI research/editorial planning** from the **deterministic visual engine**. 3D remains lazy-loaded and independent.

## AI editorial workflow

1. The user writes the full educational request: topic, audience, material type, sections, exercises, visual style and constraints.
2. `POST /api/content-plan` optionally researches the topic. When `GEMINI_API_KEY` is configured it uses Gemini with Google Search grounding; if search fails it falls back to fixed Wikipedia retrieval.
3. The planner produces structured JSON only. Provider routing supports Gemini, Groq and OpenRouter, with an automatic fallback chain.
4. The user edits every title, paragraph, formula, block type, source, preset, palette, background, density and column count.
5. A single section can be rewritten by AI without regenerating the whole document.
6. Approval freezes the current content/design signature. Any edit invalidates approval.
7. The SVG/Canvas/Python/3D engines render the approved snapshot. No image-generation model is called.

Server-only environment variables:

- `GEMINI_API_KEY`
- `GEMINI_TEXT_MODEL_PRIMARY` (optional)
- `GROQ_API_KEY`
- `GROQ_TEXT_MODEL` (optional)
- `OPENROUTER_API_KEY`
- `OPENROUTER_TEXT_MODEL` (optional)
- `PUBLIC_APP_URL` (optional OpenRouter referer)

The browser never receives provider keys.

## VisualDocument v2

The document adds semantic material metadata and a design system while preserving the original section model:

- `documentType`, `audience`, `subject`
- block kinds: text, key idea, formula, steps, exercise, warning, comparison
- editable `DesignSpec`: preset, palette, background, density, columns and corner style
- AI metadata (provider/model/search path)
- source URLs retained separately from rendered content

The engine decides concrete coordinates. The AI does **not** output absolute x/y positions, preventing layout breakage when text changes.

Built-in design presets:

- educational-clean
- mathematics-pastel
- science-classroom
- technical-blueprint
- institutional
- kids-illustrated
- minimal-editorial

## Deterministic composition

The composer reads the design palette, background pattern, density and column count. It supports solid/gradient/grid/dots/paper backgrounds and semantic card accents while retaining MathJax SVG formulas, diagrams, imported photos, Python plots and 3D captures.

Long documents continue to grow rather than crop. PDF uses browser print; SVG is the preferred lossless export.

## Research-only endpoint

`POST /api/research` remains available as a lightweight Wikipedia/source workflow. The richer `/api/content-plan` endpoint is the main path for AI-assisted material creation.

## Python and geometry

Python still runs through the isolated local Pyodide worker with a 60-second limit. 3D prompts combine supported primitives and safe analytic surfaces, with GLB import for external geometry.

## Validation

Run `npm run check` after changes: TypeScript, Node tests and production build. Native 3D GPU verification remains separate from geometry/unit validation.

## Reference-driven 2D layout

The inspected Cramer, sine/cosine, circle-angle and technical-plan references informed the title hierarchy, pastel bands, numbered panels, equation boxes, local vector icons and adjacent worked examples. Reference images are inspiration, not included as generated artwork.

`layout.ts` measures every heading, paragraph, MathJax viewBox, diagram and table row before packing cards. `typography.ts` shares conservative Arial advances with the renderer. No paragraph or equation is discarded to fit a fixed canvas; long content increases its height.

Material rules differ: infographics pack variable cards/spans; posters feature a full-width opening; worksheets and guides preserve row reading order; brochures pack sequential content into three panels; activities use a single reading column; technical plans emphasize the drawing area. Semantic overview/worked-example regions produce parallel explanation/example lanes. Portrait always uses one column. User-selected card spans and footer regions allow wider panels without absolute AI coordinates.

Sections accept `equations` (up to 8), `diagram`, local raster `image` and `caption`, `table: {headers, rows}`, `region`, `span`, `icon` and `tone`. Projects support up to 24 sections. UI controls edit/reorder these blocks and invalidate both approval and stale exports after any change, including photos, formats and Python data.

Local Cramer handles explicit coefficient systems in x/y or x/y/z. Example: `Cramer 2x+y=5; x-y=1`. It computes each determinant, column replacement, solution and substitution independently of IA/API keys; incomplete systems are rejected and a singular system never divides by zero. Without explicit equations it uses a labeled example. 3×3 cofactor expansion is displayed on separate LaTeX rows for readability. Decimal approximations are labeled, and verification uses determinant ratios. This is a bounded linear-system grammar, not a general symbolic algebra interpreter.

Generated SVG and editable JSON examples live in `public/examples/`. Circle diagrams calculate their chords/secant intersection points locally. Other topics can be structured by the editorial IA and edited manually; new domain-specific drawing families still require explicit renderer implementations. Photographs come from imported assets, not synthesized image-model output.

## Single-deploy completion

`vercel.json` disables Git-triggered deployment of the existing PR work branch while keeping main enabled. After local checks and GitHub CI, merging PR #1 triggers the single production deployment. This avoids a preview build plus a second production build for this completion.

Validation includes API typechecking, offline Cramer endpoint tests, coefficient/singular-system cases, matrices/multiline MathJax, malformed rich assets and tables, and packing across all presets/formats/material types. Local DOM integration covers prompt → approve → render, edit invalidation, portrait recomposition and circle gallery. GPU rendering requires a capable browser/device.
