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


## General-topic reliability and illustration quality (October 2026)

The intent agent extracts a search topic before research. Every editorial and audit call receives the original prompt, the same brief and the same research pack (topic, context, retrieved citations and search provider). Research tries Gemini Google Search, Groq Browser Search, OpenRouter Web Search and Wikipedia. A search answer without transport-provided citations is not treated as web evidence. Search failure does not replace the requested topic with an unrelated local example. OpenRouter search is bounded to one Exa tool call and four results; provider billing still applies.

Groq text defaults to `openai/gpt-oss-120b`; the retired Llama defaults are migrated automatically. `GROQ_SEARCH_MODEL` defaults to `openai/gpt-oss-20b`. `OPENROUTER_SEARCH_MODEL` optionally overrides its text model for research. JSON schemas constrain Gemini responses. The fallback loop tries other configured providers before retrying transient errors on the first provider. Stages share a 170-second deadline inside a 180-second function budget. Errors distinguish timeout, quota, credits, authentication, model configuration, empty/blocked/truncated responses and malformed JSON. Safe stage logs and a public request ID make failures traceable without exposing keys, prompts or raw provider bodies.

The 2D planetary raster surfaces project a sphere with directional lighting and use the same procedural material sampler as the 3D engine. Earth continents are illustrative noise, not geographic data. Planet PNGs are embedded into the SVG before preview/export; no external images can taint Canvas. Trees use curved foliage, layered gradients and branch silhouettes. Water cycle, ecosystem and photosynthesis heroes share these assets. The water scene includes a groundwater cutaway; arrows describe transport, not measured quantities. Poster text sections can use open columns instead of putting every paragraph in a card.

For other subjects, the editor can select an image from relevant Wikipedia articles. Commons metadata must explicitly identify CC0 or public domain, and the chosen image must pass the content critic. Only fixed Wikimedia image hosts and bounded PNG/JPEG/WebP bytes are accepted, with credits preserved in exports. No model-authored image URL is fetched. A missing asset does not create an unrelated illustration. `GEMINI_IMAGE_MODEL` remains optional for custom raster artwork with the existing Gemini key; it does not control text or web search. Precise text, equations, labels and arrows always remain in the deterministic SVG compositor.

PNG/JPG export now renders at up to twice the composition dimensions, with a 32-megapixel memory limit. SVG retains scalable typography and diagrams. Decorative cloud motion applies only to the browser preview and respects reduced-motion preferences; downloaded images are static.

### Provider quotas and current defaults (October 2026)

The server uses Gemini `gemini-3.8-flash` for editorial content and
`gemini-3.5-flash-lite` for intent, research and independent validation.
`GEMINI_TEXT_MODEL_PRIMARY` remains an explicit override. The 2.5 series is
restricted to existing users according to Google's model catalog.
Groq uses `openai/gpt-oss-120b` for editorial content and
`openai/gpt-oss-20b` for intent and validation, with a conservative input/output
budget under the documented free OSS tier's 8K tokens/minute ceiling.
This budget is an estimate, not an account quota guarantee.

OpenRouter defaults to `openrouter/free`, recording the actual returned model.
An explicit `OPENROUTER_TEXT_MODEL` is respected; after a credit failure the
free router is tried without repeating the paid model during that request.
Free routing has its own rate and availability limits. No paid web tool is
called by default: OpenRouter/Exa web research requires the explicit
`OPENROUTER_SEARCH_MODEL` opt-in. Wikipedia is used after Gemini grounding
fails, before consuming further inference quota. All research providers must
supply transport-provided citations before their answer is treated as evidence.

Quota, credit and invalid-configuration failures are remembered per model
within one request. The API reports every attempted provider/model/stage code,
plus bounded numeric `Retry-After` metadata when available, without logging
keys, prompts or raw provider responses. Local intent parsing may continue
through a quota failure; independently validated editorial content is still
required. An unavailable critic never causes an unreviewed document to be
returned as approved.

No additional key is mandatory when Gemini, Groq and OpenRouter keys are
already present in the production environment. Quota/balance and valid keys
remain requirements of their respective accounts. Reference documentation:
https://ai.google.dev/gemini-api/docs/models
https://console.groq.com/docs/rate-limits
https://openrouter.ai/docs/guides/routing/routers/free-router
