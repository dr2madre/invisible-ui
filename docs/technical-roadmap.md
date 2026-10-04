# Technical roadmap

The component build-out (Phases 1–6) and the live-demo docs are complete. This
roadmap tracks the **engineering / distribution maturity** of the design system
— the gaps that separate a *built* system from one a team can *publish, version
and maintain*.

## Already in place

- **Headless core** — framework-agnostic `state` / `connect` / prop-getter
  pattern (as in Zag/Ark) + complete Svelte, Vue and custom elements adapters.
  React is being completed to the full catalog and carries 72 components
  today; Reflex wraps the React set for Python consumers.
- **TypeScript** — `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`,
  `isolatedModules`, ES2022 / Bundler resolution.
- **Tokens** — two tiers (primitives → semantic role/state), dark mode
  (`prefers-color-scheme` + `[data-theme]`), WCAG AA, `color-mix` surfaces.
- **Accessibility tests** — component suites carry `vitest-axe` coverage.
- **RTL readiness** — CSS logical properties throughout.
- **Docs** — Astro + Starlight with a live Svelte demo per component; ADRs.
- **CI per-PR** — build + test + typecheck gate.

## Gaps — prioritized

Each item ships as its own PR. Checkboxes track progress.

### 🔴 P1 — distribution basics (a DS isn't consumable without these)

- [x] **1. Release & versioning** — Changesets + semver, `release.yml` workflow
  (version PR + `npm publish` with provenance), CHANGELOG per package,
  `publishConfig`, `repository` metadata, release scripts. **Parked/dormant:**
  the packages are `private: true` and the workflow is
  `workflow_dispatch`-only, so nothing publishes by accident. To go live later,
  follow the checklist at
  the top of `.github/workflows/release.yml` (unset `private`, own the npm
  scope to the Invisible UI scope you own — e.g. `@invisible-ui/*` — add `NPM_TOKEN`,
  flip the trigger to `push`).
- [x] **2. Lint / format / hooks** — ESLint 9 flat config (js +
  typescript-eslint + eslint-plugin-svelte + eslint-plugin-react-hooks +
  prettier compat) + Prettier
  (repo-wide) + husky + lint-staged + commitlint (conventional commits); `lint`
  and `format:check` added to the CI gate. `eslint-plugin-react-hooks`
  (`recommended-latest`: the rules of hooks and the React Compiler checks)
  runs on every React source: the adapter, its docs demos and the example app.
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
  committed baselines (`pnpm visual` / `visual:update`), and
  `e2e/visual-elements.spec.ts`, `e2e/visual-vue.spec.ts` and
  `e2e/visual-react.spec.ts` shoot the same set for the other adapters on
  pages the Vue example serves; the `visual.yml`
  workflow runs in the pinned Playwright container for deterministic rendering
  (see `docs/visual-testing.md`). The functional suite runs in a per-browser CI
  matrix for Chromium, Firefox and WebKit; visual baselines remain Chromium-only
  so pixel comparisons stay deterministic.
- [x] **5. i18n / localization** — an English message catalog + reactive i18n
  context (`createI18n`/`getI18n`) and a `LocaleProvider` (locale + message
  overrides + `dir` for RTL). Adopted by the date/time family (Calendar, Date
  Picker, Date Range Picker, Time Field); a label prop still overrides the
  catalog. Rollout to the remaining components is mechanical follow-up.
- [x] **6. Multi-framework adapters** — the portability proof expanded beyond
  its original scope. **Vue** (`packages/vue`) now carries the full Svelte
  catalog of 74 components as native Vue 3 components and composables, with
  `v-model`, `provide`/`inject` localization, ported CSS and 866 tests. The
  parity batches landed in PRs #193–#199 (ADR 0010). The original
  proof of concept started in **React**
  (`packages/react`): Button, Checkbox, Switch, Select, Combobox and
  Dialog over the existing `@design-system/core`, with the near-identity
  `normalizeProps` seam, a `useX()` hook per component, a minimal
  `LocaleProvider`, ported CSS (class names identical to Svelte, tokens guarded
  by a parity test) and tests incl. axe, SSR and hydration. **Confirmed:** the core needed *no*
  change to drive a second framework — the Combobox makes that claim
  load-bearing, the Dialog closes the overlay shape. **Reflex/Python**
  (`packages/reflex`, `import invisible_ui`): thin `rx.Component` wrappers over
  the React build (ADR 0006) with 8 render tests — nothing re-implemented in
  Python. Full plan and integration findings: `docs/adapters-roadmap.md`.
  React now targets the full catalog (item 14).
