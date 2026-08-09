# Component audit remediation plan

Status: proposed remediation scope, implementation pending

Audit baseline: `9746b43` on `main`

Audit date: 8 August 2026

## Purpose

This plan closes the confirmed accessibility, usability, security, logic and
developer experience defects found in the component audit. It defines a bounded
review with a clear stop condition.

The implementation follows:

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/), at level AA where applicable;
- the relevant [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/);
- the [Nielsen Norman Group usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/);
- the repository rules for framework parity, native semantics and headless core
  behavior.

Automated accessibility checks cover machine-detectable rules. Keyboard, focus,
screen reader and real-browser verification cover interaction behavior.

## Audit baseline

The audit covered the 34 core primitives and the public Svelte, Vue, React and
custom element surfaces. At the baseline:

- 2,178 of 2,179 unit and integration tests passed;
- type checks, lint, builds, documentation checks and size limits passed;
- the dependency audit reported no known vulnerabilities in 1,241 dependencies;
- the only test failure was a Windows line-ending false positive in the Svelte
  API manifest check;
- the working tree was clean.

The audit found six confirmed release-blocking defects and four bounded
robustness or developer experience tasks. Passing axe checks left the keyboard
and focus defects below detectable only through interaction analysis.

## Phase 1: security and custom element correctness

Complete these tasks in one focused pull request.

### 1. Remove the Combobox HTML injection sink

- Replace the consumer-controlled `item.icon` interpolation into `innerHTML`
  with SVG DOM creation and `setAttribute`.
- Keep internal constant icon templates unchanged. Reuse the safe helper when
  that stays within this task.
- Add a regression test with an icon value that attempts to break out of the
  SVG path attribute.

Acceptance:

- the icon path renders for valid SVG path data;
- hostile input changes only the SVG path data;
- the custom element test suite and dependency audit pass.

### 2. Make Combobox clear a complete state transition

- Remove the host `value` attribute when the selected value becomes `null`.
- Clear the form value and visible input.
- Emit one `change` event with `detail.value` set to `null`.
- Prevent attribute synchronization from emitting duplicate events.

Acceptance:

- clear updates the property, attribute, input and form value;
- clear emits exactly one event;
- disconnecting and reconnecting the element does not restore the previous
  selection.

### 3. Give every Dialog instance unique IDs

- Replace the shared `ds-dialog-el` fallback with one stable ID per instance.
- Preserve an explicit host ID when the consumer provides one.
- Add a test that mounts two dialogs and checks their trigger, title and content
  associations.

Acceptance:

- two dialogs have no duplicate IDs;
- each `aria-controls` and `aria-labelledby` value resolves inside the correct
  dialog;
- each dialog opens and closes independently.

### 4. Preserve `items` assigned before connection

- Correct the initialization order for Select, Combobox, RadioGroup and
  CheckboxGroup.
- Preserve property values assigned before the element connects or before its
  custom element definition loads.
- Keep declarative light-DOM `<option>` children as the source when no property
  value was assigned.
- Reapply the current Select value after rebuilding its options.

Acceptance:

- property-before-connect and property-before-upgrade tests pass for all four
  components;
- declarative options retain current behavior;
- rebuilding options retains a still-valid selected value and clears an invalid
  value consistently.

## Phase 2: accessibility, interaction and SSR

Complete these tasks in a second pull request. Keep Svelte and Vue behavior in
parity.

### 5. Restore correct Link semantics

- Require `href` for Link behavior.
- Remove or deprecate the handler-only anchor API.
- Direct action use cases to Button instead of adding `role`, `tabindex` and a
  custom keyboard simulation to an anchor.
- Update API manifests, examples and documentation.

Acceptance:

- every rendered Link has native link semantics and keyboard behavior;
- action examples use Button;
- tests cover Tab navigation and Enter activation in Svelte and Vue.

### 6. Define one accessible Hover Card model

- Treat Hover Card as supplementary, non-interactive preview content.
- Remove interactive controls from its fixtures, examples and documented API
  contract.
