# Component audit: remediation report

Tracks the execution of the
[component audit remediation plan](./component-audit-remediation-plan.md),
one section per phase, updated as each phase lands. The closing section records
the triage of findings that emerged while doing the work and links confirmed
defects back to the plan.

## Phase 1: security and custom element correctness

Merged 2026-08-08 (#244), tasks 1 to 4.

- The combobox builds an option's icon through the DOM instead of an HTML
  string, so consumer data never reaches an HTML parser.
- Clearing a combobox is one complete transition: state, attribute, visible
  input, form value, and a single `change` event.
- Every dialog mints its own ids; an explicit host id still wins.
- A list assigned before the element connects survives the first render in
  select, combobox and the two groups.

## Phase 2: accessibility, interaction and SSR

Done on branch `fix/audit-phase-2` (2026-08-08 / 2026-08-09), tasks 5 to 8.

### 5. Link semantics restored

- `href` is required in Svelte and Vue; the handler-only anchor API
  (`onpress` / `onPress`) is removed. Click events fall through natively for
  work that accompanies a navigation (e.g. analytics).
- Consumers (EmptyState, ErrorState), fixtures, API manifests and
  `link.mdx` updated; action use cases point to Button.
- Tests cover Tab navigation and Enter activation in both frameworks.

### 6. One accessible Hover Card model

- Contract stated everywhere the same way: the preview is supplementary,
  holds nothing focusable, and interactive content belongs to the
  click-triggered Popover.
- Fixtures and demos lost their interactive descendants; both frameworks
  now run a "holds no focusable content" test (Svelte Popover hover, Vue
  Popover hover, Vue HoverCard).
- Docblocks, `popover.mdx` and the docs demo updated; the click example now
  shows interactive content and the focus behavior.

### 7. Toolbar roving focus valid after DOM changes

- Svelte and Vue toolbars reconcile their controls through a
  `MutationObserver` (children plus `disabled` / `aria-disabled` changes):
  exactly one enabled control keeps `tabindex="0"`, the last focused control
  is preserved when possible, the first enabled control is the fallback.
- Six new tests per framework: insertion, removal, disabled-state change,
  tab-stop preservation, arrow keys skipping disabled controls, Tab entering
  the toolbar exactly once.

### 8. Deterministic Svelte ids across SSR and hydration

- New `packages/svelte/src/lib/internal/stable-id.ts`: one counter per
  prefix; on the server the scope resets after each render, in the browser
  it runs for the life of the page. Repeated requests from one server
  process serve the ids a fresh client runtime expects.
- Wired into 26 `create-*` factories (explicit consumer ids stay
  authoritative) and replaced the 8 module-level `_uid` counters in the
  styled components.
- New separate-runtime hydration test: a child Node process without a DOM
  renders the fixture twice through Vite SSR (the two responses must be
  identical), then the test hydrates that HTML in jsdom and asserts no
  hydration warnings, unique ids, resolving `aria-labelledby` /
  `aria-describedby` / `aria-controls` / `for` references, and a working
  popover after hydration. The test was mutation-checked: removing the
  server reset makes it fail.

### Verification

Full monorepo test run green (Svelte 801 tests, all packages), typecheck,
`api:check` (manifests regenerated), Prettier and ESLint clean on project
files.

## Phase 3: developer experience and release verification

Done on branch `fix/audit-phase-3` (2026-08-09), tasks 9 and 10, plus the
targeted browser verification for the flows this plan changed.

### 9. Repository checks are line-ending invariant

- `.gitattributes` stores and checks out every text file with LF; binary
  files are marked as such.
- The API freshness comparison in `scripts/generate-api.mjs` normalizes line
  endings before comparing, so a CRLF checkout is not drift. Verified both
  ways: a manifest converted to CRLF passes the check, a content change
  still fails it.

### 10. The built core package, verified as a consumer sees it

- The dist emitted by tsup used the extensionless relative specifiers of the
  sources ("./types", "./button"). Bundlers resolve them, plain Node ESM
  rejects them, so the packed package could not be imported at all. A
  post-build step now rewrites every dist specifier to the file it resolves
  to ("./types.js", "./button/index.js"); the unbundled tree-shakeable shape
  is unchanged and the size limits stay green, tree-shaken entries included.
- A new package smoke test (`pnpm --filter @design-system/core run smoke`)
  packs the package, has npm install the tarball into a temporary consumer,
  imports the entry in plain Node ESM, and type-checks a consumer file with
  `nodenext` resolution against the published declarations. The release
  workflow runs it before publishing. Mutation-checked: the smoke test fails
  on the unpatched dist.

### Targeted browser verification

- Three new Playwright tests against the docs demos, run in Chromium,
  Firefox and WebKit: Link keyboard activation; hover Popover previewing on
  keyboard focus without taking it, with nothing focusable inside; click
  Popover moving focus to its first control and returning it on Escape.
- The click test found a real defect the jsdom tests could not see: in the
  browser, Escape closed the panel but focus fell to the page body instead
  of returning to the trigger. The close handler tears the panel down
  synchronously, before the listener that records the keyboard dismiss had
  run. Fixed in the Svelte adapter (the flag listener now runs in the
  capture phase, registered first); the Vue composable received the same
  hardening for parity.
- SSR-to-hydration id stability and the packed-package import are covered by
  the phase 2 hydration test and the task 10 smoke test.
- Still open for the maintainers: the plan's manual keyboard pass and the
  screen reader pass with NVDA or VoiceOver.

## Findings triaged after Phase 2

1. **Confirmed — ToggleButton (Svelte): `disabled` is not reactive after
   mount.** The
   prop is read once at creation; `pressed` has a reactive sync, `disabled`
   does not, so toggling it later never reaches the DOM. Found on 2026-08-08
   while writing the Toolbar DOM-change tests (the toolbar fixtures use
   native buttons to isolate the Toolbar behavior). The Vue version updates
   correctly. Scheduled as task 11 in Phase 4.
2. **Not confirmed — Vue hover-preview ids.** `use-hover-preview.ts` already
   calls `useStableId`, whose counters are scoped to the Vue application
   context. Each SSR request therefore has an independent scope and a fresh
   client application reproduces the server ids. The adjacent comment that
   described a module counter was stale and has been corrected; there is no
   separate id defect to schedule.
3. **Not confirmed — inline styles in `PopoverDemo.svelte`.** Inline layout
   styles are widespread in the documentation demos and no repository rule
   currently prohibits them. This is not an audit defect. A broader demo-style
   refactor should happen only after adopting an explicit convention.
4. **Confirmed, local environment only — repository gates inspect untracked
   tooling directories.** `pnpm lint` and `pnpm format:check` include
   `.claude/`, `.github/skills|agents|hooks/` and `.impeccable/`. Project files
   are clean; CI checks out a clean tree and
   is unaffected. Those directories must stay uncommitted. Scheduled as task
   12 in Phase 4.

## Findings from Phase 3

Both were verified against the current code and are scheduled in Phase 4.

1. **Confirmed — the jsdom tests do not prove focus restoration.** With the
   popover defect reinstated, the Svelte suite still passes in full,
   including the test named "closes on Escape and returns focus to the
   trigger": in jsdom focus appears to return to the trigger while the real
   browser leaves it on the page body. Focus management therefore needs
   browser coverage to count as verified, and today that coverage exists
   only for the three flows added in Phase 3. Scheduled as task 13 in
   Phase 4, which selects the focus contracts that earn a browser test.
2. **Confirmed — the Vue side of the popover focus fix is unverified in a
   browser.** The Vue composable received the same capture-phase hardening
   for parity, but the end-to-end suite runs against the documentation site,
   which is Svelte, so no Vue code path is exercised in a browser. Combined
   with the finding above, the Vue fix currently rests on tests that cannot
   see this class of defect. Scheduled as task 14 in Phase 4, which builds a
   Vue harness Playwright can drive.

Checked and dismissed: the Node ESM specifier defect fixed in task 10 is
specific to core, the only package whose output stays unbundled. The svelte,
vue, react and elements bundles import cleanly in plain Node.

Local environment only: the Playwright browser binaries for Firefox and
WebKit were missing on the development machine, so the first full end-to-end
run failed to launch them. `pnpm exec playwright install` fixed it. CI
provisions its own browsers, so this is not a project defect.
