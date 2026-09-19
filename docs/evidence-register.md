# Claim and evidence register

Every claim the documentation makes about behaviour, accessibility or
compatibility is listed here with the evidence that holds it today. A claim
with no row, or a row whose evidence is "none yet", is not made in the docs.
The manual accessibility session (A1) fills the rows that only a person with
assistive technology can fill; until then those rows say so.

Evidence kinds: `unit` (vitest, per adapter), `browser` (Playwright, the
engines named), `visual` (container baseline), `gate` (an executable check
in `pnpm gate`), `manual` (the session, date and setup named), `none yet`.

| Claim | Where it is made | Evidence | Status |
| --- | --- | --- | --- |
| Adapter tests run against the current core build, never a stale dist | CONTRIBUTING "Running the checks locally" | gate: `scripts/check-core-dist.mjs` in every adapter's Vitest `globalSetup`; 12 unit tests; refusal reproduced through Vitest | held |
| Every package's dist carries a record of the sources it was built from, and the served sites' stamp reads it | CONTRIBUTING | gate: `scripts/write-build-info.mjs` in every build (#331); 26 script tests | held once #331 lands |
| Browser tests run against this checkout's build, never another worktree's | CONTRIBUTING, docs/visual-testing.md | gate: `e2e/global-setup.ts` with `scripts/build-id.mjs`; 14 unit tests; 8 browser proofs (Chromium) | held |
| `pnpm gate` is the whole non-browser gate and CI runs nothing else | CONTRIBUTING, `.github/workflows/ci.yml` | gate: `scripts/gate.test.mjs` holds the workflow to one job and its steps; 15 bypass probes fail it | held |
| The test layer type-checks in every package and in `e2e/` | CONTRIBUTING | gate: `typecheck` (Vue, React, Elements), `check` (Svelte), `typecheck:e2e` (#330) | held once #330 lands |
| Range Slider: thumbs never cross, `minDistance` rounds up to the grid, pair always valid | docs/components/forms/range-slider | unit: core property sweep + 29 tests; Svelte 28, Vue 26 | held |
| Range Slider: pointer routing follows the logical axis (LTR, RTL, vertical) | same | browser: `e2e/range-slider.spec.ts` on Chromium, Firefox, WebKit | held |
| Range Slider: constraints change after mount without a remount, silently | same | unit: rerender tests per prop in both adapters; 11 configuration mutations killed | held |
| Range Slider: the dependent bound reaches assistive technology through `aria-valuemin`/`aria-valuemax` | same (stated as discouraged by ARIA in HTML) | browser: attribute presence; Chromium accessibility tree in the spike record | attribute present; what AT announces: none yet (A1) |
| Range Slider: stacked thumbs are operable by touch assistive technology | same (stated as unverified) | none yet (A1) | not claimed |
| Combobox: the clear button activates by pointer, Enter, Space and a direct click | docs/components/forms/combobox | unit in core and four adapters; browser: `e2e/interactions.spec.ts` on three engines | held |
| Components follow the WAI-ARIA Authoring Practices patterns named in their docs | every component page | unit: role and attribute tests; browser: axe catalog pass; screen-reader behaviour: none yet (A1) | attributes held; announcement none yet |
| Styled output meets WCAG AA contrast | CONTRIBUTING pillars, tokens docs | unit: `packages/svelte/src/lib/styles/tokens.test.ts` contrast computations; browser: axe `color-contrast` where enabled | held for the computed pairs |
| Pointer targets are at least 24 by 24 CSS pixels | component docs | browser: `e2e/target-size.spec.ts` on three engines | held |
| Layouts survive 320 CSS pixels and 400% zoom without horizontal scroll | component docs | browser: `e2e/reflow.spec.ts` | held for the catalog demos |
| Forced-colors mode keeps every control visible | component docs | browser: `e2e/forced-colors.spec.ts` (emulated); real high-contrast session: none yet (A1) | emulated held |

## How to add a row

A pull request that adds or changes a claim in the docs adds or changes the
row in the same pull request, with the evidence it created. A claim whose
only evidence would be a manual session is written in the docs as not yet
verified, and its row says `none yet (A1)`.
