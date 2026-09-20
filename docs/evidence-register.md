# Claim and evidence register

The claims listed here are the ones the project makes about **correctness of
behaviour, accessibility and build integrity**, with the evidence that holds
each one today. It is not a list of everything the documentation says: a
claim about a component's props or its visual design is held by the component
docs and the generated manifests, not by this file. What belongs here is a
claim someone could reasonably doubt, where the answer is "because this test
runs".

Every path and every test count below is checked by
`scripts/check-evidence-register.mjs`, which runs in `pnpm gate` as part of
its `scripts-tests` step. A row that
cites a file that does not exist, or a count that no longer matches, fails
the gate. That check cannot tell whether a test asserts what the row says it
asserts; a reviewer still has to read it.

The manual accessibility session (A1) is a scheduled session with a screen
reader, touch assistive technology, browser zoom and a real high-contrast
mode, run by a person. It has not happened. Rows that need it say so, and no
row claims its result in advance.

Evidence kinds: `unit` (vitest), `browser` (Playwright; the engines are
named, and `.github/workflows/e2e.yml` runs all three on every pull request),
`gate` (an executable check in `pnpm gate`, which `.github/workflows/ci.yml`
runs and nothing else), `none yet`.

## Build integrity

| Claim | Where it is made | Evidence | Status |
| --- | --- | --- | --- |
| Adapter tests run against the current core build, never a stale dist | CONTRIBUTING "Running the checks locally" | gate: `scripts/vitest-core-guard.mjs` is the Vitest `globalSetup` of all four adapters and calls `assertCoreDist` from `scripts/check-core-dist.mjs`; 12 tests in `scripts/check-core-dist.test.mjs` | held |
| Browser tests run against this checkout's build, never another worktree's | CONTRIBUTING, docs/visual-testing.md | gate: `e2e/global-setup.ts` refuses a foreign or stale server using `scripts/build-id.mjs`; 14 tests in `scripts/build-id.test.mjs`. No browser test exercises the refusal: it runs before the browser starts | held for the unit behaviour |
| `pnpm gate` is the whole non-browser gate and CI runs nothing else | CONTRIBUTING, `.github/workflows/ci.yml` | gate: 5 tests in `scripts/gate.test.mjs` hold the workflow to one job whose only steps are install and `pnpm gate`, and compare its whole `jobs:` block against the expected one | held |

## Component behaviour

| Claim | Where it is made | Evidence | Status |
| --- | --- | --- | --- |
| Range Slider: thumbs never cross, `minDistance` rounds up to the grid, the pair is always valid | docs/components/forms/range-slider | unit: 29 tests in `core/src/range-slider/range-slider.test.ts`, 26 in `packages/svelte/src/lib/range-slider/styled-range-slider.test.ts`, 26 in `packages/vue/src/range-slider/RangeSlider.test.ts` | held |
| Range Slider: pointer routing follows the logical axis (LTR, RTL, vertical) | same | browser: `e2e/range-slider.spec.ts` on Chromium, Firefox and WebKit | held |
| Range Slider: constraints change after mount without a remount, silently | same | unit: the rerender tests in the two adapter files above | held |
| Combobox: the clear button activates by pointer, Enter, Space and a direct click | docs/components/forms/combobox | unit in core and all four adapters; browser: `e2e/interactions.spec.ts` on Chromium, Firefox and WebKit | held |

## Accessibility

Nothing in this section claims what a screen reader announces, how a control
behaves under touch assistive technology, what browser zoom does, or how a
real high-contrast mode renders. Those are the A1 session's to answer.

| Claim | Where it is made | Evidence | Status |
| --- | --- | --- | --- |
| Components carry the roles, names and ARIA attributes the WAI-ARIA Authoring Practices pattern named in their docs calls for | every component page | unit: role and attribute tests per component; browser: `e2e/a11y-catalog.spec.ts` runs axe (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa) over the catalog on Chromium | attributes and axe rules held. Axe does not test pattern conformance: the keyboard model and focus movement are held by the per-component tests, and what is announced is none yet (A1) |
| Range Slider: the dependent bound is exposed through `aria-valuemin` and `aria-valuemax` | same (the docs state that ARIA in HTML discourages this) | unit: attribute assertions in the three files above | the attributes are present; what assistive technology announces: none yet (A1) |
| Range Slider: stacked thumbs are operable by touch assistive technology | same (the docs state this is unverified) | none yet (A1) | not claimed |
| The Svelte token palette meets WCAG AA contrast for the pairs it defines | CONTRIBUTING pillars, tokens docs | unit: contrast computed over the Svelte tokens in `packages/svelte/src/lib/styles/tokens.test.ts` | held for the Svelte tokens and the pairs that file lists. The Vue, React and Elements palettes have no equivalent computation, and no axe run enables the `color-contrast` rule |
| Pointer targets are at least 24 by 24 CSS pixels | component docs | browser: `e2e/target-size.spec.ts` on Chromium, Firefox and WebKit | held for the library's own targets on the catalog pages. The docs theme's own controls are skipped, and an element with no size is skipped, so anything inside a closed menu or dialog is not measured |
| Layouts survive 320 CSS pixels wide without horizontal scroll | component docs | browser: `e2e/reflow.spec.ts` at 320 and 1024 CSS pixels on Chromium, Firefox and WebKit | held for the catalog demos. This is a viewport width, not browser zoom: 400% zoom is none yet (A1) |
| In forced-colors mode every control is still painted and none disappears | component docs | browser: `e2e/forced-colors.spec.ts`, emulated, Chromium only | held for presence only. That spec states that whether each state stays distinguishable is not checked, and several states are carried by a tint alone. A real high-contrast session is none yet (A1) |

## How to add a row

A pull request that adds or changes a claim of this kind adds or changes the
row in the same pull request, with the evidence it created. A claim whose
only evidence would be the manual session is written in the docs as not yet
verified, and its row says `none yet (A1)`.

A claim arrives with the change that holds it. A row must not cite a test
that is still on an unmerged branch: the check above fails on a path that
does not exist, which is the point. If a row has to name work in flight
while that work is open, it says "held once #N lands" and says in the same
cell that the claim is not made before then; when that pull request merges,
the row loses the qualifier in the same change.
