# Claim and evidence register

This register records selected **system-level claims about behaviour,
accessibility and build integrity** whose evidence lives outside the page that
makes the claim or spans more than one component. It is not an exhaustive list
of everything the project guarantees. Component props and visual design remain
specified by the component docs and generated manifests; their local tests are
not repeated here.

Every repository path written in backticks and every explicit test count below
is checked by `scripts/check-evidence-register.mjs`, which runs in `pnpm gate`
as part of its `scripts-tests` step. A row that cites a file that does not
exist, or a count that no longer matches, fails the gate. That check cannot
tell whether a test asserts what the row says it asserts; a reviewer still has
to read it.

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
| Adapter tests run against the current core build, never a stale dist | `CONTRIBUTING.md`, "Running the checks locally" | gate: `scripts/vitest-core-guard.mjs` is the Vitest `globalSetup` of all four adapters and calls `assertCoreDist` from `scripts/check-core-dist.mjs`; 12 tests in `scripts/check-core-dist.test.mjs` | held |
| Browser tests run against this checkout's build, never another worktree's | `CONTRIBUTING.md`, `docs/visual-testing.md` | gate: `e2e/global-setup.ts` refuses a foreign or stale server using `scripts/build-id.mjs`; 14 tests in `scripts/build-id.test.mjs`. No browser test exercises the refusal: it runs before the browser starts | held for the unit behaviour |
| `pnpm gate` is the whole non-browser gate and CI runs nothing else | `CONTRIBUTING.md`, `.github/workflows/ci.yml` | gate: 7 tests in `scripts/gate.test.mjs` hold the workflow to one job whose only steps are install and `pnpm gate`, and compare its whole `jobs:` block against the expected one | held |

## Component behaviour

| Claim | Where it is made | Evidence | Status |
| --- | --- | --- | --- |
| Range Slider: thumbs never cross, `minDistance` rounds up to the grid, the pair is always valid | `packages/docs/src/content/docs/components/forms/range-slider.mdx` | unit: 29 tests in `core/src/range-slider/range-slider.test.ts`, 26 in `packages/svelte/src/lib/range-slider/styled-range-slider.test.ts`, 26 in `packages/vue/src/range-slider/RangeSlider.test.ts` | held |
| Range Slider: pointer routing follows the logical axis (LTR, RTL, vertical) | same | browser: `e2e/range-slider.spec.ts` on Chromium, Firefox and WebKit | held |
| Range Slider: constraints change after mount without a remount, silently | same | unit: the rerender tests in the two adapter files above | held |
| Combobox: the clear button activates by pointer, Enter, Space and a direct click | `packages/docs/src/content/docs/components/forms/combobox.mdx` | unit: `core/src/combobox/combobox.test.ts`, `packages/svelte/src/lib/combobox/styled-combobox.test.ts`, `packages/vue/src/combobox/Combobox.test.ts`, `packages/react/src/combobox/Combobox.test.tsx` and `packages/elements/src/combobox/ds-combobox.test.ts`; browser: `e2e/interactions.spec.ts` on Chromium, Firefox and WebKit | held |
| Svelte state factories commit their state before reporting a public callback, so handlers read the reported state and their own writes persist | `docs/adr/0011-state-and-callback-conventions.md` | unit: the matrix in `packages/svelte/src/lib/adr-0011-commit-order.test.ts`; its completeness test scans the factory sources and refuses an uncovered callback unless the row records a reasoned exemption | held |

## Accessibility

Nothing in this section claims what a screen reader announces, how a control
behaves under touch assistive technology, what browser zoom does, or how a
real high-contrast mode renders. Those are the A1 session's to answer.

| Claim | Where it is made | Evidence | Status |
| --- | --- | --- | --- |
| Catalog demos pass the configured axe WCAG A and AA rules | every component page | browser: `e2e/a11y-catalog.spec.ts` runs axe (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa) over the catalog on Chromium | held for the configured automated rules. Axe does not test pattern conformance, keyboard behaviour, focus movement or what a screen reader announces; those remain with component tests and A1 |
| Range Slider: the dependent bound is exposed through `aria-valuemin` and `aria-valuemax` | same (the docs state that ARIA in HTML discourages this) | unit: attribute assertions in the three files above | the attributes are present; what assistive technology announces: none yet (A1) |
| Range Slider: stacked thumbs are operable by touch assistive technology | same (the docs state this is unverified) | none yet (A1) | not claimed |
| The Svelte token palette meets WCAG AA contrast for the pairs it defines | `CONTRIBUTING.md`, `docs/tokens.md` | unit: contrast computed over the Svelte tokens in `packages/svelte/src/lib/styles/tokens.test.ts` | held for the Svelte tokens and the pairs that file lists. The Vue, React and Elements palettes have no equivalent computation, and no axe run enables the `color-contrast` rule |
| Rendered library targets on catalog pages are at least 24 by 24 CSS pixels | component docs | browser: `e2e/target-size.spec.ts` on Chromium, Firefox and WebKit | held for the library's own rendered targets. The docs theme's controls are skipped, and an element with no size is skipped, so anything inside a closed menu or dialog is not measured |
| Layouts survive 320 CSS pixels wide without horizontal scroll | component docs | browser: `e2e/reflow.spec.ts` at 320 and 1024 CSS pixels on Chromium, Firefox and WebKit | held for the catalog demos. This is a viewport width, not browser zoom: 400% zoom is none yet (A1) |
| In emulated forced-colors mode, rendered catalog controls remain present | component docs | browser: `e2e/forced-colors.spec.ts`, emulated, Chromium only | held for presence only. That spec states that whether each state stays distinguishable is not checked, and several states are carried by a tint alone. A real high-contrast session is none yet (A1) |

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
