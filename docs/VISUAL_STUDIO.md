# Prompt → finished image

The public page has one prompt field and a Create button. It produces the image automatically, with PNG, JPG, SVG and PDF/print delivery. There are no content editors, provider selectors, design controls or user approval steps. Existing scientific 3D/Python modules remain available as library capabilities; the public app does not expose their manual controls.

## Synchronized pipeline

`POST /api/content-plan {prompt}` owns the complete request:

1. An intent agent extracts topic, audience, required content, material type and orientation. Explicit prompt constraints override model suggestions.
2. A selector loads only the applicable pinned design/physics SKILL.md instructions from `api/_lib/skills.ts`.
3. Research uses Gemini Google Search when available; Wikipedia searches the extracted topic, not the whole design prompt. Sources are attached only from retrieval or the attributed built-in reference pack. External research is supplied as data, not agent instructions.
4. The editorial agent writes structured semantic blocks, LaTeX, tables and bounded diagrams. The system selects one of seven predefined palettes and templates for infographic, poster, worksheet, guide, brochure, activity or technical plan.
5. Schema checks reject placeholders and invalid assets. A separate critic checks the document against the original prompt and research. One correction attempt is allowed. Repeated rejection returns a clear error without showing an unrelated document.
6. The client automatically composes SVG, including calculated LaTeX, local planet illustrations and semantic flow/cycle diagrams. Canvas creates PNG/JPG. Optional Gemini artwork is an isolated image layer; it does not contain authoritative text.

Cramer 2×2/3×3 uses computed determinants, requested coefficients and substitution checks. A standard Solar System overview has an attributed NASA reference pack (Sun, eight planets, other bodies), so it can work without text API keys. More specialized Solar System requests and other topics require a text provider. There is no generic fallback that changes the requested topic or asks the user to fill in content.

The independent AI critic checks adherence and scientific claims; it is not a substitute for a numerical solver or a guarantee of scientific correctness. Complex physics simulations require the existing ScientificBrain worker/data contracts and validated results. They are not launched simply to illustrate an introductory concept.

## EDUAI complement

Provider handling follows the server-side Gemini/Groq/OpenRouter/Cerebras pattern in EDUAI `lib/ai-router-v5.ts`. Optional illustration uses the Gemini image capability also present in EDUAI's image agent. These are adapted capabilities, not calls impersonating an EDUAI user. EDUAI's `/api/agents/imagenes` requires its authenticated Supabase session; this standalone site does not bypass that access policy or share its cookies.

## Vercel variables

At least **one** text provider key is required for general requests. Recommended: `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) to enable text and Google Search grounding together. Fallback keys are optional: `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `CEREBRAS_API_KEY`.

Optional model overrides: `GEMINI_TEXT_MODEL_PRIMARY`, `GROQ_TEXT_MODEL`, `OPENROUTER_TEXT_MODEL`, `CEREBRAS_TEXT_MODEL`. Optional raster illustrations: configure `GEMINI_IMAGE_MODEL` to an image-capable model available to the same Gemini key. Without it, vector/semantic diagrams and exports still work. `PUBLIC_APP_URL` is an optional OpenRouter referer.

Set keys on the renderer's Vercel project, Production environment. None belongs in `VITE_*` or the browser. EDUAI project secrets do not transfer automatically to this project. `/api/capabilities` reports readiness booleans only, never secret values.

## Verification

`npm run check` covers types (including APIs), tests and production build. Regression cases cover the user's horizontal 1° Medio Solar System request, exact Cramer systems, extracted-topic searches, shared skill/research context, critic repair/rejection, malformed input, orientation, non-overlapping layout and unsafe assets.

Los afiches verticales combinan un héroe visual y tarjetas en dos columnas. El ciclo del agua dispone de una ilustración SVG propia cuando se solicita; las fuentes se exportan como títulos numerados con enlaces, sin imprimir las direcciones de grounding.