- Direct interactive content to the click-triggered Popover pattern.
- Retain pointer hoverability, focus-triggered visibility, Escape dismissal and
  persistent display while the pointer remains over the content.

Acceptance:

- keyboard users can reveal and dismiss the preview without losing their place;
- every documented Hover Card descendant is non-focusable;
- Popover examples cover interactive content and focus behavior;
- Svelte and Vue tests reflect the same contract.

This decision avoids artificial Tab order across a body-level portal and keeps
the interaction consistent with platform expectations.

### 7. Keep Toolbar roving focus valid after DOM changes

- Reconcile the toolbar controls when children are added, removed or disabled.
- Keep exactly one enabled control at `tabindex="0"`.
- Move the tab stop to the first enabled control when the current control becomes
  unavailable.
- Preserve the last focused enabled control when possible.

Acceptance:

- tests cover insert, removal and disabled-state changes;
- Tab enters the toolbar once;
- arrow-key navigation skips disabled controls;
- Svelte and Vue expose the same behavior.

### 8. Make Svelte IDs deterministic across SSR and hydration

- Replace shared module counters at the Svelte adapter boundary with an ID scope
  that is stable for one server render and its client hydration.
- Keep explicit consumer IDs authoritative where the API supports them.
- Add a separate-runtime hydration test equivalent to the Vue and React tests.
- Cover representative field, collection and overlay components.

Acceptance:

- repeated requests in one server process do not change the IDs expected by a
  fresh client runtime;
- hydration reports no mismatch or recoverable error;
- labels, descriptions, active descendants and overlay relationships resolve
  after hydration.

## Phase 3: developer experience and release verification

Complete these tasks in a third pull request.

### 9. Make repository checks line-ending invariant

- Add a repository line-ending policy with `.gitattributes`.
- Normalize generated API text before the freshness comparison, or compare
  parsed JSON where appropriate.
- Limit source changes to the line-ending policy and freshness comparison.

Acceptance:

- `pnpm format:check` and `pnpm api:check` pass on clean Linux and Windows
  checkouts;
- `git status` stays clean after the checks;
- real API drift still fails the freshness check.

### 10. Verify the built core package as a consumer sees it

- Add a package smoke test that imports the built core entry point in supported
  Node ESM without source aliases.
- Produce Node-compatible relative imports or a bundled entry point while
  retaining measured tree shaking.
- Run the smoke test in the release gate before removing `private: true`.

Acceptance:

- a temporary consumer can install and import the packed core package;
- TypeScript resolves its declarations;
- existing size limits remain green;
- the test uses package output, not workspace source files.

## Phase 4: follow-up defects found during implementation

Complete these tasks in a fourth pull request. They were found while Phases 2
and 3 were being implemented, and confirmed against the current code after the
phase that surfaced them.

### 11. Keep Svelte ToggleButton `disabled` reactive

- Add a state transition that updates `disabled` after creation, matching the
  existing controlled `pressed` synchronization.
- Wire the styled ToggleButton prop to that transition without changing
  uncontrolled pressed-state behavior.
- Cover both enabling and disabling after mount.

Acceptance:

- changing the Svelte `disabled` prop updates the native input and its styling;
- a newly disabled ToggleButton cannot change state or call
  `onPressedChange`;
- re-enabling restores native keyboard and pointer activation;
- a ToggleButton inside Toolbar participates correctly in disabled-state
  reconciliation;
- Vue behavior remains unchanged and in parity.

### 12. Isolate optional local tooling from repository gates

- Define the repository-owned scope for Prettier and ESLint so optional local
  agent, hook and skill installations do not enter project checks.
- Keep those installations untracked; do not reformat or commit third-party
  tool sources as project code.
- Preserve strict checks for every tracked source and configuration file.

Acceptance:

- `pnpm lint` and `pnpm format:check` pass on clean project files when the
  supported local tooling directories are present;
- an intentionally malformed tracked project file still fails the relevant
  gate;
