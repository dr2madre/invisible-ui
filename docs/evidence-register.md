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
| The declarations the published packages ship type-check for a consumer | `CONTRIBUTING.md`, "Running the checks locally" | gate: `scripts/check-packed-consumers.mjs` compiles a throwaway consumer against the packed tarballs; 7 tests in `scripts/consumer-declarations.test.mjs` hold the verdict to the diagnostics in `@invisible-ui/*` and in the consumer file | held for what this repository publishes. A dependency's own broken declarations do not fail the check, by design: no consumer compiles them with `skipLibCheck` off |
| The committed Dart tokens match `packages/tokens/tokens.json` | `docs/tokens.md`, `packages/flutter/README.md` | gate: `scripts/check-flutter-tokens.mjs` renders the Dart platform of the token build in memory and fails when `packages/flutter/lib/src/tokens/tokens.g.dart` differs; it runs in `pnpm tokens:check` | held |

## Component behaviour

| Claim | Where it is made | Evidence | Status |
| --- | --- | --- | --- |
| Range Slider: thumbs never cross, `minDistance` rounds up to the grid, the pair is always valid | `packages/docs/src/content/docs/components/forms/range-slider.mdx` | unit: 29 tests in `core/src/range-slider/range-slider.test.ts`, 26 in `packages/svelte/src/lib/range-slider/styled-range-slider.test.ts`, 26 in `packages/vue/src/range-slider/RangeSlider.test.ts` | held |
| Range Slider: pointer routing follows the logical axis (LTR, RTL, vertical) | same | browser: `e2e/range-slider.spec.ts` on Chromium, Firefox and WebKit | held |
| Range Slider: constraints change after mount without a remount, silently | same | unit: the rerender tests in the two adapter files above | held |
| Combobox: the clear button activates by pointer, Enter, Space and a direct click | `packages/docs/src/content/docs/components/forms/combobox.mdx` | unit: `core/src/combobox/combobox.test.ts`, `packages/svelte/src/lib/combobox/styled-combobox.test.ts`, `packages/vue/src/combobox/Combobox.test.ts`, `packages/react/src/combobox/Combobox.test.tsx` and `packages/elements/src/combobox/ds-combobox.test.ts`; browser: `e2e/interactions.spec.ts` on Chromium, Firefox and WebKit | held |
| Svelte state factories commit their state before reporting a public callback, so handlers read the reported state and their own writes persist | `docs/adr/0011-state-and-callback-conventions.md` | unit: the matrix in `packages/svelte/src/lib/adr-0011-commit-order.test.ts`; its completeness test scans the factory sources and refuses an uncovered callback unless the row records a reasoned exemption | held |
| Toggle Group: three or more toggles make one tab stop with arrow keys, Home and End (mirrored in right-to-left text); one or two keep a tab stop each; inside a toolbar the toolbar's keys apply; moving focus never changes a toggle | `packages/docs/src/content/docs/components/forms/toggle-group.mdx` | unit: the rule in `core/src/toggle-group/toggle-group.test.ts`, and each adapter in `packages/svelte/src/lib/toggle-group/styled-toggle-group.test.ts`, `packages/vue/src/toggle-group/ToggleGroup.test.ts`, `packages/react/src/toggle-group/ToggleGroup.test.tsx` and `packages/elements/src/toggle-group/ds-toggle-group.test.ts`; browser: `e2e/elements-controls.spec.ts` for Elements on Chromium, Firefox and WebKit | held in jsdom for the four adapters; in a browser for Elements only |
| Without `weekStartsOn`, web calendars start the week on the CLDR first day of the calendar's locale (its own, else the i18n provider's, else the page's `lang`, else Monday), the same on the server and the client | `packages/docs/src/content/docs/components/forms/calendar.mdx` | unit: the table and its vectors, shared with Flutter, in `core/src/calendar/week-start.test.ts`; the adapters in `packages/svelte/src/lib/calendar/calendar-week-start.test.ts`, `packages/svelte/src/lib/calendar/calendar-week-start-ssr.test.ts`, `packages/vue/src/calendar/Calendar.week-start.test.ts`, `packages/react/src/calendar/Calendar.test.tsx` and `packages/elements/src/calendar/ds-calendar.test.ts` | held for the locales those tests name; server output is compared with the client in Svelte, Vue and React. Elements has no server render |
| Without a locale from the app, components use the page's `lang`, then the international default (Monday first, 24-hour time, ISO numeric dates); server rendering and hydration agree | `packages/docs/src/content/docs/components/localization/locale-provider.mdx` | unit: the vectors, shared with Flutter, in `core/src/i18n/vectors.test.ts` and `packages/flutter/test/default_locale_test.dart`; `core/src/i18n/i18n.test.ts`, `core/src/i18n/page-locale.dom.test.ts`; the adapters in `packages/svelte/src/lib/i18n/default-locale.test.ts`, `packages/vue/src/i18n/default-locale.test.ts`, `packages/react/src/i18n/default-locale.test.tsx` and `packages/elements/src/locale-provider/default-locale.test.ts` | held in jsdom and Node for the locales those tests name; hydration is checked in Svelte (real server process), Vue and React. Elements has no server render. Browsers: not tested |

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
| Under a coarse pointer, menu items, menubar triggers and navigation bar destinations keep 44 by 44 from `--ds-metrics-density-touch-min-target-size` | `docs/tokens.md`, the Dropdown Menu, Context Menu, Menubar and Navigation Bar pages | unit: `packages/react/src/styles/touch-target.test.ts` reads every coarse-pointer block of the shared sheets (Vue and Elements are byte-identical); `packages/svelte/src/lib/styles/touch-target.test.ts` reads the Svelte menus and navigation bar; browser: `e2e/navigation-bar.spec.ts` emulates a coarse pointer on Chromium and measures the navigation bar destinations | held for the stylesheet rules, and measured in a browser for the navigation bar only, on Chromium only. No browser test measures the menu items under a coarse pointer |
| Layouts survive 320 CSS pixels wide without horizontal scroll | component docs | browser: `e2e/reflow.spec.ts` at 320 and 1024 CSS pixels on Chromium, Firefox and WebKit | held for the catalog demos. This is a viewport width, not browser zoom: 400% zoom is none yet (A1) |
| Core and Flutter answer the same input cases: Arabic-Indic and Persian digits in number, PIN and time input, the de-CH apostrophes, PIN arrows by reading direction, time paste, and the upload accept filter | component docs: number field, PIN input, time field, upload drop area | unit: `core/src/number-field/__vectors__/number-field.json`, `core/src/pin-input/__vectors__/pin-input.json`, `core/src/time-field/__vectors__/time-field.json` and `core/src/upload-drop-area/__vectors__/upload-drop-area.json`, read by the core vectors test beside each and by `packages/flutter/test/number_format_test.dart`, `packages/flutter/test/value_vectors_test.dart`, `packages/flutter/test/time_field_vectors_test.dart` and `packages/flutter/test/upload_vectors_test.dart` | held for the shared logic. Each web adapter wires the core rules and has its own tests; assistive technology: not tested |
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
