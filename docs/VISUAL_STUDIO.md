# Unified Visual Studio

This update remains on `feat/scientific-renderer-v1` / PR #1. The 2D workspace now separates **AI research/editorial planning** from the **deterministic visual engine**. 3D remains lazy-loaded and independent.

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