- the local tooling directories remain untracked and CI behavior is unchanged.

### 13. Verify the high-risk focus contracts in a browser

jsdom tests stay useful for state, callbacks, attributes and logic. They are
not conclusive when the behavior depends on:

- removal of the active node;
- a portal or a teleport;
- native event order;
- Escape dismissal;
- focus restoration;
- an outside press or a focus leave.

Add risk-based Playwright coverage without duplicating the unit tests
wholesale.

Cover at least:

- Svelte Popover: opening, focus inside the panel, Escape, closing and the
  return to the trigger;
- the Popover closed by an outside press, with no arbitrary focus restoration;
- the Popover closed by a focus leave, with no return to the trigger;
- Dialog: assert explicitly where focus lands after Escape;
- other overlays only when they carry the same teardown or focus restoration
  risk.

Acceptance:

- the selected focus contracts are verified in Chromium, Firefox and WebKit;
- reinstating the Svelte Popover defect makes its end-to-end test fail;
- the jsdom tests remain in place and stop being presented as the only
  evidence of browser behavior;
- the mutations used to verify the tests are not committed.

### 14. Build a Playwright harness for Vue

The documentation site is Svelte and never exercises the Vue adapter. Build a
real, minimal Vue harness, reusing `examples/vue` where it fits, or a dedicated
end-to-end fixture where that isolates better.

Requirements:

- it imports `@design-system/vue` as a real consumer;
- it never routes through Svelte components;
- it exposes stable content and selectors based on roles and accessible names;
- the Playwright configuration starts it explicitly;
- it adds no dependency while the existing infrastructure suffices.

Cover at least the Vue Popover:

- opening moves focus to the first control in the panel;
- Escape closes it and returns focus to the trigger;
- an outside press closes it without forcing the return to the trigger;
- a focus leave closes it without improper restoration.

Acceptance:

- the Vue tests pass in Chromium, Firefox and WebKit;
- reinstating the faulty bubble-phase listener makes the focus restoration
  test fail;
- restoring the fix returns every browser to green;
- no test declared as Vue runs against the Svelte documentation site.

## Targeted browser and assistive technology verification

Add or extend browser tests only for the high-risk flows changed by this plan:

- Link and Button keyboard semantics;
- Hover Card and interactive Popover focus behavior;
- two independent Dialog instances;
- Toolbar child insertion, removal and disabling;
- ToggleButton disabling and re-enabling after mount, including inside Toolbar;
- Combobox clear, form value and reconnection;
- Svelte SSR-to-hydration ID stability;
- built-package import in a clean consumer.

Run the interaction set in Chromium, Firefox and WebKit. Perform one manual
keyboard pass with visible focus and one screen reader pass with NVDA or
VoiceOver. Record only reproducible failures. Open visual tasks only when a
defined design requirement identifies the defect.

## Required gates

Each pull request runs the checks relevant to its scope. The final state passes:

```text
pnpm lint
pnpm format:check
pnpm api:check
pnpm exec turbo run build typecheck test
pnpm size
pnpm e2e
pnpm audit
```

The final review also confirms:

- no untrusted value reaches an HTML parsing sink;
- native semantics take precedence over simulated roles;
- keyboard focus remains visible, ordered and recoverable;
- Svelte and Vue behavior remains in parity for shared components;
- public APIs and examples describe the implemented behavior.

## Explicit non-goals

This plan does not include:

- a rewrite of the core or adapters;
- one browser test for every presentational component;
- direct axe tests for wrappers already covered through composed components;
- expansion of the React or custom element proof-of-concept catalogs;
- speculative performance work;
- visual changes without a documented usability or accessibility defect;
- publication of the packages.

## Stop condition

Close this audit when all fourteen tasks meet their acceptance criteria, the required
gates pass, and the targeted keyboard and screen reader checks find no
reproducible blocker.

After that point, handle new findings through normal issue triage. Reopen this
audit only when a failing test, a reproducible user problem, a standards change
or a supported-platform regression provides new evidence.