- [x] **7. Adapter SSR/hydration guarantees** — `ssr.test.ts` server-renders every
  Svelte fixture (`svelte/server` `render`, node env) so no component touches
  the DOM during SSR; runs in the normal test gate. Caught and fixed a real bug:
  Toolbar used `onMount` (threw under SSR) — converted to a client-only action,
  matching the rest of the Svelte codebase. **Vue now carries the equivalent
  guarantee:** a Node suite server-renders all 76 public component exports (the
  74-component catalog plus `Icon` and `LocaleProvider`), and a separate-runtime
  fixture hydrates representative stateful, overlay and date components without
  mismatches. Body-level Teleports render in place through hydration and move
  after mount, so Vue can locate the server nodes before creating viewport-level
  layers. **React now carries the same guarantee across its first
  surface:** all six catalog components plus `Icon` and `LocaleProvider`
  server-render without a DOM and hydrate together without mismatches or
  recoverable errors; the Combobox portal is created only after hydration.
  **Custom elements carry the framework-free equivalent:** both the selective
  and registration entrypoints import without browser globals, while a browser
  test proves declarative server-rendered light DOM upgrades after registration
  without losing labels, options or selected state. No virtual-DOM hydration
  step is involved.
- [x] **13. Custom elements: full catalog** — done. `packages/elements`
  carries all 80 components in the catalog, like Svelte and Vue. All batches
  are merged.
  `ds-locale-provider` carries i18n, the `e2e/elements-*.spec.ts` specs cover
  the elements in real browsers, and every element has its own tree-shaken
  budget in `.size-limit.json`. The original plan: the components were ported as custom elements over the same core, with the
  Svelte component as the model for markup, class names, tokens and tests.
  Each batch ships as its own PR and brings its generated API manifest, docs
  tab and browser tests. Batches follow shared shape rather than the alphabet:
  the dialog family first (Alert, Confirm, Prompt and Search Dialog, after the
  shared dialog header lands), then overlays and menus (Popover, Tooltip,
  Dropdown Menu, Context Menu, Menubar, Navigation Menu), then
  value controls (Radio, Slider, Range Slider, Number Field, Pin Input, Rating
  Group, Segmented Control, Toggle Button, Toggle Group), then the date and
  time family, then the presentational rest.
- [ ] **14. React: full catalog** — `packages/react` carries 72 of the 80
  components in the catalog: Button, Checkbox, Switch, TextField,
  SearchField, Select, Combobox, MultiSelect, the dialog family (Dialog,
  Alert Dialog, Confirm Dialog, Prompt Dialog, Sheet Dialog and Search
  Dialog, batch 1), the overlays and menus (Popover, Tooltip, Dropdown
  Menu, Context Menu, Menubar and Navigation Menu, batch 2; the menus
  render submenus, the first adapter to do so), the value controls (Radio,
  Radio Group, Checkbox Group, Segmented Control, Toggle Button, Toggle
  Group, Slider, Range Slider, Number Field, Pin Input and Rating Group,
  batch 3), the date and time family (Calendar, Date Picker, Date Range
  Picker and Time Field, batch 4), navigation and structure (Tabs,
  Accordion, Collapsible, Breadcrumb, Pagination, Stepper, Sidebar, Tree
  View, Button Group and Separator, batch 5), the presentational
  components (Avatar, Avatar Group, Count, Tag, Kbd, Code, Code Block,
  Blockquote, Skeleton, Aspect Ratio, Scroll Area, Progress, Meter, Link,
  Label, Field and Card, batch 6), feedback (Loading, Loading Generation
  Area, Feedback Icon, Empty State, Error State, Inline Notification,
  Notification and Notification Region, batch 7), Icon and LocaleProvider.
  Svelte, Vue and custom elements carry all of them. The
  remaining components are ported as React components and `use*` hooks over
  the same core, with the Svelte component as the model for markup, class
  names, tokens and tests. Batches follow shared shape rather than the
  alphabet. Each batch ships as its own PR and brings its generated API
  manifest, docs tab and tests.
