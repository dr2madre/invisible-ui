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

## Phase 4: follow-up defects found during implementation

Done on branch `fix/audit-phase-4`, tasks 11 to 14.

### 11. Svelte ToggleButton `disabled` is reactive

- `core` gains a pure `setDisabled` transition that changes availability and
  keeps the pressed value, matching the existing `togglePressed` shape.
- The Svelte factory exposes `setDisabled`, and the styled component syncs the
  prop through it. The disabled sync runs before the pressed sync, so a control
  re-enabled and pressed in the same update accepts the new pressed value.
- Covered in `core` (transition, including the unchanged-value identity), in
  the styled component (turning disabled on and off after mount, no
  `onPressedChange` while disabled, pointer and keyboard restored on re-enable)
  and in Toolbar, where a toggle button that becomes disabled hands the tab
  stop over and a re-enabled one rejoins the arrow-key order.
- Vue was already reactive: its composable recomputes `disabled` on every
  render. Its behavior is unchanged.
- Mutation-checked: removing the disabled sync fails six of the new tests.

### 12. Optional local tooling stays out of the repository gates

- Prettier and ESLint now exclude the per-machine tooling directories
  (`.claude/`, `.impeccable/`, `.github/agents|hooks|skills/`), and `.gitignore`
  keeps them untracked, which the repository documentation already assumed.
- `pnpm lint` and `pnpm format:check` pass with those directories present.
- Verified they still fail on tracked project files: an unformatted file is
  reported by Prettier, and an unused variable by ESLint.

### 13. High-risk focus contracts verified in a browser

- Three Playwright tests added to the existing docs-driven suite: the click
  Popover closing on an outside press without pulling focus back, the same
  panel closing when focus leaves and staying where the user went, and Dialog
  asserting explicitly that focus is inside the panel while open and back on
  the trigger after Escape.
- Together with the Phase 3 tests, the selected contracts (focus in, Escape
  restore, outside press, focus leave) run in Chromium, Firefox and WebKit.
- The jsdom tests stay in place. They remain the fast check for state,
  attributes and callbacks, and are no longer the only evidence for focus
  behavior.

### 14. A Playwright harness for the Vue adapter

- The Vue example (`examples/vue`) gained a second Vite entry, `harness.html`,
  mounting a minimal `Harness.vue` that imports `Popover` and `Button` from
  `@design-system/vue` as any consumer would. No Svelte code is involved and no
  dependency was added: the example already carried Vue, Vite and the plugin.
- The Playwright configuration starts it explicitly as a second web server on
  its own port, with a strict port so a busy port fails loudly instead of
  drifting to another one.
- `e2e/vue.spec.ts` drives that page only, selecting by role and accessible
  name, and covers the four Vue Popover focus contracts: focus moves to the
  first control on open, Escape closes and returns focus to the trigger, an
  outside press closes without restoring focus, and a focus leave closes
  without pulling focus back.
- The end-to-end workflow now builds the Vue example alongside the docs site.

### Verification

- A frozen install, `pnpm test` (all packages), `pnpm typecheck`, `pnpm build`,
  `svelte-check` and `astro check`, `pnpm lint`, `pnpm format:check`,
  `pnpm api:check`, `pnpm size`, the core smoke test and `pnpm audit` all
  pass. The audit is green after the `nanoid` override fix recorded below.
- `pnpm e2e` passes in Chromium, Firefox and WebKit: 63 tests.
- Mutation checks, both reverted before committing: restoring the Svelte
  bubble-phase listener fails the Svelte Escape focus test, and restoring the
  Vue one fails the Vue Escape focus test. In both cases only that test fails,
  which is the expected signal, since the outside-press and focus-leave tests
  assert that focus is not restored.
- Not performed, and still open for the maintainers: the manual keyboard pass
  with visible focus, the screen reader pass with NVDA or VoiceOver, and any
  touch, zoom or reflow check. Nothing in this phase substitutes for them.

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

## Findings from Phase 4

1. **Found and fixed — a repository override pinned a vulnerable `nanoid`.**
   `pnpm audit` failed with one high advisory, GHSA-2v37-7h3g-55p8, which
   needs `nanoid` 3.3.18 or later. The version came from this repository:
   `pnpm.overrides` forced `nanoid@3` to `3.3.17`. The chain is
   development-only, `eslint-plugin-svelte` to `postcss` to `nanoid`, so no
   published package carried it, but the gate is required and the pin was
   ours to correct. The override now reads `3.3.18`; the lockfile was
   regenerated with pnpm 10.33.0 and changed nothing else, `pnpm why nanoid`
   confirms the single development chain, and `pnpm audit` reports no known
   vulnerabilities. The gate is green again.
2. **Local environment only — `turbo` cannot spawn `pnpm` in this shell.**
   Running `pnpm exec turbo run …` fails with "unable to spawn child process"
   because `pnpm` is reachable through Corepack but not on `PATH`. The root
   scripts (`pnpm build`, `pnpm test`) work, since pnpm puts itself on `PATH`
   for the scripts it runs, and CI installs pnpm normally. Not a project
   defect.
3. **Local environment only — neighbouring ports were occupied.** Ports 4322
   to 4334 were held by preview servers from another checkout on the same
   machine, and Vite silently moved to a free port, which left the browser
   tests waiting on a URL nobody answered. The harness server now uses a
   strict port, so this fails immediately and legibly instead.
