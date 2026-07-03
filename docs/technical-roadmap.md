# Technical roadmap

The component build-out (Phases 1–6) and the live-demo docs are complete. This
roadmap tracks the **engineering / distribution maturity** of the design system
— the gaps that separate a *built* system from one a team can *publish, version
and maintain* — benchmarked against peers (Zag.js / Ark UI, Radix UI, React
Aria / Spectrum, shadcn/ui, MUI / Chakra).

## Already at benchmark level

- **Headless core** — framework-agnostic `state` / `connect` / prop-getter
  pattern (peer: Zag/Ark) + a Svelte adapter.
- **TypeScript** — `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`,
  `isolatedModules`, ES2022 / Bundler resolution.
- **Tokens** — two tiers (primitives → semantic role/state), dark mode
  (`prefers-color-scheme` + `[data-theme]`), WCAG AA, `color-mix` surfaces.
- **Accessibility tests** — `vitest-axe` on every component (144 test files).
- **RTL readiness** — CSS logical properties throughout.
- **Docs** — Astro + Starlight with a live demo per component; ADRs.
- **CI per-PR** — build + test + typecheck gate.

## Gaps — prioritized

Each item ships as its own PR. Checkboxes track progress.

### 🔴 P1 — distribution basics (a DS isn't consumable without these)

- [x] **1. Release & versioning** — Changesets + semver, `release.yml` workflow
  (version PR + `npm publish` with provenance), CHANGELOG per package,
  `publishConfig`, `repository` metadata, release scripts. **Parked/dormant:**
  both packages are `private: true` and the workflow is `workflow_dispatch`-only
  so nothing publishes by accident. To go live later, follow the checklist at
  the top of `.github/workflows/release.yml` (unset `private`, own the npm
  scope to the Invisible UI scope you own — e.g. `@invisible-ui/*` — add `NPM_TOKEN`,
  flip the trigger to `push`).
- [x] **2. Lint / format / hooks** — ESLint 9 flat config (js +
  typescript-eslint + eslint-plugin-svelte + prettier compat) + Prettier
  (repo-wide) + husky + lint-staged + commitlint (conventional commits); `lint`
  and `format:check` added to the CI gate.
- [x] **3. Tree-shaking guarantees** — `sideEffects` declared (`core: false`;
  `svelte: ["**/*.css","**/*.svelte"]`). Core now builds with preserved modules
  (+ a single bundled `index.d.ts`), so importing one primitive tree-shakes from
  ~11 kB (full) down to ~0.2 kB (`label`) / ~1.5 kB (`calendar`). A size-limit
  budget runs in CI (`.size-limit.json`).

### 🟠 P2 — robustness & reach

- [x] **4. E2E (real-browser)** — Playwright against the built docs site (every
  component has a live demo): smoke (hydration / no page errors) + interaction
  tests (dialog, calendar, switch, combobox), run in CI (`e2e.yml`). **Visual
  regression** added: `e2e/visual.spec.ts` pixel-diffs the styled demos against
  committed baselines (`pnpm visual` / `visual:update`); the `visual.yml`
  workflow runs in the pinned Playwright container for deterministic rendering
  (see `docs/visual-testing.md`). _Still open: a cross-browser matrix._
- [x] **5. i18n / localization** — an English message catalog + reactive i18n
  context (`createI18n`/`getI18n`) and a `LocaleProvider` (locale + message
  overrides + `dir` for RTL). Adopted by the date/time family (Calendar, Date
  Picker, Date Range Picker, Time Field); a label prop still overrides the
  catalog. Rollout to the remaining components is mechanical follow-up.
- [ ] **6. Second framework adapter** — prove the agnostic core with a **React**
  adapter over the existing `@design-system/core`, then a **Reflex** (Python)
  adapter that wraps the React components. First pass is a 4–6 component
  proof-of-concept (Button, Checkbox, Switch, Select, Dialog). Full plan,
  integration findings and the Python-behaviour constraint:
  `docs/adapters-roadmap.md`.
- [x] **7. SSR/hydration guarantee** — `ssr.test.ts` server-renders every
  fixture (`svelte/server` `render`, node env) so no component touches the DOM
  during SSR; runs in the normal test gate. Caught and fixed a real bug: Toolbar
  used `onMount` (threw under SSR) — converted to a client-only action, matching
  the rest of the codebase.

### 🟡 P3 — polish & ecosystem

- [x] **8. Token interop** — DTCG single source (`tokens.json`: `palette` +
  semantic `style` tier per the canonical naming grammar) + Style Dictionary
  build (`tokens:build` → CSS vars; SCSS/Swift/Kotlin/Dart ready). Parity test
  keeps the source in sync with the runtime `tokens.css`. See `docs/tokens.md`.
  _(First slice — extend the structure as the token spec evolves.)_
- [x] **9. API reference — auto-generated.** `scripts/generate-api.mjs` derives
  every component's props (name / type / default / required) from the Svelte
  source and merges curated descriptions into per-component JSON manifests
  (`packages/docs/src/generated/props/*.json`); docs pages render them via a
  `<PropsTable>` component, so the tables can't drift from the real props. A
  freshness test (`api-manifest.test.ts` → `pnpm api:check`) fails CI if the
  committed manifests are stale. (Replaced the earlier hand-written tables +
  `prop-docs.test.ts` drift guard.)
- [x] **10. Form integration** — native `<form>` participation. The value
  controls were rebuilt on **native inputs** (Checkbox/CheckboxGroup →
  `input[type=checkbox]`; Radio/RadioGroup/SegmentedControl/RatingGroup →
  `input[type=radio]`; Switch → `input[type=checkbox][role=switch]`; Slider →
  `input[type=range]`), so the browser owns accessibility, keyboard and form
  participation. Each gained a `name` prop. Select was later rebuilt on a
  native `<select>` as well (see ADR 0003). Controls that stay ARIA for good
  reason (Combobox, Date/DateRange Picker, PinInput, TimeField) submit via a
  mirrored hidden input under `name`; native fields (TextField) pass `name`
  straight through. Every control has a test asserting its value reaches
  `FormData`.
- [x] **11. Supply chain & contribution** — npm provenance (set in #1),
  Dependabot (npm + actions, grouped dev deps), CODEOWNERS, issue forms + PR
  template, `CODE_OF_CONDUCT.md`, `SECURITY.md` (private vuln reporting).
- [x] **12. Browser support matrix** — documented in `docs/browser-support.md`
  (evergreen, last-2-versions; per-feature minimums). `tokens.css` now ships an
  `@supports not (color-mix())` fallback so tinted status surfaces degrade to a
  neutral surface + solid border on pre-2023 engines.

## Order of work

P1 (1 → 2 → 3) first: they unblock real consumption and keep the codebase
consistent. Then P2 by impact (visual-regression and i18n give the most
benchmark lift), then P3.