- [ ] **15. Flutter adapter** — runs in parallel with item 14, React: full
  catalog ([ADR 0017](./adr/0017-flutter-adapter.md), accepted). The shared
  groundwork comes first: `tokens.json` moves to `packages/tokens/`, the
  roles, sizes, focus ring and density move into it, and the menu spec gains
  submenus ([`docs/menu-submenu-spec.md`](./menu-submenu-spec.md)). Then `packages/flutter` (Dart package `invisible_ui`)
  reimplements component behaviour against the Svelte reference, with the
  first wave the ADR lists. The Timelog proposal is in
  [`docs/proposals/flutter-adapter.md`](./proposals/flutter-adapter.md) and
  the discovery in
  [`docs/proposals/flutter-discovery.md`](./proposals/flutter-discovery.md).
  Progress: `packages/flutter` carries the foundation (generated tokens
  checked by `pnpm tokens:check`, `InvisibleTheme` with light and dark,
  density, minimum target size, focus ring and messages), Button, the
  fields Field, TextField, Textarea and NumberField, Tooltip, Toolbar,
  Dropdown Menu with submenus (on a shared menu keyboard layer that runs the
  `core/` menu vectors), Inline Notification, Notification and Notification
  Region (holding notifications while a modal is open, ADR 0016), Loading,
  Empty State, Error State, Card, the dialog family (Dialog, Alert Dialog
  and Confirm Dialog, with the ADR 0016 status area and dialogs on top) and
  the first part of Timelog's second wave: Checkbox, Checkbox Group, Switch,
  Radio Group (`RadioButtonGroup`, since the widgets library has a
  `RadioGroup`), Segmented Control, Select, Combobox and Popover, then the
  dates: Calendar (month and two-month views, single and range), Date
  Picker, Date Range Picker and Time Field, then the disclosures and
  navigation: Collapsible, Accordion, Tabs (automatic and manual
  activation, both orientations), Breadcrumb, Pagination and Link (opened
  through the app's callback), and Progress and Meter, each with its parity
  checklist in `packages/flutter/parity/`, and the `flutter.yml` workflow.
  The number
  field's logic answers the shared test vectors in
  `core/src/number-field/__vectors__`, the select typeahead and collection
  navigation those in `core/src/select/__vectors__`, the calendar grid,
  keys, bounds, ranges and localized names those in
  `core/src/calendar/__vectors__`, and the time field's parsing, bounds and
  key sequences those in `core/src/time-field/__vectors__`, and the tabs
  keyboard model, the accordion toggles, the pagination page lists and the
  progress and meter readings those in `core/src/tabs`, `accordion`,
  `pagination`, `progress` and `meter`, read by the core and the Flutter
  tests. Every component of the first wave in ADR 0017 is in. Of what
  follows it, Card, Collapsible and Timelog's dialogs, forms, pickers and
  Date Picker are in; the rest of wave 2 (the navigation bar) and the specs
  for the section header and the colour swatch are next.
- [x] **16. Svelte: runes syntax** — the Svelte adapter moved from the legacy
  syntax to runes mode in three phases
  ([ADR 0015](./adr/0015-svelte-runes.md)). Phase 1 moved the 27
  presentational components with no public API change. Phase 2 moved the 19
  controllable components: one shared mirror carries the ADR 0011 and ADR 0012
  rules, and `bind:` keeps working through `$bindable()`. Phase 3 moved the
  last 34 components, turned named slots into snippets and forwarded events
  into callback props, and is breaking. Every component, internal part and
  fixture now runs in runes mode, and the docs demos and the example app use
  the new API.

### 🟡 P3 — polish & ecosystem

- [x] **8. Token interop** — DTCG single source (`tokens.json`: `palette` +
  semantic `style` tier per the canonical naming grammar) + Style Dictionary
  build (`tokens:build` → CSS vars; SCSS/Swift/Kotlin/Dart ready). Parity test
  keeps the source in sync with the runtime `tokens.css`. See `docs/tokens.md`.
  _(First slice — extend the structure as the token spec evolves.)_
- [x] **9. API reference — auto-generated.** `scripts/generate-api.mjs` derives
  every component's API (name / type / default / required) from each adapter
  that ships it, Svelte, Vue, React and the web components, and merges curated
  descriptions into per-component JSON manifests
  (`packages/docs/src/generated/props/*.json`); docs pages render them via
  `<PropsTable>` and `<ImportSnippet>`, one tab per framework, so the tables
  can't drift from the real components. A
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
maturity lift), then P3.
