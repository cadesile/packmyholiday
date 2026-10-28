# Token Savings Estimate

> Estimated, not exact — a chars÷4 heuristic (roughly 1 token per 4
> characters), not a real tokenizer. Treat these numbers as directional:
> good for seeing the shape of the saving, not for precise budgeting.
> Updated by the acting agent every time any stage's `output/` is written
> (see `SKILL.md`'s "How to use this skill", step 5). Measure file sizes
> yourself with your own tools (e.g. `wc -c`) — no bundled script computes
> this for you, consistent with the rest of this skill.

| Load scope | Est. tokens |
|---|---|
| Everything (`.context/stages/*/output/*.md`, all stages) | 10234 |
| Router only (`.context/CONTEXT.md`) | 293 |
| `01_overview` (router + its `CONTEXT.md` + its `output/`) | — (no output written yet) |
| `02_architecture` (same shape) | 2242 |
| `03_data` (same shape) | 3790 |
| `04_interfaces` (same shape) | 2518 |
| `05_ui` (same shape) | 3069 |
| `06_documentation` (same shape) | 1222 |
| `07_synthesis` (same shape) | 2426 |

**Typical saving vs. loading everything:** 75% (average
across stages with existing output; leave a stage's row blank if it hasn't
run yet rather than estimating zero or guessing)

**Last updated:** 2026-10-28 (after stage 07_synthesis)
