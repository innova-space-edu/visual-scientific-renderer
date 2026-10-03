# Upstream skill snapshots

`api/_lib/skills.ts` packages unmodified SKILL.md text from Innova Space's repositories, retrieved on 2026-10-03, and selects relevant instructions at runtime. There is no network dependency to load skills during a user generation.

- `innova-space-edu/visual-design-skills`, source tree `15a8748f3c6ea4a621f7bdb1d769fb066f5ac0a6`: visual-design-router, educational-image, infographic, poster-design, worksheet-design, textbook-page, technical-drawing, math-diagram, physics-diagram, science-illustration and visual-quality-control. MIT; copyright 2026 Innova Space Education. License: `docs/licenses/visual-design-skills.txt`.
- `innova-space-edu/scientificbrain-physics-skills`, source tree `644b0e8b5877c1680d73c2e58062b749c1370f33`: physics-model-router and physics-validator. Apache-2.0; author Innova Space Edu SpA / ScientificBrain. License: `docs/licenses/scientificbrain-physics-skills.txt`.
- EDUAI reference reviewed: `innova-space-edu/eduai-platform` source tree `ab6ecd8cb1cbacc55a21194d91d4099573751de0`, `lib/ai-router-v5.ts` and `app/api/agents/imagenes/route.ts`. Provider integration is adapted locally; the authenticated EDUAI endpoint is not invoked without its session.

Routing uses the smallest relevant set, deterministic text/math, clear schematic disclosures, target audience, source provenance and an independent prompt-adherence gate. Solver-specific physics skills are not activated without simulation inputs or validated solver data.
