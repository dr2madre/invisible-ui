# Component audit: remediation report

Tracks the execution of the
[component audit remediation plan](./component-audit-remediation-plan.md),
one section per phase, updated as each phase lands. The closing section
collects the new issues that emerged while doing the work, which are not
part of the plan.

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

## Issues found during the work

New findings, not part of the remediation plan. Each needs its own
decision (issue and, where confirmed, a dedicated fix).

1. **ToggleButton (Svelte): `disabled` is not reactive after mount.** The
   prop is read once at creation; `pressed` has a reactive sync, `disabled`
   does not, so toggling it later never reaches the DOM. Found on 2026-08-08
   while writing the Toolbar DOM-change tests (the toolbar fixtures use
   native buttons to isolate the Toolbar behavior). The Vue version updates
   correctly.
2. **Vue: module-counter ids in `use-hover-preview.ts` (to verify).** The
   composable generates ids from a module counter (kept for the Vue `^3.4`
   peer range) instead of `useStableId`, so the SSR id drift fixed for
   Svelte in task 8 may exist for `Popover trigger="hover"` and `HoverCard`
   in Vue. The Vue hydration test may not cover these components.
3. **Minor: `PopoverDemo.svelte` styles are inline.** The docs demo is built
   on `style="…"` attributes throughout, against the project styling
   convention. Pre-existing debt, left as found.
4. **Local environment only: `pnpm lint` and `pnpm format:check` fail on
   untracked tooling directories** (`.claude/`, `.github/skills|agents|hooks/`,
   `.impeccable/`). Project files are clean; CI checks out a clean tree and
   is unaffected. Those directories must stay uncommitted.
